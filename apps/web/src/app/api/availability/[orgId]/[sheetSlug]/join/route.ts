import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - Join a specific day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; sheetSlug: string }> }
) {
  try {
    const { orgId, sheetSlug } = await params;
    const body = await request.json();
    const { dayOfWeek, name, weekStart } = body;

    if (!name || dayOfWeek === undefined) {
      return NextResponse.json({ error: 'Name and dayOfWeek required' }, { status: 400 });
    }

    // Get the sheet
    const sheetResult = await query(
      `SELECT id FROM availability_sheets 
       WHERE organization_id = $1 AND slug = $2 AND is_active = true`,
      [orgId, sheetSlug]
    );

    if (sheetResult.rows.length === 0) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    const sheetId = sheetResult.rows[0].id;

    if (weekStart) {
      // Week-specific signup
      const existingResult = await query(
        `SELECT id FROM availability_week_signups 
         WHERE sheet_id = $1 AND week_start_date = $2 AND day_of_week = $3 AND name = $4`,
        [sheetId, weekStart, dayOfWeek, name]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json({ error: 'Already signed up for this day' }, { status: 400 });
      }

      // Add week signup
      const signupResult = await query(
        `INSERT INTO availability_week_signups (sheet_id, week_start_date, day_of_week, name) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [sheetId, weekStart, dayOfWeek, name]
      );

      return NextResponse.json({ success: true, signup: signupResult.rows[0] });
    } else {
      // Standing availability signup
      const dayResult = await query(
        `SELECT id FROM availability_days WHERE sheet_id = $1 AND day_of_week = $2`,
        [sheetId, dayOfWeek]
      );

      if (dayResult.rows.length === 0) {
        return NextResponse.json({ error: 'Day not found' }, { status: 404 });
      }

      const dayId = dayResult.rows[0].id;

      // Check if already signed up
      const existingResult = await query(
        `SELECT id FROM availability_signups WHERE day_id = $1 AND name = $2`,
        [dayId, name]
      );

      if (existingResult.rows.length > 0) {
        return NextResponse.json({ error: 'Already signed up for this day' }, { status: 400 });
      }

      // Add signup
      const signupResult = await query(
        `INSERT INTO availability_signups (day_id, name) VALUES ($1, $2) RETURNING *`,
        [dayId, name]
      );

      return NextResponse.json({ success: true, signup: signupResult.rows[0] });
    }
  } catch (error) {
    console.error('Error joining availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Leave a specific day
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; sheetSlug: string }> }
) {
  try {
    const { orgId, sheetSlug } = await params;
    const body = await request.json();
    const { dayOfWeek, name, weekStart } = body;

    if (!name || dayOfWeek === undefined) {
      return NextResponse.json({ error: 'Name and dayOfWeek required' }, { status: 400 });
    }

    // Get the sheet
    const sheetResult = await query(
      `SELECT id FROM availability_sheets 
       WHERE organization_id = $1 AND slug = $2 AND is_active = true`,
      [orgId, sheetSlug]
    );

    if (sheetResult.rows.length === 0) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    const sheetId = sheetResult.rows[0].id;

    if (weekStart) {
      // Remove week-specific signup
      const result = await query(
        `DELETE FROM availability_week_signups 
         WHERE sheet_id = $1 AND week_start_date = $2 AND day_of_week = $3 AND name = $4 RETURNING *`,
        [sheetId, weekStart, dayOfWeek, name]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } else {
      // Remove standing availability signup
      const dayResult = await query(
        `SELECT id FROM availability_days WHERE sheet_id = $1 AND day_of_week = $2`,
        [sheetId, dayOfWeek]
      );

      if (dayResult.rows.length === 0) {
        return NextResponse.json({ error: 'Day not found' }, { status: 404 });
      }

      const dayId = dayResult.rows[0].id;

      // Remove signup
      const result = await query(
        `DELETE FROM availability_signups WHERE day_id = $1 AND name = $2 RETURNING *`,
        [dayId, name]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Signup not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error leaving availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
