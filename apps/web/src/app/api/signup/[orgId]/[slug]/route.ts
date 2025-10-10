import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrganizationByPublicId } from '@/lib/models/organization';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; slug: string } }
) {
  try {
    const { orgId, slug } = params;

    // 1. Lookup organization by public_id
    const org = await getOrganizationByPublicId(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 2. Get event by slug and organization_id
    const eventResult = await query(
      'SELECT * FROM volunteer_events WHERE slug = $1 AND organization_id = $2 AND is_active = true',
      [slug, org.id]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // 3. Get all volunteer lists for this event with signup counts
    const listsResult = await query(
      `SELECT 
        l.*,
        (SELECT COUNT(*) FROM volunteer_signups WHERE list_id = l.id) as signup_count,
        CASE 
          WHEN l.max_slots IS NOT NULL AND (SELECT COUNT(*) FROM volunteer_signups WHERE list_id = l.id) >= l.max_slots 
          THEN true 
          ELSE false 
        END as is_full
      FROM volunteer_lists l
      WHERE l.event_id = $1
      ORDER BY l.position ASC`,
      [event.id]
    );

    // 4. Get signups for each list
    const lists = await Promise.all(
      listsResult.rows.map(async (list) => {
        const signupsResult = await query(
          'SELECT id, name, position FROM volunteer_signups WHERE list_id = $1 ORDER BY position ASC',
          [list.id]
        );

        return {
          ...list,
          signups: signupsResult.rows,
        };
      })
    );

    return NextResponse.json({
      event,
      lists,
    });
  } catch (error) {
    console.error('Error fetching signup data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
