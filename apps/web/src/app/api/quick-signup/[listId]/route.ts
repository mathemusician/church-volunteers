import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;

    // Validate listId is a valid integer
    const listIdInt = parseInt(listId, 10);
    if (isNaN(listIdInt) || listIdInt <= 0) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

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
      [listIdInt]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const list = listResult.rows[0];
    const signupCount = parseInt(list.signup_count) || 0;
    const isFull = list.max_slots ? signupCount >= list.max_slots : false;

    // Get ALL dates (sibling events from same template) with this role's availability
    // AND count of other available roles for each date
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
          COUNT(vs.id)::int as signup_count,
          -- Count other roles with availability on this date
          (SELECT COUNT(*) FROM volunteer_lists vl2
           LEFT JOIN volunteer_signups vs2 ON vs2.list_id = vl2.id
           WHERE vl2.event_id = ve.id 
             AND vl2.id != vl.id 
             AND vl2.is_locked = false
           GROUP BY vl2.event_id
           HAVING COUNT(*) > 0 
             AND SUM(CASE WHEN vl2.max_slots IS NULL OR (SELECT COUNT(*) FROM volunteer_signups WHERE list_id = vl2.id) < vl2.max_slots THEN 1 ELSE 0 END) > 0
          )::int as other_roles_available
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

      // For each date, also get the list of other available roles
      const eventIds = datesResult.rows.map((r: any) => r.id);
      const otherRolesByEvent: Record<number, any[]> = {};

      if (eventIds.length > 0) {
        // Get ALL other roles for these events (not just available ones) for debugging
        const otherRolesResult = await query(
          `SELECT 
            vl.event_id,
            vl.id as list_id,
            vl.title,
            vl.max_slots,
            vl.is_locked,
            COUNT(vs.id)::int as signup_count
           FROM volunteer_lists vl
           LEFT JOIN volunteer_signups vs ON vs.list_id = vl.id
           WHERE vl.event_id = ANY($1)
             AND vl.title != $2
           GROUP BY vl.id
           ORDER BY vl.title`,
          [eventIds, list.title]
        );

        // Filter to only available roles (not full, not locked)
        for (const row of otherRolesResult.rows) {
          const isFull = row.max_slots ? row.signup_count >= row.max_slots : false;
          if (row.is_locked || isFull) continue;

          if (!otherRolesByEvent[row.event_id]) {
            otherRolesByEvent[row.event_id] = [];
          }
          otherRolesByEvent[row.event_id].push({
            list_id: row.list_id,
            title: row.title,
            spots_remaining: row.max_slots ? Math.max(0, row.max_slots - row.signup_count) : null,
          });
        }
      }

      availableDates = datesResult.rows.map((row: any) => {
        let eventDateStr = null;
        if (row.event_date) {
          const d = new Date(row.event_date);
          eventDateStr = d.toISOString().split('T')[0];
        }
        const isFull = row.max_slots ? row.signup_count >= row.max_slots : false;
        return {
          id: row.id,
          title: row.title,
          event_date: eventDateStr,
          slug: row.slug,
          list_id: row.list_id,
          max_slots: row.max_slots,
          signup_count: row.signup_count,
          spots_remaining: row.max_slots ? Math.max(0, row.max_slots - row.signup_count) : null,
          is_full: isFull,
          is_locked: row.is_locked,
          // Always include other available roles for this date
          other_roles: (otherRolesByEvent[row.id] || []).slice(0, 3),
        };
      });
    } else {
      // Standalone event - get other roles for this event
      let eventDateStr = null;
      if (list.event_date) {
        const d = new Date(list.event_date);
        eventDateStr = d.toISOString().split('T')[0];
      }

      const otherRolesResult = await query(
        `SELECT 
          vl.id as list_id,
          vl.title,
          vl.max_slots,
          COUNT(vs.id)::int as signup_count
         FROM volunteer_lists vl
         LEFT JOIN volunteer_signups vs ON vs.list_id = vl.id
         WHERE vl.event_id = $1
           AND vl.id != $2
           AND vl.is_locked = false
         GROUP BY vl.id
         HAVING vl.max_slots IS NULL OR COUNT(vs.id) < vl.max_slots
         ORDER BY vl.title
         LIMIT 3`,
        [list.event_id, list.id]
      );

      const otherRoles = otherRolesResult.rows.map((r: any) => ({
        list_id: r.list_id,
        title: r.title,
        spots_remaining: r.max_slots ? Math.max(0, r.max_slots - r.signup_count) : null,
      }));

      availableDates = [
        {
          id: list.event_id,
          title: list.event_title,
          event_date: eventDateStr,
          slug: '',
          list_id: list.id,
          max_slots: list.max_slots,
          signup_count: signupCount,
          spots_remaining: list.max_slots ? Math.max(0, list.max_slots - signupCount) : null,
          is_full: isFull,
          is_locked: list.is_locked,
          other_roles: otherRoles,
        },
      ];
    }

    // Format main event_date as YYYY-MM-DD string
    let mainEventDateStr = null;
    if (list.event_date) {
      const d = new Date(list.event_date);
      mainEventDateStr = d.toISOString().split('T')[0];
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
      event_date: mainEventDateStr,
      available_dates: availableDates,
    });
  } catch (error) {
    console.error('Error fetching role info:', error);
    return NextResponse.json({ error: 'Failed to load role information' }, { status: 500 });
  }
}
