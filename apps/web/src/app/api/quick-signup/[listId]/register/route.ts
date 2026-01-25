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
    let targetListId = listIdInt;

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
      `SELECT ve.id as event_id, ve.title, ve.event_date, vl.title as role_title
       FROM volunteer_events ve
       JOIN volunteer_lists vl ON vl.event_id = ve.id
       WHERE vl.id = $1`,
      [targetListId]
    );

    const eventInfo = eventResult.rows[0];

    if (!eventInfo) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Commit the transaction first to release locks
    await client.query('COMMIT');

    // Get other available roles for the same event (for cross-sell on confirmation)
    // This runs after commit since it doesn't need to be atomic with the signup
    const otherRolesResult = await client.query(
      `SELECT 
        vl.id as list_id,
        vl.title,
        vl.description,
        vl.max_slots,
        vl.is_locked,
        COUNT(vs.id)::int as signup_count
       FROM volunteer_lists vl
       LEFT JOIN volunteer_signups vs ON vl.id = vs.list_id
       WHERE vl.event_id = $1 
         AND vl.id != $2
         AND vl.is_locked = false
       GROUP BY vl.id
       HAVING vl.max_slots IS NULL OR COUNT(vs.id) < vl.max_slots
       ORDER BY vl.title
       LIMIT 3`,
      [eventInfo.event_id, targetListId]
    );

    const otherRoles = otherRolesResult.rows.map((row: any) => ({
      list_id: row.list_id,
      title: row.title,
      description: row.description,
      spots_remaining: row.max_slots ? row.max_slots - row.signup_count : null,
    }));

    // Get other available dates for the same role (for cross-sell on confirmation)
    // Find sibling events from the same template with the same role title
    // Only query if we have a template_id (standalone events won't have siblings)
    let otherDatesResult = { rows: [] };
    const templateCheck = await client.query(
      `SELECT template_id FROM volunteer_events WHERE id = $1`,
      [eventInfo.event_id]
    );
    const templateId = templateCheck.rows[0]?.template_id;

    if (templateId) {
      otherDatesResult = await client.query(
        `SELECT 
          ve.id as event_id,
          ve.event_date,
          vl.id as list_id,
          vl.max_slots,
          COUNT(vs.id)::int as signup_count
         FROM volunteer_events ve
         JOIN volunteer_lists vl ON vl.event_id = ve.id AND vl.title = $1
         LEFT JOIN volunteer_signups vs ON vs.list_id = vl.id
         WHERE ve.template_id = $3
           AND ve.id != $2
           AND ve.is_template = false
           AND ve.is_active = true
           AND ve.event_date >= CURRENT_DATE
           AND vl.is_locked = false
         GROUP BY ve.id, vl.id
         HAVING vl.max_slots IS NULL OR COUNT(vs.id) < vl.max_slots
         ORDER BY ve.event_date ASC
         LIMIT 3`,
        [eventInfo.role_title, eventInfo.event_id, templateId]
      );
    }

    const otherDates = otherDatesResult.rows.map((row: any) => {
      let eventDateStr = null;
      if (row.event_date) {
        const d = new Date(row.event_date);
        eventDateStr = d.toISOString().split('T')[0];
      }
      return {
        event_id: row.event_id,
        list_id: row.list_id,
        event_date: eventDateStr,
        spots_remaining: row.max_slots ? row.max_slots - row.signup_count : null,
      };
    });

    // Format eventDate as YYYY-MM-DD string
    let eventDateStr = null;
    if (eventInfo.event_date) {
      const d = new Date(eventInfo.event_date);
      eventDateStr = d.toISOString().split('T')[0];
    }

    return NextResponse.json(
      {
        id: signup.id,
        name: name.trim(),
        phone: formattedPhone,
        role: eventInfo.role_title,
        eventId: eventInfo.event_id,
        eventTitle: eventInfo.title,
        eventDate: eventDateStr,
        otherRoles,
        otherDates,
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

    console.error('Error registering volunteer:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to sign up', details: error.message },
      { status: 500 }
    );
  } finally {
    // Always release the client back to the pool (only if acquired)
    if (client) {
      client.release();
    }
  }
}
