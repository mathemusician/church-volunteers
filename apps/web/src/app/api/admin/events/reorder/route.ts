import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// POST - Reorder events
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const { eventIds } = await request.json();

    if (!Array.isArray(eventIds)) {
      return NextResponse.json({ error: 'eventIds must be an array' }, { status: 400 });
    }

    // Update sort_order for each event
    for (let i = 0; i < eventIds.length; i++) {
      await query('UPDATE volunteer_events SET sort_order = $1 WHERE id = $2', [i, eventIds[i]]);
    }

    return NextResponse.json({ message: 'Events reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
