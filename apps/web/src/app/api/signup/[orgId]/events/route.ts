import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrganizationByPublicId } from '@/lib/models/organization';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    // Lookup organization by public_id
    const org = await getOrganizationByPublicId(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all active upcoming events for this organization
    const eventsResult = await query(
      `SELECT * FROM volunteer_events 
       WHERE organization_id = $1 
       AND is_active = true 
       AND (is_template = true OR event_date >= CURRENT_DATE)
       ORDER BY event_date ASC NULLS FIRST`,
      [org.id]
    );

    return NextResponse.json(eventsResult.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
