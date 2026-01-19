import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

  if (['yes', 'y', 'confirm', 'confirmed', 'ok', 'okay', 'sure', 'yep', 'yup'].includes(lower)) {
    return 'confirm';
  }
  if (['no', 'n', 'cancel', 'cant', "can't", 'cannot', 'nope'].includes(lower)) {
    return 'cancel';
  }
  if (['stop', 'unsubscribe', 'quit', 'end'].includes(lower)) {
    return 'stop';
  }
  if (['help', '?', 'info'].includes(lower)) {
    return 'help';
  }
  return 'other';
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

    // Handle STOP intent - opt out the user
    if (detectedIntent === 'stop') {
      await query(
        `UPDATE volunteer_signups 
         SET sms_opted_out = true, sms_opted_out_at = NOW() 
         WHERE phone = $1`,
        [fromNumber]
      );
      console.log(`🚫 User ${fromNumber} opted out of SMS`);
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
