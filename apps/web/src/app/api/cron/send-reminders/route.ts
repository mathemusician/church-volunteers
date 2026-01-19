import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendSMS } from '@/lib/sms';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Find events happening tomorrow with volunteers who have SMS consent
    // Aggregate by phone+event to avoid duplicate messages for multiple signups
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString().split('T')[0];

    const result = await query(
      `SELECT 
        vs.phone,
        ve.id as event_id,
        ve.title as event_title,
        ve.event_date,
        MIN(vs.id) as signup_id,
        STRING_AGG(DISTINCT vl.title, ', ' ORDER BY vl.title) as list_titles
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      JOIN volunteer_events ve ON vl.event_id = ve.id
      WHERE vs.phone IS NOT NULL
        AND COALESCE(vs.sms_consent, false) = true
        AND COALESCE(vs.sms_opted_out, false) = false
        AND DATE(ve.event_date) = $1
        AND NOT EXISTS (
          SELECT 1 FROM sms_messages sm 
          WHERE sm.to_phone = vs.phone 
          AND sm.event_id = ve.id
          AND sm.message_type = 'reminder'
          AND DATE(sm.created_at) = CURRENT_DATE
        )
      GROUP BY vs.phone, ve.id, ve.title, ve.event_date`,
      [tomorrowStart]
    );

    const reminders = result.rows;
    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      const dateStr = new Date(reminder.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      // Combine all list titles into one message
      const message = `Reminder: You're signed up for ${reminder.event_title} (${reminder.list_titles}) tomorrow (${dateStr}). Reply STOP to opt out.`;

      const smsResult = await sendSMS({
        to: reminder.phone,
        message,
        signupId: reminder.signup_id,
        eventId: reminder.event_id,
        messageType: 'reminder',
      });

      if (smsResult.success && smsResult.error !== 'Already sent') {
        sent++;
        // Update signup with reminder info
        await query(
          `UPDATE volunteer_signups 
           SET last_reminder_sent_at = NOW(), 
               reminder_count = COALESCE(reminder_count, 0) + 1 
           WHERE id = $1`,
          [reminder.signup_id]
        ).catch((err) => console.error('Failed to update signup reminder count:', err));
      } else if (!smsResult.success) {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `📱 Reminder cron: ${sent} sent, ${failed} failed, ${reminders.length} unique phone+event combinations`
    );

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: reminders.length,
    });
  } catch (error: any) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
