import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/volunteer/manage/[token] - Get all signups for this token
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find token and check expiration
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

    // Update last used
    await query(`UPDATE volunteer_tokens SET last_used_at = NOW() WHERE id = $1`, [tokenData.id]);

    // Get all upcoming signups for this phone number
    const signupsResult = await query(
      `SELECT 
        vs.id,
        vs.name,
        vs.email,
        vs.phone,
        vs.created_at as signed_up_at,
        vs.cancelled_at,
        vl.id as list_id,
        vl.title as role_title,
        ve.id as event_id,
        ve.title as event_title,
        ve.event_date,
        rs.coordinator_name,
        rs.coordinator_phone
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      JOIN volunteer_events ve ON vl.event_id = ve.id
      LEFT JOIN reminder_settings rs ON rs.event_id = ve.id OR (rs.organization_id = vl.organization_id AND rs.event_id IS NULL)
      WHERE vs.phone = $1
        AND vs.cancelled_at IS NULL
        AND (ve.event_date IS NULL OR ve.event_date >= CURRENT_DATE)
      ORDER BY ve.event_date ASC NULLS LAST, vl.sort_order ASC`,
      [phone]
    );

    // Group by event
    const eventMap = new Map();
    for (const signup of signupsResult.rows) {
      const eventKey = signup.event_id;
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          eventId: signup.event_id,
          eventTitle: signup.event_title,
          eventDate: signup.event_date,
          coordinatorName: signup.coordinator_name,
          coordinatorPhone: signup.coordinator_phone,
          signups: [],
        });
      }
      eventMap.get(eventKey).signups.push({
        id: signup.id,
        name: signup.name,
        roleTitle: signup.role_title,
        signedUpAt: signup.signed_up_at,
      });
    }

    return NextResponse.json({
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask middle digits
      events: Array.from(eventMap.values()),
    });
  } catch (error) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: 'Failed to load signups' }, { status: 500 });
  }
}
