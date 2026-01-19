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
    // Use DISTINCT ON to avoid duplicates from reminder_settings join
    const signupsResult = await query(
      `SELECT DISTINCT ON (vs.id)
        vs.id,
        vs.name,
        vs.email,
        vs.phone,
        vs.created_at as signed_up_at,
        vs.cancelled_at,
        vl.id as list_id,
        vl.title as role_title,
        vl.sort_order,
        ve.id as event_id,
        ve.title as event_title,
        ve.event_date,
        COALESCE(rs_event.coordinator_name, rs_org.coordinator_name) as coordinator_name,
        COALESCE(rs_event.coordinator_phone, rs_org.coordinator_phone) as coordinator_phone
      FROM volunteer_signups vs
      JOIN volunteer_lists vl ON vs.list_id = vl.id
      JOIN volunteer_events ve ON vl.event_id = ve.id
      LEFT JOIN reminder_settings rs_event ON rs_event.event_id = ve.id
      LEFT JOIN reminder_settings rs_org ON rs_org.organization_id = vl.organization_id AND rs_org.event_id IS NULL
      WHERE vs.phone = $1
        AND vs.cancelled_at IS NULL
        AND (ve.event_date IS NULL OR ve.event_date >= CURRENT_DATE)
      ORDER BY vs.id, ve.event_date ASC NULLS LAST, vl.sort_order ASC`,
      [phone]
    );

    // Re-sort after DISTINCT ON (which requires ordering by vs.id first)
    const sortedSignups = signupsResult.rows.sort((a: any, b: any) => {
      if (a.event_date === null && b.event_date === null) return a.sort_order - b.sort_order;
      if (a.event_date === null) return 1;
      if (b.event_date === null) return -1;
      const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.sort_order - b.sort_order;
    });

    // Group by event
    const eventMap = new Map();
    for (const signup of sortedSignups) {
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

    // Mask phone: +1234567890 -> +1***567890
    const maskedPhone = phone.replace(/^(\+?\d{2})\d{3}(\d{4})$/, '$1***$2');

    return NextResponse.json({
      phone: maskedPhone,
      events: Array.from(eventMap.values()),
    });
  } catch (error) {
    console.error('Error fetching signups:', error);
    return NextResponse.json({ error: 'Failed to load signups' }, { status: 500 });
  }
}
