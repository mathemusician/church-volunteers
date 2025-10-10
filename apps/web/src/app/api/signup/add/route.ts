import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - Add a person to a volunteer list
export async function POST(request: NextRequest) {
  try {
    const { listId, name } = await request.json();

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

    // Insert signup
    const result = await query(
      'INSERT INTO volunteer_signups (list_id, name, position) VALUES ($1, $2, $3) RETURNING *',
      [listId, name.trim(), nextPosition]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error adding signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
