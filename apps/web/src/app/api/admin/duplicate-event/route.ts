import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// POST duplicate an event with all its lists
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

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get the original event (verify it belongs to user's org)
    const eventResult = await query(
      'SELECT * FROM volunteer_events WHERE id = $1 AND organization_id = $2',
      [eventId, orgContext.organizationId]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const originalEvent = eventResult.rows[0];

    // Create a unique slug by appending timestamp
    const timestamp = Date.now();
    const newSlug = `${originalEvent.slug}-copy-${timestamp}`;
    const newTitle = `${originalEvent.title} (Copy)`;

    // Duplicate the event (without template_id to avoid linking it to the template)
    const newEventResult = await query(
      `INSERT INTO volunteer_events 
        (organization_id, slug, title, description, event_date, begin_date, end_date, is_active, is_template) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        orgContext.organizationId,
        newSlug,
        newTitle,
        originalEvent.description,
        originalEvent.event_date,
        originalEvent.begin_date,
        originalEvent.end_date,
        originalEvent.is_active,
        originalEvent.is_template,
      ]
    );

    const newEvent = newEventResult.rows[0];

    // Get all lists from the original event
    const listsResult = await query(
      'SELECT * FROM volunteer_lists WHERE event_id = $1 ORDER BY position ASC',
      [eventId]
    );

    // Duplicate all lists
    for (const list of listsResult.rows) {
      await query(
        `INSERT INTO volunteer_lists 
          (event_id, title, description, max_slots, is_locked, position) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [newEvent.id, list.title, list.description, list.max_slots, list.is_locked, list.position]
      );
    }

    return NextResponse.json(
      {
        message: 'Event duplicated successfully',
        event: newEvent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error duplicating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
