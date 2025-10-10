import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// POST generate weekly instances from a template
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

    const { templateId, weeks = 4 } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (weeks < 1 || weeks > 52) {
      return NextResponse.json({ error: 'Weeks must be between 1 and 52' }, { status: 400 });
    }

    // Get template (verify it belongs to user's org)
    const templateResult = await query(
      'SELECT * FROM volunteer_events WHERE id = $1 AND is_template = true AND organization_id = $2',
      [templateId, orgContext.organizationId]
    );

    if (templateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templateResult.rows[0];

    // Get template's lists
    const listsResult = await query(
      'SELECT * FROM volunteer_lists WHERE event_id = $1 ORDER BY position ASC',
      [templateId]
    );

    const templateLists = listsResult.rows;

    // Find the latest existing event for this template
    const latestEventResult = await query(
      'SELECT event_date FROM volunteer_events WHERE template_id = $1 AND event_date IS NOT NULL ORDER BY event_date DESC LIMIT 1',
      [templateId]
    );

    // Start from the latest event date + 1 week, or from begin_date if no events exist
    let startDate: Date;
    if (latestEventResult.rows.length > 0) {
      // Start from the next week after the latest event
      startDate = new Date(latestEventResult.rows[0].event_date);
      startDate.setDate(startDate.getDate() + 7);
    } else {
      // No events yet, start from begin_date or today
      startDate = template.begin_date ? new Date(template.begin_date) : new Date();
    }

    // Generate N weekly occurrences starting from startDate
    const weeklyDates: Date[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < weeks; i++) {
      weeklyDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }

    const createdEvents = [];

    // Create event instance for each weekly occurrence
    for (const date of weeklyDates) {
      // Format date in local timezone (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const instanceSlug = `${template.slug}-${dateStr}`;
      const instanceTitle = `${template.title} - ${formattedDate}`;

      // Check if instance already exists
      const existingCheck = await query('SELECT id FROM volunteer_events WHERE slug = $1', [
        instanceSlug,
      ]);

      if (existingCheck.rows.length > 0) {
        continue; // Skip if already exists
      }

      // Create event instance
      const eventResult = await query(
        'INSERT INTO volunteer_events (organization_id, slug, title, description, event_date, is_active, is_template, template_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          orgContext.organizationId,
          instanceSlug,
          instanceTitle,
          template.description,
          dateStr,
          true,
          false,
          templateId,
        ]
      );

      const newEvent = eventResult.rows[0];
      createdEvents.push(newEvent);

      // Copy lists from template to this instance
      for (const list of templateLists) {
        await query(
          'INSERT INTO volunteer_lists (event_id, title, description, max_slots, is_locked, position) VALUES ($1, $2, $3, $4, $5, $6)',
          [newEvent.id, list.title, list.description, list.max_slots, list.is_locked, list.position]
        );
      }
    }

    return NextResponse.json(
      {
        message: `Generated ${createdEvents.length} event instance(s)`,
        events: createdEvents,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error generating events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
