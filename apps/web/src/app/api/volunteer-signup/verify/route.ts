import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { signupId, token } = await request.json();

    if (!signupId) {
      return NextResponse.json({ error: 'Signup ID is required' }, { status: 400 });
    }

    // Look up the signup
    const result = await query(
      `SELECT 
        vs.id,
        vs.name,
        vs.qr_token,
        vs.created_at,
        vl.title as role,
        ve.title as event_title,
        ve.event_date
       FROM volunteer_signups vs
       JOIN volunteer_lists vl ON vs.list_id = vl.id
       JOIN volunteer_events ve ON vl.event_id = ve.id
       WHERE vs.id = $1`,
      [signupId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Signup not found',
        },
        { status: 404 }
      );
    }

    const signup = result.rows[0];

    // If token is provided, verify it matches
    if (token && signup.qr_token && signup.qr_token !== token) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid QR code',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      volunteer: {
        id: signup.id,
        name: signup.name,
        role: signup.role,
        eventTitle: signup.event_title,
        eventDate: signup.event_date,
        signedUpAt: signup.created_at,
      },
    });
  } catch (error) {
    console.error('Error verifying signup:', error);
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 500 });
  }
}
