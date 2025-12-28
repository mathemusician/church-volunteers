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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString().split('T')[0];

    const result = await query(
      `SELECT 
        vs.id as signup_id,
        vs.name as volunteer_name,
        vs.phone,
        ve.id as event_id,
        ve.title as event_title,
        ve.event_date,
        vl.title as list_title
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      JOIN volunteer_events ve ON vl.event_id = ve.id
      WHERE vs.phone IS NOT NULL
        AND vs.sms_consent = true
        AND vs.sms_opted_out = false
        AND DATE(ve.event_date) = $1
        AND NOT EXISTS (
          SELECT 1 FROM sms_messages sm 
          WHERE sm.signup_id = vs.id 
          AND sm.message_type = 'reminder'
          AND DATE(sm.created_at) = CURRENT_DATE
        )`,
      [tomorrowStart]
    );

    const volunteers = result.rows;
    let sent = 0;
    let failed = 0;

    for (const vol of volunteers) {
      const dateStr = new Date(vol.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      const message = `Reminder: You're signed up for ${vol.event_title} - ${vol.list_title} tomorrow (${dateStr}). Reply STOP to opt out.`;

      const smsResult = await sendSMS({
        to: vol.phone,
        message,
        signupId: vol.signup_id,
        eventId: vol.event_id,
        messageType: 'reminder',
      });

      if (smsResult.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`📱 Reminder cron: ${sent} sent, ${failed} failed, ${volunteers.length} total`);

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: volunteers.length,
    });
  } catch (error: any) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
