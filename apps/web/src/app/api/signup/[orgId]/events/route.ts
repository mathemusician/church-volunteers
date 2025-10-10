import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrganizationByPublicId } from '@/lib/models/organization';

export async function GET(request: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { orgId } = params;

    // Lookup organization by public_id
    const org = await getOrganizationByPublicId(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all active events for this organization
    const eventsResult = await query(
      'SELECT * FROM volunteer_events WHERE organization_id = $1 AND is_active = true ORDER BY event_date ASC',
      [org.id]
    );

    return NextResponse.json(eventsResult.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
