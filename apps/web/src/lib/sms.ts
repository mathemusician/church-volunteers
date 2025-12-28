// SMS utility using Textbelt API
import { query } from '@/lib/db';

// E.164 format validation for US/Canada numbers
// Valid: +1XXXXXXXXXX (11 digits starting with +1)
const E164_REGEX = /^\+1[2-9]\d{9}$/;

export function formatPhoneNumber(input: string): string | null {
  if (!input) return null;

  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // Must be 10 or 11 digits (US/Canada numbers)
  let formatted: string | null = null;

  if (digits.length === 10) {
    formatted = '+1' + digits;
  } else if (digits.length === 11 && digits[0] === '1') {
    formatted = '+' + digits;
  }

  // Validate E.164 format (first digit after country code must be 2-9)
  if (formatted && E164_REGEX.test(formatted)) {
    return formatted;
  }

  return null; // Invalid
}

export function isValidPhoneNumber(input: string): boolean {
  return formatPhoneNumber(input) !== null;
}

export function getPhoneValidationError(input: string): string | null {
  if (!input) return null; // Empty is OK (optional field)

  const digits = input.replace(/\D/g, '');

  if (digits.length < 10) {
    return 'Phone number must be 10 digits';
  }
  if (digits.length > 11) {
    return 'Phone number is too long';
  }
  if (digits.length === 11 && digits[0] !== '1') {
    return 'Invalid country code (US/Canada only)';
  }

  const formatted = formatPhoneNumber(input);
  if (!formatted) {
    return 'Invalid phone number format';
  }

  return null; // Valid
}

interface SendSMSOptions {
  to: string;
  message: string;
  signupId?: number;
  eventId?: number;
  messageType?: 'confirmation' | 'reminder' | 'cancellation' | 'change';
}

interface SendSMSResult {
  success: boolean;
  textId?: string;
  error?: string;
  quotaRemaining?: number;
}

export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResult> {
  const { to, message, signupId, eventId, messageType = 'confirmation' } = options;
  const apiKey = process.env.TEXTBELT_API_KEY;

  if (!apiKey) {
    console.error('TEXTBELT_API_KEY not configured');
    return { success: false, error: 'SMS not configured' };
  }

  // Rate limiting: Check if we already sent this type of SMS for this signup today
  if (signupId) {
    try {
      const existing = await query(
        `SELECT id FROM sms_messages 
         WHERE signup_id = $1 
         AND message_type = $2 
         AND status IN ('sent', 'pending')
         AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [signupId, messageType]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️ Skipping duplicate ${messageType} SMS for signup ${signupId}`);
        return { success: true, error: 'Already sent' };
      }
    } catch (err) {
      console.error('Rate limit check failed:', err);
    }
  }

  // Create pending log entry
  let logId: number | null = null;
  try {
    const logResult = await query(
      `INSERT INTO sms_messages (to_phone, message, status, signup_id, event_id, message_type)
       VALUES ($1, $2, 'pending', $3, $4, $5)
       RETURNING id`,
      [to, message, signupId || null, eventId || null, messageType]
    );
    logId = logResult.rows[0]?.id;
  } catch (err) {
    console.error('Failed to create SMS log entry:', err);
  }

  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        phone: to,
        message: message,
        key: apiKey,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ SMS sent to ${to} (textId: ${result.textId})`);

      // Update log with success
      if (logId) {
        await query(
          `UPDATE sms_messages SET status = 'sent', text_id = $1, sent_at = NOW() WHERE id = $2`,
          [result.textId, logId]
        ).catch((err) => console.error('Failed to update SMS log:', err));
      }

      return { success: true, textId: result.textId, quotaRemaining: result.quotaRemaining };
    } else {
      console.error(`❌ SMS failed to ${to}:`, result.error);

      // Update log with failure
      if (logId) {
        await query(`UPDATE sms_messages SET status = 'failed', error_message = $1 WHERE id = $2`, [
          result.error,
          logId,
        ]).catch((err) => console.error('Failed to update SMS log:', err));
      }

      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error(`❌ SMS error:`, error.message);

    // Update log with error
    if (logId) {
      await query(`UPDATE sms_messages SET status = 'failed', error_message = $1 WHERE id = $2`, [
        error.message,
        logId,
      ]).catch((err) => console.error('Failed to update SMS log:', err));
    }

    return { success: false, error: error.message };
  }
}

// Check if a phone has opted out
export async function isOptedOut(phone: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT sms_opted_out FROM volunteer_signups WHERE phone = $1 AND sms_opted_out = true LIMIT 1`,
      [phone]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}
