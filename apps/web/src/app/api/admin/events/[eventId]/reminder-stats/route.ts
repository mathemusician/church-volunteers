import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId: eventIdParam } = await params;
    const eventId = parseInt(eventIdParam);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // Get comprehensive stats for the event
    const result = await query(
      `SELECT 
        COUNT(DISTINCT vs.id) as total_volunteers,
        COUNT(DISTINCT CASE WHEN vs.phone IS NOT NULL THEN vs.id END) as with_phone,
        COUNT(DISTINCT CASE WHEN vs.phone IS NOT NULL AND COALESCE(vs.sms_consent, false) = true AND COALESCE(vs.sms_opted_out, false) = false THEN vs.id END) as with_consent,
        COUNT(DISTINCT CASE WHEN vs.last_reminder_sent_at IS NOT NULL AND vs.last_reminder_sent_at > NOW() - INTERVAL '7 days' THEN vs.id END) as reminders_sent,
        COUNT(DISTINCT CASE 
          WHEN vs.phone IS NOT NULL 
            AND COALESCE(vs.sms_consent, false) = true 
            AND COALESCE(vs.sms_opted_out, false) = false
            AND (vs.last_reminder_sent_at IS NULL OR vs.last_reminder_sent_at < NOW() - INTERVAL '1 day')
          THEN vs.id 
        END) as reminders_pending,
        COUNT(DISTINCT CASE 
          WHEN sm.status = 'failed' 
            AND sm.created_at > NOW() - INTERVAL '7 days'
          THEN vs.id 
        END) as reminders_failed,
        COUNT(DISTINCT CASE WHEN vs.confirmed_at IS NOT NULL THEN vs.id END) as confirmed,
        COUNT(DISTINCT CASE WHEN vs.confirmed_at IS NULL AND vs.cancelled_at IS NULL THEN vs.id END) as unconfirmed,
        MAX(vs.last_reminder_sent_at) as last_reminder_sent_at
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      LEFT JOIN sms_messages sm ON sm.signup_id = vs.id AND sm.message_type = 'reminder'
      WHERE vl.event_id = $1 AND vs.cancelled_at IS NULL`,
      [eventId]
    );

    const stats = result.rows[0];

    return NextResponse.json({
      totalVolunteers: parseInt(stats.total_volunteers) || 0,
      withPhone: parseInt(stats.with_phone) || 0,
      withConsent: parseInt(stats.with_consent) || 0,
      remindersSent: parseInt(stats.reminders_sent) || 0,
      remindersPending: parseInt(stats.reminders_pending) || 0,
      remindersFailed: parseInt(stats.reminders_failed) || 0,
      confirmed: parseInt(stats.confirmed) || 0,
      unconfirmed: parseInt(stats.unconfirmed) || 0,
      lastReminderSentAt: stats.last_reminder_sent_at || null,
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    return NextResponse.json({ error: 'Failed to fetch reminder stats' }, { status: 500 });
  }
}
