import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET /api/admin/reminder-settings - Get reminder settings for org or event
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const eventId = searchParams.get('eventId');

    // Get event-specific settings if eventId provided, otherwise org defaults
    let result;
    if (eventId) {
      // First try event-specific, then fall back to org-level
      result = await query(
        `SELECT rs.*, ve.id as event_id_check
         FROM reminder_settings rs
         LEFT JOIN volunteer_events ve ON rs.event_id = ve.id
         WHERE rs.event_id = $1
         LIMIT 1`,
        [eventId]
      );

      // If no event-specific settings, try org-level
      if (result.rows.length === 0 && organizationId) {
        result = await query(
          `SELECT * FROM reminder_settings 
           WHERE organization_id = $1 AND event_id IS NULL
           LIMIT 1`,
          [organizationId]
        );
      }
    } else if (organizationId) {
      result = await query(
        `SELECT * FROM reminder_settings 
         WHERE organization_id = $1 AND event_id IS NULL
         LIMIT 1`,
        [organizationId]
      );
    } else {
      return NextResponse.json(
        { error: 'Organization ID or Event ID is required' },
        { status: 400 }
      );
    }

    if (result.rows.length === 0) {
      // Return default settings
      return NextResponse.json({
        settings: {
          id: null,
          organization_id: organizationId ? parseInt(organizationId) : null,
          event_id: eventId ? parseInt(eventId) : null,
          schedule: [{ type: 'days_before', value: 1, time: '18:00' }],
          message_template:
            "Hi {name}, reminder: You're signed up for {role} at {event} on {date}. Can't make it? {self_service_url} Questions? Text {coordinator_name} at {coordinator_phone}. Reply STOP to unsubscribe.",
          coordinator_name: '',
          coordinator_phone: '',
          enabled: true,
          is_default: true,
        },
      });
    }

    return NextResponse.json({
      settings: {
        ...result.rows[0],
        is_default: false,
      },
    });
  } catch (error: any) {
    console.error('Error fetching reminder settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/reminder-settings - Create or update reminder settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      organizationId,
      eventId,
      schedule,
      messageTemplate,
      coordinatorName,
      coordinatorPhone,
      enabled,
    } = body;

    // Get org ID from event if not provided
    let orgId = organizationId;
    if (!orgId && eventId) {
      const eventResult = await query(
        `SELECT vl.organization_id FROM volunteer_events ve
         JOIN volunteer_lists vl ON vl.event_id = ve.id
         WHERE ve.id = $1 LIMIT 1`,
        [eventId]
      );
      if (eventResult.rows.length > 0) {
        orgId = eventResult.rows[0].organization_id;
      }
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Could not determine organization' }, { status: 400 });
    }

    // Validate schedule format
    if (schedule && !Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Schedule must be an array' }, { status: 400 });
    }

    // Upsert settings
    const result = await query(
      `INSERT INTO reminder_settings (organization_id, event_id, schedule, message_template, coordinator_name, coordinator_phone, enabled, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (organization_id, event_id) 
       DO UPDATE SET 
         schedule = COALESCE($3, reminder_settings.schedule),
         message_template = COALESCE($4, reminder_settings.message_template),
         coordinator_name = COALESCE($5, reminder_settings.coordinator_name),
         coordinator_phone = COALESCE($6, reminder_settings.coordinator_phone),
         enabled = COALESCE($7, reminder_settings.enabled),
         updated_at = NOW()
       RETURNING *`,
      [
        orgId,
        eventId || null,
        schedule ? JSON.stringify(schedule) : null,
        messageTemplate || null,
        coordinatorName || null,
        coordinatorPhone || null,
        enabled !== undefined ? enabled : null,
      ]
    );

    return NextResponse.json({ settings: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving reminder settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/reminder-settings - Update specific fields
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, schedule, message_template, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: 'Settings ID is required' }, { status: 400 });
    }

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [id];
    let paramCount = 2;

    if (schedule !== undefined) {
      updates.push(`schedule = $${paramCount}`);
      values.push(JSON.stringify(schedule));
      paramCount++;
    }
    if (message_template !== undefined) {
      updates.push(`message_template = $${paramCount}`);
      values.push(message_template);
      paramCount++;
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramCount}`);
      values.push(enabled);
      paramCount++;
    }

    const result = await query(
      `UPDATE reminder_settings 
       SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating reminder settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
