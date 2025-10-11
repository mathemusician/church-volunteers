import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET lists for an event (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const result = await query(
      `SELECT l.*, 
        (SELECT COUNT(*) FROM volunteer_signups WHERE list_id = l.id) as signup_count
      FROM volunteer_lists l
      WHERE l.event_id = $1
      ORDER BY l.position ASC`,
      [eventId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new list (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, title, description, max_slots, is_locked = false } = await request.json();

    if (!eventId || !title) {
      return NextResponse.json({ error: 'Event ID and title are required' }, { status: 400 });
    }

    // Get next position
    const positionResult = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM volunteer_lists WHERE event_id = $1',
      [eventId]
    );
    const nextPosition = positionResult.rows[0].next_position;

    const result = await query(
      'INSERT INTO volunteer_lists (event_id, title, description, max_slots, is_locked, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [eventId, title, description, max_slots || null, is_locked, nextPosition]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update list (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, description, max_slots, is_locked } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE volunteer_lists 
      SET title = $2,
          description = $3,
          max_slots = $4,
          is_locked = $5,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [id, title, description, max_slots, is_locked]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE list (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }

    await query('DELETE FROM volunteer_lists WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
