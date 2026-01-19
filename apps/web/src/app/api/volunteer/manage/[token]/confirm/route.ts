import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/volunteer/manage/[token]/confirm - Confirm a signup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { signupId } = body;

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

    // Verify signup belongs to this phone and confirm it
    const confirmResult = await query(
      `UPDATE volunteer_signups 
       SET confirmed_at = NOW(), confirmed_via = 'web'
       WHERE id = $1 AND phone = $2 AND cancelled_at IS NULL AND confirmed_at IS NULL
       RETURNING id`,
      [signupId, phone]
    );

    if (confirmResult.rows.length === 0) {
      // Check if already confirmed
      const existingResult = await query(
        `SELECT confirmed_at FROM volunteer_signups WHERE id = $1 AND phone = $2`,
        [signupId, phone]
      );

      if (existingResult.rows.length > 0 && existingResult.rows[0].confirmed_at) {
        return NextResponse.json({ success: true, message: 'Already confirmed' });
      }

      return NextResponse.json({ error: 'Signup not found or already cancelled' }, { status: 404 });
    }

    // Update last used on token
    await query(`UPDATE volunteer_tokens SET last_used_at = NOW() WHERE id = $1`, [tokenData.id]);

    return NextResponse.json({
      success: true,
      message: 'Signup confirmed!',
    });
  } catch (error) {
    console.error('Error confirming signup:', error);
    return NextResponse.json({ error: 'Failed to confirm signup' }, { status: 500 });
  }
}
