import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatPhoneNumber } from '@/lib/sms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const { name, phone, eventId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get the list info to find the correct list for the selected event
    const listResult = await query(
      `SELECT vl.id, vl.title, vl.is_locked, vl.max_slots, vl.event_id, ve.template_id
       FROM volunteer_lists vl
       JOIN volunteer_events ve ON vl.event_id = ve.id
       WHERE vl.id = $1`,
      [listId]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const originalList = listResult.rows[0];

    // If a different event was selected, find the matching list for that event
    let targetListId = parseInt(listId);

    if (eventId && eventId !== originalList.event_id) {
      // Find the list with the same title in the target event
      const targetListResult = await query(
        `SELECT vl.id, vl.is_locked, vl.max_slots, COUNT(vs.id) as signup_count
         FROM volunteer_lists vl
         LEFT JOIN volunteer_signups vs ON vl.id = vs.list_id
         WHERE vl.event_id = $1 AND vl.title = $2
         GROUP BY vl.id`,
        [eventId, originalList.title]
      );

      if (targetListResult.rows.length > 0) {
        const targetList = targetListResult.rows[0];
        targetListId = targetList.id;

        // Check if target list is locked or full
        if (targetList.is_locked) {
          return NextResponse.json(
            { error: 'This role is locked for the selected date' },
            { status: 403 }
          );
        }
        if (targetList.max_slots && parseInt(targetList.signup_count) >= targetList.max_slots) {
          return NextResponse.json(
            { error: 'This role is full for the selected date' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Role not available for selected date' },
          { status: 404 }
        );
      }
    } else {
      // Check original list
      const countResult = await query(
        'SELECT COUNT(*) as count FROM volunteer_signups WHERE list_id = $1',
        [targetListId]
      );
      const signupCount = parseInt(countResult.rows[0].count) || 0;

      if (originalList.is_locked) {
        return NextResponse.json({ error: 'This role is currently locked' }, { status: 403 });
      }
      if (originalList.max_slots && signupCount >= originalList.max_slots) {
        return NextResponse.json({ error: 'This role is full' }, { status: 400 });
      }
    }

    // Get next position
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM volunteer_signups WHERE list_id = $1',
      [targetListId]
    );
    const nextPosition = positionResult.rows[0].next_position;

    // Format phone
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    // Insert signup
    const signupResult = await query(
      `INSERT INTO volunteer_signups (list_id, name, position, phone) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [targetListId, name.trim(), nextPosition, formattedPhone]
    );

    const signup = signupResult.rows[0];

    // Get event details for response
    const eventResult = await query(
      `SELECT ve.title, ve.event_date, vl.title as role_title
       FROM volunteer_events ve
       JOIN volunteer_lists vl ON vl.event_id = ve.id
       WHERE vl.id = $1`,
      [targetListId]
    );

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
  } catch (error) {
    console.error('Error registering volunteer:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}
