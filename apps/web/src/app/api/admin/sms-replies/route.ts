import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/db';

// GET /api/admin/sms-replies - Get SMS replies for admin inbox
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let repliesQuery = `
      SELECT 
        sr.id,
        sr.from_number,
        sr.message,
        sr.detected_intent,
        sr.is_read,
        sr.received_at,
        sm.id as original_message_id,
        sm.message as original_message,
        sm.created_at as original_sent_at,
        vs.id as signup_id,
        vs.name as volunteer_name,
        vl.title as role_title,
        ve.id as event_id,
        ve.title as event_title,
        ve.event_date
      FROM sms_replies sr
      LEFT JOIN sms_messages sm ON sr.sms_message_id = sm.id
      LEFT JOIN volunteer_signups vs ON sm.signup_id = vs.id
      LEFT JOIN volunteer_lists vl ON vs.list_id = vl.id
      LEFT JOIN volunteer_events ve ON vl.event_id = ve.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    // When filtering by eventId, include replies that either:
    // 1. Are linked to that event, OR
    // 2. Have no event link (system messages like STOP/START)
    if (eventId) {
      queryParams.push(eventId);
      repliesQuery += ` AND (ve.id = $${queryParams.length} OR ve.id IS NULL)`;
    }

    if (unreadOnly) {
      repliesQuery += ` AND sr.is_read = false`;
    }

    repliesQuery += ` ORDER BY sr.received_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(limit);

    const result = await query(repliesQuery, queryParams);

    // Get unread count
    const unreadResult = await query(
      `SELECT COUNT(*) as count FROM sms_replies WHERE is_read = false`
    );

    // Group by phone number for conversation view
    const byPhone = new Map<string, any>();
    for (const reply of result.rows) {
      const phone = reply.from_number;
      if (!byPhone.has(phone)) {
        byPhone.set(phone, {
          phone,
          volunteerName: reply.volunteer_name,
          replies: [],
          hasUnread: false,
          latestAt: reply.received_at,
        });
      }
      const group = byPhone.get(phone);
      group.replies.push({
        id: reply.id,
        message: reply.message,
        intent: reply.detected_intent,
        isRead: reply.is_read,
        receivedAt: reply.received_at,
        originalMessage: reply.original_message,
        originalSentAt: reply.original_sent_at,
        eventTitle: reply.event_title,
        roleTitle: reply.role_title,
        eventDate: reply.event_date,
      });
      if (!reply.is_read) {
        group.hasUnread = true;
      }
    }

    return NextResponse.json({
      conversations: Array.from(byPhone.values()),
      unreadCount: parseInt(unreadResult.rows[0].count),
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error fetching SMS replies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/sms-replies - Mark replies as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { replyIds, markAllRead, phone } = body;

    if (markAllRead) {
      // Mark all as read
      if (phone) {
        await query(
          `UPDATE sms_replies SET is_read = true, read_at = NOW() WHERE from_number = $1 AND is_read = false`,
          [phone]
        );
      } else {
        await query(`UPDATE sms_replies SET is_read = true, read_at = NOW() WHERE is_read = false`);
      }
    } else if (replyIds && replyIds.length > 0) {
      // Mark specific replies as read
      await query(`UPDATE sms_replies SET is_read = true, read_at = NOW() WHERE id = ANY($1)`, [
        replyIds,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating SMS replies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
