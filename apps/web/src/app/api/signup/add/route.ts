import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatPhoneNumber, sendSMS, isOptedOut } from '@/lib/sms';

// POST - Add a person to a volunteer list
export async function POST(request: NextRequest) {
  try {
    const { listId, name, phone, smsConsent } = await request.json();

    if (!listId || !name || !name.trim()) {
      return NextResponse.json({ error: 'List ID and name are required' }, { status: 400 });
    }

    // Check if list exists and is not locked
    const listResult = await query(
      `SELECT l.id, l.is_locked, l.max_slots, COUNT(s.id) as signup_count
      FROM volunteer_lists l
      LEFT JOIN volunteer_signups s ON l.id = s.list_id
      WHERE l.id = $1
      GROUP BY l.id`,
      [listId]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const list = listResult.rows[0];

    if (list.is_locked) {
      return NextResponse.json(
        { error: 'This list is locked and cannot be modified' },
        { status: 403 }
      );
    }

    if (list.max_slots && list.signup_count >= list.max_slots) {
      return NextResponse.json({ error: 'This list is full' }, { status: 400 });
    }

    // Get next position
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM volunteer_signups WHERE list_id = $1',
      [listId]
    );
    const nextPosition = positionResult.rows[0].next_position;

    // Format phone number if provided
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    // Insert signup with phone and consent
    const result = await query(
      `INSERT INTO volunteer_signups (list_id, name, position, phone, sms_consent, sms_consented_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        listId,
        name.trim(),
        nextPosition,
        formattedPhone,
        smsConsent ? true : false,
        smsConsent ? new Date() : null,
      ]
    );

    const signupId = result.rows[0].id;

    // Send SMS confirmation if phone provided and consent given
    if (formattedPhone && smsConsent) {
      // Check if opted out
      const optedOut = await isOptedOut(formattedPhone);
      if (!optedOut) {
        // Get event details for the message
        const eventResult = await query(
          `SELECT ve.id as event_id, ve.title, ve.event_date, vl.title as list_title
           FROM volunteer_lists vl
           JOIN volunteer_events ve ON vl.event_id = ve.id
           WHERE vl.id = $1`,
          [listId]
        );

        const event = eventResult.rows[0];
        if (event) {
          const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          const message = `You're confirmed for ${event.title} - ${event.list_title} on ${dateStr}. Reply STOP to opt out.`;

          // Send SMS (don't await - fire and forget)
          sendSMS({
            to: formattedPhone,
            message,
            signupId,
            eventId: event.event_id,
            messageType: 'confirmation',
          }).catch((err) => {
            console.error('SMS send failed:', err);
          });
        }
      }
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error adding signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
