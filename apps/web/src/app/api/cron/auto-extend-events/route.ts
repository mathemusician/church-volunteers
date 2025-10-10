import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Auto-extend events (run daily via cron)
// This should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authorization header check for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find events with auto_extend enabled that haven't been extended yet
    // We look for events 7 days in the past
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const eventsToExtend = await query(
      `SELECT * FROM volunteer_events 
       WHERE auto_extend = true 
       AND is_template = false
       AND event_date = $1`,
      [sevenDaysAgoStr]
    );

    const extendedEvents = [];

    for (const event of eventsToExtend.rows) {
      // Calculate next week's date
      const currentDate = new Date(event.event_date);
      const nextWeekDate = new Date(currentDate);
      nextWeekDate.setDate(currentDate.getDate() + 7);
      const nextWeekDateStr = nextWeekDate.toISOString().split('T')[0];

      // Generate new slug and title with next week's date
      const formattedDate = nextWeekDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const baseTitle = event.title.replace(/ - \w+ \d+$/, ''); // Remove existing date suffix if present
      const newTitle = `${baseTitle} - ${formattedDate}`;
      const newSlug = `${event.slug.split('-').slice(0, -3).join('-')}-${nextWeekDateStr}`;

      // Check if next week's event already exists
      const existingCheck = await query(
        'SELECT id FROM volunteer_events WHERE slug = $1 OR (event_date = $2 AND title LIKE $3)',
        [newSlug, nextWeekDateStr, `${baseTitle}%`]
      );

      if (existingCheck.rows.length > 0) {
        continue; // Skip if already exists
      }

      // Create new event for next week
      const newEventResult = await query(
        `INSERT INTO volunteer_events 
          (slug, title, description, event_date, is_active, is_template, template_id, auto_extend) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          newSlug,
          newTitle,
          event.description,
          nextWeekDateStr,
          event.is_active,
          false,
          event.template_id,
          event.auto_extend, // Keep auto-extend enabled for future weeks
        ]
      );

      const newEvent = newEventResult.rows[0];

      // Copy all lists from the original event
      const listsResult = await query(
        'SELECT * FROM volunteer_lists WHERE event_id = $1 ORDER BY position ASC',
        [event.id]
      );

      for (const list of listsResult.rows) {
        await query(
          `INSERT INTO volunteer_lists 
            (event_id, title, description, max_slots, is_locked, position) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [newEvent.id, list.title, list.description, list.max_slots, list.is_locked, list.position]
        );
      }

      extendedEvents.push({
        original: event.title,
        new: newEvent.title,
        date: nextWeekDateStr,
      });
    }

    return NextResponse.json({
      message: `Auto-extended ${extendedEvents.length} event(s)`,
      extended: extendedEvents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error auto-extending events:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
