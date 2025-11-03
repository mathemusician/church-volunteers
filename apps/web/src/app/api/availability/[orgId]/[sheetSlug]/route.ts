import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Fetch availability sheet with all days and signups (optionally for a specific week)
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; sheetSlug: string } }
) {
  try {
    const { orgId, sheetSlug } = params;
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week'); // ISO date string (YYYY-MM-DD) of Monday

    // Get the sheet
    const sheetResult = await query(
      `SELECT * FROM availability_sheets 
       WHERE organization_id = $1 AND slug = $2 AND is_active = true`,
      [orgId, sheetSlug]
    );

    if (sheetResult.rows.length === 0) {
      return NextResponse.json({ error: 'Availability sheet not found' }, { status: 404 });
    }

    const sheet = sheetResult.rows[0];

    // Get all days for this sheet
    const daysResult = await query(
      `SELECT * FROM availability_days 
       WHERE sheet_id = $1 
       ORDER BY day_of_week`,
      [sheet.id]
    );

    let signupsByDayOfWeek: Record<number, any[]>;

    if (weekStart) {
      // Week-specific view: Get week signups (overrides standing availability)
      const weekSignupsResult = await query(
        `SELECT 
          id,
          day_of_week,
          name,
          created_at
         FROM availability_week_signups
         WHERE sheet_id = $1 AND week_start_date = $2
         ORDER BY day_of_week, created_at`,
        [sheet.id, weekStart]
      );

      signupsByDayOfWeek = weekSignupsResult.rows.reduce((acc: Record<number, any[]>, signup) => {
        if (!acc[signup.day_of_week]) {
          acc[signup.day_of_week] = [];
        }
        acc[signup.day_of_week].push(signup);
        return acc;
      }, {});
    } else {
      // Standing availability view: Get general signups
      const signupsResult = await query(
        `SELECT 
          s.id,
          s.day_id,
          d.day_of_week,
          s.name,
          s.position,
          s.created_at
         FROM availability_signups s
         JOIN availability_days d ON s.day_id = d.id
         WHERE d.sheet_id = $1
         ORDER BY d.day_of_week, s.position, s.created_at`,
        [sheet.id]
      );

      signupsByDayOfWeek = signupsResult.rows.reduce((acc: Record<number, any[]>, signup) => {
        if (!acc[signup.day_of_week]) {
          acc[signup.day_of_week] = [];
        }
        acc[signup.day_of_week].push(signup);
        return acc;
      }, {});
    }

    // Attach signups to days
    const days = daysResult.rows.map((day) => ({
      ...day,
      signups: signupsByDayOfWeek[day.day_of_week] || [],
    }));

    return NextResponse.json({
      sheet: {
        id: sheet.id,
        title: sheet.title,
        description: sheet.description,
        slug: sheet.slug,
        min_players: sheet.min_players,
      },
      days,
      week_start: weekStart,
    });
  } catch (error) {
    console.error('Error fetching availability sheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
