import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET /api/admin/lists/[listId]/signups - Get all signups for a list with reminder status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listId: listIdParam } = await params;
    const listId = parseInt(listIdParam);
    if (isNaN(listId)) {
      return NextResponse.json({ error: 'Invalid list ID' }, { status: 400 });
    }

    // Get signups with their latest reminder status
    const result = await query(
      `SELECT 
        vs.id,
        vs.name,
        vs.phone,
        vs.email,
        vs.sms_consent,
        vs.sms_opted_out,
        vs.created_at as signed_up_at,
        vs.last_reminder_sent_at,
        vs.reminder_count,
        -- Get latest reminder SMS status
        (
          SELECT json_build_object(
            'status', sm.status,
            'sent_at', sm.sent_at,
            'error_message', sm.error_message
          )
          FROM sms_messages sm
          WHERE sm.signup_id = vs.id 
            AND sm.message_type = 'reminder'
          ORDER BY sm.created_at DESC
          LIMIT 1
        ) as last_reminder,
        -- Get any replies from this phone linked to reminders for this signup
        (
          SELECT json_agg(json_build_object(
            'id', sr.id,
            'message', sr.message,
            'received_at', sr.received_at,
            'is_read', sr.is_read,
            'detected_intent', sr.detected_intent
          ) ORDER BY sr.received_at DESC)
          FROM sms_replies sr
          JOIN sms_messages sm ON sr.sms_message_id = sm.id
          WHERE sm.signup_id = vs.id
            AND sr.received_at > vs.created_at
        ) as replies
      FROM volunteer_signups vs
      WHERE vs.list_id = $1
      ORDER BY vs.created_at DESC`,
      [listId]
    );

    // Process signups to add computed reminder_status
    const signups = result.rows.map((signup: any) => {
      let reminder_status: 'sent' | 'pending' | 'failed' | 'no_phone' | 'opted_out' | 'no_consent' =
        'pending';

      if (!signup.phone) {
        reminder_status = 'no_phone';
      } else if (signup.sms_opted_out) {
        reminder_status = 'opted_out';
      } else if (!signup.sms_consent) {
        reminder_status = 'no_consent';
      } else if (signup.last_reminder) {
        if (signup.last_reminder.status === 'sent' || signup.last_reminder.status === 'delivered') {
          reminder_status = 'sent';
        } else if (signup.last_reminder.status === 'failed') {
          reminder_status = 'failed';
        }
      }

      return {
        id: signup.id,
        name: signup.name,
        phone: signup.phone,
        email: signup.email,
        sms_consent: signup.sms_consent,
        sms_opted_out: signup.sms_opted_out,
        signed_up_at: signup.signed_up_at,
        reminder_status,
        last_reminder_sent_at: signup.last_reminder?.sent_at || null,
        reminder_error: signup.last_reminder?.error_message || null,
        reminder_count: signup.reminder_count || 0,
        replies: signup.replies || [],
        has_unread_replies: (signup.replies || []).some((r: any) => !r.is_read),
      };
    });

    return NextResponse.json({ signups });
  } catch (error: any) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
