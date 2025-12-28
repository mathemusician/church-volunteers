import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';
import { sendCancellationNotifications, sendChangeNotifications } from '@/lib/smsNotifications';

// POST - Send notifications to event volunteers
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

    const { eventId, type, message } = await request.json();

    if (!eventId || !type) {
      return NextResponse.json(
        { error: 'Event ID and notification type are required' },
        { status: 400 }
      );
    }

    // Verify event belongs to organization
    const eventResult = await query(
      'SELECT id, title, event_date FROM volunteer_events WHERE id = $1 AND organization_id = $2',
      [eventId, orgContext.organizationId]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];
    let result: { sent: number; failed: number };

    switch (type) {
      case 'cancellation':
        result = await sendCancellationNotifications(event);
        break;
      case 'change':
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required for change notifications' },
            { status: 400 }
          );
        }
        result = await sendChangeNotifications(event, message);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
