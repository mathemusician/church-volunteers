import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { formatPhoneNumber } from '@/lib/sms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  let client;

  try {
    const { listId } = await params;
    const { name, phone, eventId } = await request.json();

    // Validate listId is a valid integer
    const listIdInt = parseInt(listId, 10);
    if (isNaN(listIdInt) || listIdInt <= 0) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    client = await getClient();

    // Format phone early
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    // Start transaction with SERIALIZABLE isolation to prevent race conditions
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // Get the original list info to find the role title
    const listResult = await client.query(
      `SELECT vl.id, vl.title, vl.event_id, ve.template_id
       FROM volunteer_lists vl
       JOIN volunteer_events ve ON vl.event_id = ve.id
       WHERE vl.id = $1`,
      [listIdInt]
    );

    if (listResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const originalList = listResult.rows[0];

    // Determine target list ID based on selected event
    let targetListId = parseInt(listId);

    if (eventId && eventId !== originalList.event_id) {
      // Find the list with the same title in the target event
      const targetResult = await client.query(
        `SELECT id FROM volunteer_lists WHERE event_id = $1 AND title = $2`,
        [eventId, originalList.title]
      );

      if (targetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Role not available for selected date' },
          { status: 404 }
        );
      }
      targetListId = targetResult.rows[0].id;
    }

    // Lock the target list row and get current state in one query
    const lockResult = await client.query(
      `SELECT vl.id, vl.is_locked, vl.max_slots, COUNT(vs.id)::int as signup_count
       FROM volunteer_lists vl
       LEFT JOIN volunteer_signups vs ON vl.id = vs.list_id
       WHERE vl.id = $1
       GROUP BY vl.id
       FOR UPDATE OF vl`,
      [targetListId]
    );

    if (lockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const targetList = lockResult.rows[0];

    // Check if locked
    if (targetList.is_locked) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'This role is locked for the selected date' },
        { status: 403 }
      );
    }

    // Check if full
    if (targetList.max_slots && targetList.signup_count >= targetList.max_slots) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        {
          error: 'Sorry, this spot was just taken! Please select another date.',
          code: 'SLOT_TAKEN',
        },
        { status: 409 }
      );
    }

    // Insert the signup (we hold the lock, so this is safe)
    const signupResult = await client.query(
      `INSERT INTO volunteer_signups (list_id, name, position, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [targetListId, name.trim(), targetList.signup_count, formattedPhone]
    );

    const signup = signupResult.rows[0];

    // Get event details for response (still within transaction)
    const eventResult = await client.query(
      `SELECT ve.title, ve.event_date, vl.title as role_title
       FROM volunteer_events ve
       JOIN volunteer_lists vl ON vl.event_id = ve.id
       WHERE vl.id = $1`,
      [targetListId]
    );

    // Commit the transaction
    await client.query('COMMIT');

    const eventInfo = eventResult.rows[0];

    return NextResponse.json(
      {
        id: signup.id,
        name: name.trim(),
        role: eventInfo.role_title,
        eventTitle: eventInfo.title,
        eventDate: eventInfo.event_date,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Rollback on any error (only if client was acquired)
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Ignore rollback errors
      }
    }

    // Handle serialization failures (concurrent transaction conflict)
    if (error.code === '40001') {
      return NextResponse.json(
        {
          error: 'Sorry, this spot was just taken! Please select another date.',
          code: 'SLOT_TAKEN',
        },
        { status: 409 }
      );
    }

    console.error('Error registering volunteer:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  } finally {
    // Always release the client back to the pool (only if acquired)
    if (client) {
      client.release();
    }
  }
}
