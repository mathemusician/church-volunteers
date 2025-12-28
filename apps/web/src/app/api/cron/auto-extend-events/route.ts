import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - Generate weekly events from templates (run daily via cron)
// This should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authorization header check for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all active templates
    const templatesResult = await query(
      `SELECT * FROM volunteer_events 
       WHERE is_template = true 
       AND is_active = true`
    );

    const generatedEvents = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Target: always maintain exactly 5 future events per template
    const TARGET_FUTURE_EVENTS = 5;

    for (const template of templatesResult.rows) {
      // Determine which day of week this template is for
      let targetDayOfWeek = 0; // Sunday by default
      if (template.begin_date) {
        const beginDate = new Date(template.begin_date);
        targetDayOfWeek = beginDate.getDay();
      }

      // Count existing future events for this template
      const futureEventsResult = await query(
        `SELECT COUNT(*) as count FROM volunteer_events 
         WHERE template_id = $1 
         AND event_date >= $2
         AND is_template = false`,
        [template.id, todayStr]
      );

      const currentFutureCount = parseInt(futureEventsResult.rows[0].count, 10);
      const eventsToCreate = TARGET_FUTURE_EVENTS - currentFutureCount;

      if (eventsToCreate <= 0) {
        continue; // Already have enough future events
      }

      // Find the latest event date for this template
      const latestEventResult = await query(
        `SELECT MAX(event_date) as latest FROM volunteer_events 
         WHERE template_id = $1 
         AND is_template = false`,
        [template.id]
      );

      let nextDate: Date;
      if (latestEventResult.rows[0].latest) {
        // Start from the week after the latest event
        nextDate = new Date(latestEventResult.rows[0].latest);
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        // No events yet, find the next occurrence of target day
        nextDate = new Date(today);
        const daysUntilTarget = (targetDayOfWeek - today.getDay() + 7) % 7;
        nextDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      }

      // Create the needed events
      for (let i = 0; i < eventsToCreate; i++) {
        const targetDateStr = nextDate.toISOString().split('T')[0];

        // Double-check event doesn't already exist
        const existingCheck = await query(
          `SELECT id FROM volunteer_events 
           WHERE template_id = $1 
           AND event_date = $2`,
          [template.id, targetDateStr]
        );

        if (existingCheck.rows.length > 0) {
          nextDate.setDate(nextDate.getDate() + 7);
          continue;
        }

        // Generate title with date
        const formattedDate = nextDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const newTitle = `${template.title} - ${formattedDate}`;

        // Generate unique slug
        let slug = `${template.slug}-${targetDateStr}`;
        let suffix = 0;
        const MAX_ATTEMPTS = 100;

        while (suffix < MAX_ATTEMPTS) {
          const slugCheck = await query(
            'SELECT id FROM volunteer_events WHERE organization_id = $1 AND slug = $2',
            [template.organization_id, slug]
          );

          if (slugCheck.rows.length === 0) {
            break;
          }

          suffix++;
          slug = `${template.slug}-${targetDateStr}${suffix}`;
        }

        // Create new event from template
        const newEventResult = await query(
          `INSERT INTO volunteer_events 
            (organization_id, slug, title, description, event_date, is_active, is_template, template_id, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`,
          [
            template.organization_id,
            slug,
            newTitle,
            template.description,
            targetDateStr,
            true,
            false,
            template.id,
            null,
          ]
        );

        const newEvent = newEventResult.rows[0];

        // Copy all lists from the template
        const listsResult = await query(
          'SELECT * FROM volunteer_lists WHERE event_id = $1 ORDER BY position ASC',
          [template.id]
        );

        for (const list of listsResult.rows) {
          await query(
            `INSERT INTO volunteer_lists 
              (event_id, title, description, max_slots, is_locked, position) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              newEvent.id,
              list.title,
              list.description,
              list.max_slots,
              list.is_locked,
              list.position,
            ]
          );
        }

        generatedEvents.push({
          template: template.title,
          new: newEvent.title,
          date: targetDateStr,
        });

        // Move to next week
        nextDate.setDate(nextDate.getDate() + 7);
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedEvents.length} event(s) from templates`,
      generated: generatedEvents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating events from templates:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
