import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';
import { getCurrentOrgContext } from '@/lib/orgContext';

// GET SMS logs for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 'sent', 'failed', 'pending', or null for all

    let whereClause = 'WHERE ve.organization_id = $1';
    const params: any[] = [orgContext.organizationId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND sm.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT 
        sm.id,
        sm.to_phone,
        sm.message,
        sm.status,
        sm.error_message,
        sm.message_type,
        sm.created_at,
        sm.sent_at,
        vs.name as volunteer_name,
        ve.title as event_title
      FROM sms_messages sm
      LEFT JOIN volunteer_signups vs ON sm.signup_id = vs.id
      LEFT JOIN volunteer_lists vl ON vs.list_id = vl.id
      LEFT JOIN volunteer_events ve ON sm.event_id = ve.id OR vl.event_id = ve.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM sms_messages sm
       LEFT JOIN volunteer_signups vs ON sm.signup_id = vs.id
       LEFT JOIN volunteer_lists vl ON vs.list_id = vl.id
       LEFT JOIN volunteer_events ve ON sm.event_id = ve.id OR vl.event_id = ve.id
       ${whereClause}`,
      params.slice(0, paramIndex - 1)
    );

    // Get stats
    const statsResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE sm.status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE sm.status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE sm.status = 'pending') as pending_count,
        COUNT(*) as total_count
      FROM sms_messages sm
      LEFT JOIN volunteer_signups vs ON sm.signup_id = vs.id
      LEFT JOIN volunteer_lists vl ON vs.list_id = vl.id
      LEFT JOIN volunteer_events ve ON sm.event_id = ve.id OR vl.event_id = ve.id
      WHERE ve.organization_id = $1`,
      [orgContext.organizationId]
    );

    return NextResponse.json({
      messages: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      stats: statsResult.rows[0] || {
        sent_count: 0,
        failed_count: 0,
        pending_count: 0,
        total_count: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching SMS logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
