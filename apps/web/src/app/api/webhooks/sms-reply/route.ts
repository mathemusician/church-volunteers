import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendSMS } from '@/lib/sms';
import crypto from 'crypto';

interface TextbeltReplyPayload {
  textId: string;
  fromNumber: string;
  text: string;
  data?: string;
}

// Verify Textbelt webhook signature
function verifySignature(
  signature: string | null,
  timestamp: string | null,
  payload: string,
  apiKey: string
): boolean {
  if (!signature || !timestamp) return false;

  // Check timestamp is not too old (15 minutes)
  const timestampNum = parseInt(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > 900) {
    console.warn('Webhook timestamp too old');
    return false;
  }

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(timestamp + payload)
    .digest('hex');

  // Ensure buffers are same length before comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Detect intent from message
function detectIntent(message: string): string {
  const lower = message.toLowerCase().trim();

  if (['stop', 'stopall', 'unsubscribe', 'quit', 'end', 'cancel'].includes(lower)) {
    return 'stop';
  }
  if (['start', 'subscribe', 'unstop'].includes(lower)) {
    return 'start';
  }
  if (['help', '?', 'info'].includes(lower)) {
    return 'help';
  }
  if (['status', 'list', 'signups'].includes(lower)) {
    return 'status';
  }
  if (['yes', 'y', 'confirm', 'confirmed', 'ok', 'okay', 'sure', 'yep', 'yup'].includes(lower)) {
    return 'confirm';
  }
  return 'other';
}

// Generate or get existing token for a phone number
async function getOrCreateToken(phone: string, _organizationId: number | null): Promise<string> {
  // Check for existing valid token (ignore org_id since tokens are per-phone)
  const existing = await query(
    `SELECT token FROM volunteer_tokens 
     WHERE phone = $1 AND expires_at > NOW() 
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].token;
  }

  // Generate new token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Use simple insert - if conflict on token (unlikely), retry
  await query(
    `INSERT INTO volunteer_tokens (phone, token, organization_id, expires_at)
     VALUES ($1, $2, NULL, $3)`,
    [phone, token, expiresAt]
  );

  return token;
}

// Get coordinator info for a phone number
async function getCoordinatorInfo(phone: string): Promise<{ name: string; phone: string } | null> {
  const result = await query(
    `SELECT DISTINCT rs.coordinator_name, rs.coordinator_phone
     FROM volunteer_signups vs
     JOIN volunteer_lists vl ON vs.list_id = vl.id
     LEFT JOIN reminder_settings rs ON rs.event_id = vl.event_id OR (rs.organization_id = vl.organization_id AND rs.event_id IS NULL)
     WHERE vs.phone = $1 AND rs.coordinator_name IS NOT NULL
     LIMIT 1`,
    [phone]
  );

  if (result.rows.length > 0 && result.rows[0].coordinator_name) {
    return {
      name: result.rows[0].coordinator_name,
      phone: result.rows[0].coordinator_phone || '',
    };
  }
  return null;
}

// POST /api/webhooks/sms-reply - Receive SMS replies from Textbelt
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload: TextbeltReplyPayload = JSON.parse(rawBody);

    // Verify signature in production
    const apiKey = process.env.TEXTBELT_API_KEY;
    if (process.env.NODE_ENV === 'production' && apiKey) {
      const signature = request.headers.get('X-textbelt-signature');
      const timestamp = request.headers.get('X-textbelt-timestamp');

      if (!verifySignature(signature, timestamp, rawBody, apiKey)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { textId, fromNumber, text, data } = payload;

    console.log(`📨 SMS Reply received from ${fromNumber}: "${text}"`);

    // Find the original SMS message
    const originalMessage = await query(
      `SELECT id, signup_id, event_id FROM sms_messages WHERE text_id = $1 LIMIT 1`,
      [textId]
    );

    const smsMessageId = originalMessage.rows[0]?.id || null;

    // Detect intent
    const detectedIntent = detectIntent(text);

    // Parse webhook data if present
    let webhookData = null;
    if (data) {
      try {
        webhookData = JSON.parse(data);
      } catch {
        webhookData = { raw: data };
      }
    }

    // Store the reply
    await query(
      `INSERT INTO sms_replies (sms_message_id, text_id, from_number, message, webhook_data, detected_intent, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        smsMessageId,
        textId,
        fromNumber,
        text,
        webhookData ? JSON.stringify(webhookData) : null,
        detectedIntent,
      ]
    );

    // Handle intents
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://church-volunteers.vercel.app';

    if (detectedIntent === 'stop') {
      // Opt out the user
      await query(
        `UPDATE volunteer_signups 
         SET sms_opted_out = true, sms_opted_out_at = NOW() 
         WHERE phone = $1`,
        [fromNumber]
      );
      console.log(`🚫 User ${fromNumber} opted out of SMS`);

      // Send confirmation (required by TCPA)
      await sendSMS({
        to: fromNumber,
        message: "You've been unsubscribed from volunteer reminders. Reply START to resubscribe.",
        messageType: 'system',
      });
    } else if (detectedIntent === 'start') {
      // Re-subscribe the user
      await query(
        `UPDATE volunteer_signups 
         SET sms_opted_out = false, sms_opted_out_at = NULL 
         WHERE phone = $1`,
        [fromNumber]
      );
      console.log(`✅ User ${fromNumber} re-subscribed to SMS`);

      await sendSMS({
        to: fromNumber,
        message:
          "You've been resubscribed to volunteer reminders. Reply HELP for help. Reply STOP to unsubscribe.",
        messageType: 'system',
      });
    } else if (detectedIntent === 'help') {
      // Send help message with self-service link
      const token = await getOrCreateToken(fromNumber, null);
      const selfServiceUrl = `${baseUrl}/volunteer/manage/${token}`;
      const coordinator = await getCoordinatorInfo(fromNumber);

      let helpMessage = `Volunteer SMS Help:\n• Manage signups: ${selfServiceUrl}\n• Reply STOP to unsubscribe`;
      if (coordinator?.name) {
        helpMessage += `\n• Questions? Contact ${coordinator.name}`;
        if (coordinator.phone) helpMessage += ` at ${coordinator.phone}`;
      }

      await sendSMS({
        to: fromNumber,
        message: helpMessage,
        messageType: 'system',
      });
      console.log(`ℹ️ Sent HELP response to ${fromNumber}`);
    } else if (detectedIntent === 'status') {
      // Send status with signup list and self-service link
      const token = await getOrCreateToken(fromNumber, null);
      const selfServiceUrl = `${baseUrl}/volunteer/manage/${token}`;

      // Get upcoming signups for this phone
      const signupsResult = await query(
        `SELECT vs.name, vl.title as role, ve.title as event, ve.event_date
         FROM volunteer_signups vs
         JOIN volunteer_lists vl ON vs.list_id = vl.id
         JOIN volunteer_events ve ON vl.event_id = ve.id
         WHERE vs.phone = $1 
           AND vs.cancelled_at IS NULL
           AND (ve.event_date IS NULL OR ve.event_date >= CURRENT_DATE)
         ORDER BY ve.event_date ASC NULLS LAST
         LIMIT 5`,
        [fromNumber]
      );

      let statusMessage = 'Your upcoming signups:\n';
      if (signupsResult.rows.length === 0) {
        statusMessage = 'No upcoming signups found.\n';
      } else {
        for (const s of signupsResult.rows) {
          const dateStr = s.event_date
            ? new Date(s.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'TBD';
          statusMessage += `• ${dateStr}: ${s.role}\n`;
        }
      }
      statusMessage += `\nManage: ${selfServiceUrl}\nReply STOP to unsubscribe.`;

      await sendSMS({
        to: fromNumber,
        message: statusMessage,
        messageType: 'system',
      });
      console.log(`📋 Sent STATUS response to ${fromNumber}`);
    } else if (detectedIntent === 'confirm') {
      // Confirm all upcoming signups for this phone that haven't been confirmed yet
      const confirmResult = await query(
        `UPDATE volunteer_signups vs
         SET confirmed_at = NOW(), confirmed_via = 'sms'
         FROM volunteer_lists vl
         JOIN volunteer_events ve ON vl.event_id = ve.id
         WHERE vs.list_id = vl.id
           AND vs.phone = $1
           AND vs.cancelled_at IS NULL
           AND vs.confirmed_at IS NULL
           AND (ve.event_date IS NULL OR ve.event_date >= CURRENT_DATE)
         RETURNING vs.id, vl.title as role, ve.title as event, ve.event_date`,
        [fromNumber]
      );

      if (confirmResult.rows.length === 0) {
        // No unconfirmed signups found
        await sendSMS({
          to: fromNumber,
          message:
            "You don't have any unconfirmed signups. Reply STATUS to see your signups or HELP for assistance.",
          messageType: 'system',
        });
      } else {
        // Build confirmation message
        let confirmMessage = `✓ Confirmed ${confirmResult.rows.length} signup${confirmResult.rows.length > 1 ? 's' : ''}:\n`;
        for (const s of confirmResult.rows.slice(0, 3)) {
          const dateStr = s.event_date
            ? new Date(s.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'TBD';
          confirmMessage += `• ${dateStr}: ${s.role}\n`;
        }
        if (confirmResult.rows.length > 3) {
          confirmMessage += `...and ${confirmResult.rows.length - 3} more\n`;
        }
        confirmMessage += '\nSee you there! Reply HELP for assistance.';

        await sendSMS({
          to: fromNumber,
          message: confirmMessage,
          messageType: 'system',
        });
      }
      console.log(`✓ Confirmed ${confirmResult.rows.length} signups for ${fromNumber}`);
    }

    // Log for debugging
    console.log(`✅ SMS Reply stored: textId=${textId}, intent=${detectedIntent}`);

    return NextResponse.json({ success: true, intent: detectedIntent });
  } catch (error: any) {
    console.error('SMS Reply webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'sms-reply-webhook' });
}
