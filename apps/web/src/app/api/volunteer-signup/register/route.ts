import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

function generateQRToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, roleId, eventId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!roleId) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Event/schedule is required' }, { status: 400 });
    }

    // Verify the role (list) exists and is not locked
    const listResult = await query(
      `SELECT l.id, l.title, l.is_locked, l.max_slots, l.event_id, COUNT(s.id) as signup_count
       FROM volunteer_lists l
       LEFT JOIN volunteer_signups s ON l.id = s.list_id
       WHERE l.id = $1
       GROUP BY l.id`,
      [roleId]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const list = listResult.rows[0];

    if (list.is_locked) {
      return NextResponse.json({ error: 'This role is currently locked' }, { status: 403 });
    }

    if (list.max_slots && parseInt(list.signup_count) >= list.max_slots) {
      return NextResponse.json({ error: 'This role is full' }, { status: 400 });
    }

    // Verify the event exists
    const eventResult = await query(
      'SELECT id, title, event_date FROM volunteer_events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // Get next position
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM volunteer_signups WHERE list_id = $1',
      [roleId]
    );
    const nextPosition = positionResult.rows[0].next_position;

    // Generate QR token for this signup
    const qrToken = generateQRToken();

    // Insert the signup
    const signupResult = await query(
      `INSERT INTO volunteer_signups (list_id, name, position, phone, qr_token, email) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [roleId, name.trim(), nextPosition, phone || null, qrToken, email || null]
    );

    const signup = signupResult.rows[0];

    // Generate QR data (contains signup ID and token for verification)
    const qrData = JSON.stringify({
      signupId: signup.id,
      token: qrToken,
      name: name.trim(),
      role: list.title,
      event: event.title,
      date: event.event_date,
    });

    return NextResponse.json(
      {
        id: signup.id,
        name: name.trim(),
        role: list.title,
        eventTitle: event.title,
        eventDate: event.event_date,
        qrData: qrData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering volunteer:', error);

    // Check if it's a column doesn't exist error (for qr_token or email)
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      // Try without the new columns
      try {
        const { name, phone, roleId, eventId } = await request.json();

        const listResult = await query(
          `SELECT l.id, l.title FROM volunteer_lists l WHERE l.id = $1`,
          [roleId]
        );
        const list = listResult.rows[0];

        const eventResult = await query(
          'SELECT id, title, event_date FROM volunteer_events WHERE id = $1',
          [eventId]
        );
        const event = eventResult.rows[0];

        const positionResult = await query(
          'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM volunteer_signups WHERE list_id = $1',
          [roleId]
        );
        const nextPosition = positionResult.rows[0].next_position;

        const signupResult = await query(
          `INSERT INTO volunteer_signups (list_id, name, position, phone) 
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [roleId, name.trim(), nextPosition, phone || null]
        );

        const signup = signupResult.rows[0];
        const qrData = JSON.stringify({
          signupId: signup.id,
          name: name.trim(),
          role: list.title,
          event: event.title,
          date: event.event_date,
        });

        return NextResponse.json(
          {
            id: signup.id,
            name: name.trim(),
            role: list.title,
            eventTitle: event.title,
            eventDate: event.event_date,
            qrData: qrData,
          },
          { status: 201 }
        );
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }

    return NextResponse.json({ error: 'Failed to register volunteer' }, { status: 500 });
  }
}
