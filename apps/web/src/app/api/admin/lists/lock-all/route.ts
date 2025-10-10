import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// POST - Lock or unlock all lists for an event
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

    const { eventId, locked } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Update all lists for this event
    await query('UPDATE volunteer_lists SET is_locked = $1 WHERE event_id = $2', [locked, eventId]);

    return NextResponse.json({
      message: locked ? 'All lists locked successfully' : 'All lists unlocked successfully',
    });
  } catch (error: any) {
    console.error('Error locking/unlocking lists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
