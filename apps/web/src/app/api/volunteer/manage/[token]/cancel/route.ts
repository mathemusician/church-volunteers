import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    // Verify signup belongs to this phone
    const signupResult = await query(
      `SELECT vs.*, vl.title as role_title, ve.title as event_title
       FROM volunteer_signups vs
       JOIN volunteer_lists vl ON vs.list_id = vl.id
       JOIN volunteer_events ve ON vl.event_id = ve.id
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

    return NextResponse.json({
      success: true,
      message: `Cancelled: ${signup.role_title} at ${signup.event_title}`,
    });
  } catch (error) {
    console.error('Error cancelling signup:', error);
    return NextResponse.json({ error: 'Failed to cancel signup' }, { status: 500 });
  }
}
