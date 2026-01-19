import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { sendSMS } from '@/lib/sms';

interface SendReminderBody {
  listId?: number;
  signupId?: number;
  eventId?: number;
}

// POST /api/admin/reminders/send - Send reminders manually
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SendReminderBody = await request.json();
    const { listId, signupId, eventId } = body;

    if (!listId && !signupId && !eventId) {
      return NextResponse.json(
        { error: 'Must provide listId, signupId, or eventId' },
        { status: 400 }
      );
    }

    // Build query to get signups to remind
    let signupsQuery = `
      SELECT 
        vs.id as signup_id,
        vs.name,
        vs.phone,
        vs.sms_consent,
        vs.sms_opted_out,
        vl.id as list_id,
        vl.title as role_title,
        ve.id as event_id,
        ve.title as event_title,
        ve.event_date
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      JOIN volunteer_events ve ON vl.event_id = ve.id
      WHERE vs.phone IS NOT NULL
        AND COALESCE(vs.sms_consent, false) = true
        AND COALESCE(vs.sms_opted_out, false) = false
    `;
    const queryParams: any[] = [];

    if (signupId) {
      queryParams.push(signupId);
      signupsQuery += ` AND vs.id = $${queryParams.length}`;
    } else if (listId) {
      queryParams.push(listId);
      signupsQuery += ` AND vl.id = $${queryParams.length}`;
    } else if (eventId) {
      queryParams.push(eventId);
      signupsQuery += ` AND ve.id = $${queryParams.length}`;
    }

    const signupsResult = await query(signupsQuery, queryParams);
    const signups = signupsResult.rows;

    if (signups.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        skipped: 0,
        message: 'No eligible signups found (need phone + SMS consent + not opted out)',
      });
    }

    // Get reminder settings for the organization/event
    // For now, use a default template
    const defaultTemplate =
      "Hi {name}, reminder: You're signed up for {role} at {event} on {date}. Questions? Contact your coordinator.";

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const signup of signups) {
      // Format the date
      const dateStr = signup.event_date
        ? new Date(signup.event_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : 'TBD';

      // Build message from template
      const message = defaultTemplate
        .replace('{name}', signup.name.split(' ')[0]) // First name only
        .replace('{role}', signup.role_title)
        .replace('{event}', signup.event_title)
        .replace('{date}', dateStr);

      // Send SMS
      const smsResult = await sendSMS({
        to: signup.phone,
        message,
        signupId: signup.signup_id,
        eventId: signup.event_id,
        messageType: 'reminder',
      });

      if (smsResult.success) {
        if (smsResult.error === 'Already sent') {
          skipped++;
          results.push({
            signupId: signup.signup_id,
            name: signup.name,
            status: 'skipped',
            reason: 'Already sent today',
          });
        } else {
          sent++;
          // Update signup with reminder info
          await query(
            `UPDATE volunteer_signups 
             SET last_reminder_sent_at = NOW(), 
                 reminder_count = COALESCE(reminder_count, 0) + 1 
             WHERE id = $1`,
            [signup.signup_id]
          ).catch((err) => console.error('Failed to update signup reminder count:', err));

          results.push({
            signupId: signup.signup_id,
            name: signup.name,
            status: 'sent',
            textId: smsResult.textId,
          });
        }
      } else {
        failed++;
        results.push({
          signupId: signup.signup_id,
          name: signup.name,
          status: 'failed',
          error: smsResult.error,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      skipped,
      total: signups.length,
      results,
    });
  } catch (error: any) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
