import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendSMS, isValidPhoneNumber } from '@/lib/sms';

// POST /api/volunteer/manage/[token]/cancel - Cancel a signup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { signupId, reason } = body;

    if (!signupId) {
      return NextResponse.json({ error: 'Signup ID is required' }, { status: 400 });
    }

    // Verify token is valid
    const tokenResult = await query(
      `SELECT * FROM volunteer_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired link. Please request a new one.' },
        { status: 404 }
      );
    }

    const tokenData = tokenResult.rows[0];
    const phone = tokenData.phone;

    // Verify signup belongs to this phone and get coordinator info
    const signupResult = await query(
      `SELECT vs.*, vl.title as role_title, vl.organization_id, ve.id as event_id, ve.title as event_title, ve.event_date,
              COALESCE(rs_event.coordinator_name, rs_org.coordinator_name) as coordinator_name,
              COALESCE(rs_event.coordinator_phone, rs_org.coordinator_phone) as coordinator_phone
       FROM volunteer_signups vs
       JOIN volunteer_lists vl ON vs.list_id = vl.id
       JOIN volunteer_events ve ON vl.event_id = ve.id
       LEFT JOIN reminder_settings rs_event ON rs_event.event_id = ve.id
       LEFT JOIN reminder_settings rs_org ON rs_org.organization_id = vl.organization_id AND rs_org.event_id IS NULL
       WHERE vs.id = $1 AND vs.phone = $2 AND vs.cancelled_at IS NULL`,
      [signupId, phone]
    );

    if (signupResult.rows.length === 0) {
      return NextResponse.json({ error: 'Signup not found or already cancelled' }, { status: 404 });
    }

    const signup = signupResult.rows[0];

    // Cancel the signup
    await query(
      `UPDATE volunteer_signups 
       SET cancelled_at = NOW(), cancel_reason = $2
       WHERE id = $1`,
      [signupId, reason || null]
    );

    // Update last used on token
    await query(`UPDATE volunteer_tokens SET last_used_at = NOW() WHERE id = $1`, [tokenData.id]);

    // Notify coordinator if they have a valid phone number configured
    if (signup.coordinator_phone && isValidPhoneNumber(signup.coordinator_phone)) {
      const dateStr = signup.event_date
        ? new Date(signup.event_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : 'TBD';
      const reasonText = reason ? ` Reason: ${reason.replace(/_/g, ' ')}` : '';

      await sendSMS({
        to: signup.coordinator_phone,
        message: `⚠️ Cancellation: ${signup.name} cancelled their ${signup.role_title} signup for ${signup.event_title} (${dateStr}).${reasonText}`,
        eventId: signup.event_id,
        messageType: 'cancellation',
      }).catch((err) => console.error('Failed to notify coordinator:', err));
    }

    return NextResponse.json({
      success: true,
      message: `Cancelled: ${signup.role_title} at ${signup.event_title}`,
    });
  } catch (error) {
    console.error('Error cancelling signup:', error);
    return NextResponse.json({ error: 'Failed to cancel signup' }, { status: 500 });
  }
}
