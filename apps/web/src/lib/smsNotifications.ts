// SMS notification helpers for event changes
import { query } from '@/lib/db';
import { sendSMS } from '@/lib/sms';

interface EventDetails {
  id: number;
  title: string;
  event_date: string | null;
}

// Get all volunteers with SMS consent for an event
async function getEventVolunteers(eventId: number) {
  const result = await query(
    `SELECT DISTINCT 
      vs.id as signup_id,
      vs.name,
      vs.phone,
      vl.title as list_title
    FROM volunteer_signups vs
    JOIN volunteer_lists vl ON vs.list_id = vl.id
    WHERE vl.event_id = $1
      AND vs.phone IS NOT NULL
      AND vs.sms_consent = true
      AND vs.sms_opted_out = false`,
    [eventId]
  );
  return result.rows;
}

// Send cancellation notifications to all volunteers for an event
export async function sendCancellationNotifications(
  event: EventDetails
): Promise<{ sent: number; failed: number }> {
  const volunteers = await getEventVolunteers(event.id);

  let sent = 0;
  let failed = 0;

  for (const vol of volunteers) {
    const message = `CANCELLED: ${event.title} - ${vol.list_title} has been cancelled. We apologize for any inconvenience.`;

    const result = await sendSMS({
      to: vol.phone,
      message,
      signupId: vol.signup_id,
      eventId: event.id,
      messageType: 'cancellation',
    });

    if (result.success && result.error !== 'Already sent') {
      sent++;
    } else if (!result.success) {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    `📱 Cancellation notifications for event ${event.id}: ${sent} sent, ${failed} failed`
  );
  return { sent, failed };
}

// Send change notifications to all volunteers for an event
export async function sendChangeNotifications(
  event: EventDetails,
  changeDescription: string
): Promise<{ sent: number; failed: number }> {
  const volunteers = await getEventVolunteers(event.id);

  let sent = 0;
  let failed = 0;

  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  for (const vol of volunteers) {
    const message = `UPDATE: ${event.title}${dateStr ? ` (${dateStr})` : ''} - ${changeDescription}. Reply STOP to opt out.`;

    const result = await sendSMS({
      to: vol.phone,
      message,
      signupId: vol.signup_id,
      eventId: event.id,
      messageType: 'change',
    });

    if (result.success && result.error !== 'Already sent') {
      sent++;
    } else if (!result.success) {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`📱 Change notifications for event ${event.id}: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

// Send notification to a specific volunteer
export async function sendVolunteerNotification(
  signupId: number,
  message: string,
  messageType: 'confirmation' | 'reminder' | 'cancellation' | 'change' = 'change'
): Promise<boolean> {
  const result = await query(
    `SELECT vs.phone, vl.event_id
     FROM volunteer_signups vs
     JOIN volunteer_lists vl ON vs.list_id = vl.id
     WHERE vs.id = $1
       AND vs.phone IS NOT NULL
       AND vs.sms_consent = true
       AND vs.sms_opted_out = false`,
    [signupId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const { phone, event_id } = result.rows[0];

  const smsResult = await sendSMS({
    to: phone,
    message,
    signupId,
    eventId: event_id,
    messageType,
  });

  return smsResult.success;
}
