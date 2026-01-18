import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;

    // Get role (list) info with event details
    const listResult = await query(
      `SELECT 
        vl.id,
        vl.title,
        vl.description,
        vl.max_slots,
        vl.is_locked,
        vl.event_id,
        ve.title as event_title,
        ve.event_date,
        ve.template_id,
        COUNT(vs.id) as signup_count
       FROM volunteer_lists vl
       JOIN volunteer_events ve ON vl.event_id = ve.id
       LEFT JOIN volunteer_signups vs ON vl.id = vs.list_id
       WHERE vl.id = $1
       GROUP BY vl.id, ve.id`,
      [listId]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const list = listResult.rows[0];
    const signupCount = parseInt(list.signup_count) || 0;
    const isFull = list.max_slots ? signupCount >= list.max_slots : false;

    // Get available dates (sibling events from same template) with availability info
    let availableDates: any[] = [];
    if (list.template_id) {
      const datesResult = await query(
        `SELECT 
          ve.id,
          ve.title,
          ve.event_date,
          ve.slug,
          vl.id as list_id,
          vl.max_slots,
          vl.is_locked,
          COUNT(vs.id)::int as signup_count
         FROM volunteer_events ve
         JOIN volunteer_lists vl ON vl.event_id = ve.id AND vl.title = $2
         LEFT JOIN volunteer_signups vs ON vs.list_id = vl.id
         WHERE ve.template_id = $1 
           AND ve.is_template = false
           AND ve.is_active = true
           AND (ve.event_date IS NULL OR ve.event_date >= CURRENT_DATE)
         GROUP BY ve.id, vl.id
         ORDER BY ve.event_date ASC NULLS LAST
         LIMIT 52`,
        [list.template_id, list.title]
      );
      availableDates = datesResult.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        event_date: row.event_date,
        slug: row.slug,
        list_id: row.list_id,
        max_slots: row.max_slots,
        signup_count: row.signup_count,
        spots_remaining: row.max_slots ? Math.max(0, row.max_slots - row.signup_count) : null,
        is_full: row.max_slots ? row.signup_count >= row.max_slots : false,
        is_locked: row.is_locked,
      }));
    } else {
      // Just return the current event with availability
      availableDates = [
        {
          id: list.event_id,
          title: list.event_title,
          event_date: list.event_date,
          slug: '',
          list_id: list.id,
          max_slots: list.max_slots,
          signup_count: signupCount,
          spots_remaining: list.max_slots ? Math.max(0, list.max_slots - signupCount) : null,
          is_full: isFull,
          is_locked: list.is_locked,
        },
      ];
    }

    return NextResponse.json({
      id: list.id,
      title: list.title,
      description: list.description,
      max_slots: list.max_slots,
      signup_count: signupCount,
      is_full: isFull,
      is_locked: list.is_locked,
      event_title: list.event_title,
      event_date: list.event_date,
      available_dates: availableDates,
    });
  } catch (error) {
    console.error('Error fetching role info:', error);
    return NextResponse.json({ error: 'Failed to load role information' }, { status: 500 });
  }
}
