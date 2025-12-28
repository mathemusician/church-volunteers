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

    // Use UTC date to avoid timezone issues
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Target: always maintain exactly 5 future events per template
    const TARGET_FUTURE_EVENTS = 5;

    for (const template of templatesResult.rows) {
      // Determine which day of week this template is for (0=Sunday, 6=Saturday)
      let targetDayOfWeek = 0; // Sunday by default
      if (template.begin_date) {
        const beginDate = new Date(template.begin_date + 'T00:00:00Z');
        targetDayOfWeek = beginDate.getUTCDay();
      }

      // Get all existing future event dates for this template
      const existingEventsResult = await query(
        `SELECT event_date FROM volunteer_events 
         WHERE template_id = $1 
         AND event_date >= $2
         AND is_template = false
         ORDER BY event_date ASC`,
        [template.id, todayStr]
      );

      const existingDates = new Set(
        existingEventsResult.rows.map((r: { event_date: string | Date }) => {
          const d = new Date(r.event_date);
          return d.toISOString().split('T')[0];
        })
      );

      // Find the first occurrence of target day >= today
      const today = new Date(todayStr + 'T00:00:00Z');
      const todayDayOfWeek = today.getUTCDay();
      const daysUntilTarget = (targetDayOfWeek - todayDayOfWeek + 7) % 7;
      // If today is the target day, include today
      const firstTargetDate = new Date(today);
      firstTargetDate.setUTCDate(today.getUTCDate() + daysUntilTarget);

      // Generate the 5 expected dates
      const expectedDates: string[] = [];
      const checkDate = new Date(firstTargetDate);
      for (let i = 0; i < TARGET_FUTURE_EVENTS; i++) {
        expectedDates.push(checkDate.toISOString().split('T')[0]);
        checkDate.setUTCDate(checkDate.getUTCDate() + 7);
      }

      // Find missing dates (expected but not existing)
      const missingDates = expectedDates.filter((d) => !existingDates.has(d));

      if (missingDates.length === 0) {
        continue; // All 5 future events exist
      }

      // Create events for missing dates
      for (const targetDateStr of missingDates) {
        const eventDate = new Date(targetDateStr + 'T00:00:00Z');

        // Generate title with date
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
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
