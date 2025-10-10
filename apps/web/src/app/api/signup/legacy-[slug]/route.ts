import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET volunteer event and its lists by slug
export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Get event
    const eventResult = await query(
      'SELECT * FROM volunteer_events WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // Get lists for this event
    const listsResult = await query(
      `SELECT 
        l.id, l.title, l.description, l.max_slots, l.is_locked, l.position,
        COUNT(s.id) as signup_count
      FROM volunteer_lists l
      LEFT JOIN volunteer_signups s ON l.id = s.list_id
      WHERE l.event_id = $1
      GROUP BY l.id
      ORDER BY l.position ASC`,
      [event.id]
    );

    // Get signups for each list
    const signupsResult = await query(
      `SELECT s.id, s.list_id, s.name, s.position
      FROM volunteer_signups s
      JOIN volunteer_lists l ON s.list_id = l.id
      WHERE l.event_id = $1
      ORDER BY s.position ASC`,
      [event.id]
    );

    // Group signups by list_id
    const signupsByList: Record<number, any[]> = {};
    signupsResult.rows.forEach((signup) => {
      if (!signupsByList[signup.list_id]) {
        signupsByList[signup.list_id] = [];
      }
      signupsByList[signup.list_id].push(signup);
    });

    // Attach signups to lists
    const lists = listsResult.rows.map((list) => ({
      ...list,
      signups: signupsByList[list.id] || [],
      is_full: list.max_slots ? list.signup_count >= list.max_slots : false,
    }));

    return NextResponse.json({ event, lists });
  } catch (error) {
    console.error('Error fetching signup data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
