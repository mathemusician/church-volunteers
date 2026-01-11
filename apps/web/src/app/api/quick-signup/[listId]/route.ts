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

    // Get available dates (sibling events from same template)
    let availableDates: any[] = [];
    if (list.template_id) {
      const datesResult = await query(
        `SELECT id, title, event_date, slug
         FROM volunteer_events
         WHERE template_id = $1 
           AND is_template = false
           AND is_active = true
           AND (event_date IS NULL OR event_date >= CURRENT_DATE)
         ORDER BY event_date ASC NULLS LAST
         LIMIT 10`,
        [list.template_id]
      );
      availableDates = datesResult.rows;
    } else {
      // Just return the current event
      availableDates = [
        {
          id: list.event_id,
          title: list.event_title,
          event_date: list.event_date,
          slug: '',
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
