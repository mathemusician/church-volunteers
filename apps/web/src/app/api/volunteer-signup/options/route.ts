import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get available roles (volunteer lists) that are not locked and not full
    const rolesResult = await query(`
      SELECT 
        vl.id,
        vl.title,
        vl.description,
        vl.max_slots,
        COUNT(vs.id) as signup_count,
        CASE 
          WHEN vl.max_slots IS NOT NULL AND COUNT(vs.id) >= vl.max_slots THEN true 
          ELSE false 
        END as is_full
      FROM volunteer_lists vl
      LEFT JOIN volunteer_signups vs ON vl.id = vs.list_id
      WHERE vl.is_locked = false
      GROUP BY vl.id, vl.title, vl.description, vl.max_slots
      ORDER BY vl.position, vl.title
    `);

    // Get upcoming events (not templates, with future dates)
    const eventsResult = await query(`
      SELECT 
        id,
        slug,
        title,
        event_date
      FROM volunteer_events
      WHERE is_active = true 
        AND is_template = false
        AND (event_date IS NULL OR event_date >= CURRENT_DATE)
      ORDER BY event_date ASC NULLS LAST, title ASC
      LIMIT 20
    `);

    return NextResponse.json({
      roles: rolesResult.rows.map((row) => ({
        ...row,
        signup_count: parseInt(row.signup_count) || 0,
        is_full: row.is_full === true || row.is_full === 'true',
      })),
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching signup options:', error);
    return NextResponse.json({ error: 'Failed to load signup options' }, { status: 500 });
  }
}
