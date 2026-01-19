import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { sendSMS } from '@/lib/sms';
import crypto from 'crypto';

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

    // Get reminder settings for the event
    const firstSignup = signups[0];
    const settingsResult = await query(
      `SELECT rs.message_template, rs.coordinator_name, rs.coordinator_phone
       FROM reminder_settings rs
       WHERE rs.event_id = $1 OR (rs.organization_id = (
         SELECT organization_id FROM volunteer_lists WHERE id = $2 LIMIT 1
       ) AND rs.event_id IS NULL)
       ORDER BY rs.event_id DESC NULLS LAST
       LIMIT 1`,
      [firstSignup.event_id, firstSignup.list_id]
    );

    const settings = settingsResult.rows[0] || {};
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://church-volunteers.vercel.app';

    const defaultTemplate =
      settings.message_template ||
      "Hi {name}, reminder: You're signed up for {role} at {event} on {date}. Can't make it? {self_service_url} Questions? Text {coordinator_name} at {coordinator_phone}. Reply STOP to unsubscribe.";

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results: any[] = [];

    // Cache tokens by phone to avoid duplicate generation
    const tokenCache: Record<string, string> = {};

    for (const signup of signups) {
      // Format the date
      const dateStr = signup.event_date
        ? new Date(signup.event_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : 'TBD';

      // Get or create token for self-service URL
      let token = tokenCache[signup.phone];
      if (!token) {
        // Check for existing valid token
        const existingToken = await query(
          `SELECT token FROM volunteer_tokens WHERE phone = $1 AND expires_at > NOW() LIMIT 1`,
          [signup.phone]
        );

        if (existingToken.rows.length > 0) {
          token = existingToken.rows[0].token;
        } else {
          // Generate new token
          token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await query(
            `INSERT INTO volunteer_tokens (phone, token, organization_id, expires_at)
             VALUES ($1, $2, NULL, $3)
             ON CONFLICT DO NOTHING`,
            [signup.phone, token, expiresAt]
          );
        }
        tokenCache[signup.phone] = token;
      }

      const selfServiceUrl = `${baseUrl}/volunteer/manage/${token}`;

      // Build message from template
      const message = defaultTemplate
        .replace('{name}', signup.name.split(' ')[0]) // First name only
        .replace('{role}', signup.role_title)
        .replace('{event}', signup.event_title)
        .replace('{date}', dateStr)
        .replace('{self_service_url}', selfServiceUrl)
        .replace('{coordinator_name}', settings.coordinator_name || 'your coordinator')
        .replace('{coordinator_phone}', settings.coordinator_phone || '');

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
