import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// DELETE - Remove a signup from a list
export async function DELETE(request: NextRequest) {
  try {
    const { signupId } = await request.json();

    if (!signupId) {
      return NextResponse.json({ error: 'Signup ID is required' }, { status: 400 });
    }

    // Check if the list is locked
    const checkResult = await query(
      `SELECT l.is_locked FROM volunteer_signups s
      JOIN volunteer_lists l ON s.list_id = l.id
      WHERE s.id = $1`,
      [signupId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
    }

    if (checkResult.rows[0].is_locked) {
      return NextResponse.json(
        { error: 'This list is locked and cannot be modified' },
        { status: 403 }
      );
    }

    // Delete the signup
    await query('DELETE FROM volunteer_signups WHERE id = $1', [signupId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
