import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/lib/invites';
import { auth } from '@/auth';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
    }

    const { token } = await params;

    // Get invite details
    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    // Check if user is already a member of this organization
    const existingMember = await query(
      `SELECT id, status FROM organization_members 
       WHERE organization_id = $1 AND user_email = $2`,
      [invite.organization_id, session.user.email.toLowerCase()]
    );

    if (existingMember.rows.length > 0) {
      const member = existingMember.rows[0];
      if (member.status === 'active') {
        // Already a member, just invalidate the invite token and redirect
        await query(
          `UPDATE organization_members 
           SET invite_token = NULL, token_expires_at = NULL
           WHERE id = $1`,
          [invite.id]
        );
        return NextResponse.json({
          message: 'You are already a member of this organization',
          organizationId: invite.organization_id,
        });
      }
    }

    // Accept the invite - update the invite record with the actual user's email
    // This allows anyone with the link to join (not just the original email)
    const result = await query(
      `UPDATE organization_members 
       SET status = 'active', 
           user_email = $1,
           user_name = COALESCE($2, user_name),
           joined_at = NOW(),
           invite_token = NULL,
           token_expires_at = NULL
       WHERE id = $3
       RETURNING *`,
      [session.user.email.toLowerCase(), session.user.name, invite.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Invite accepted successfully',
      organizationId: invite.organization_id,
      organizationName: invite.organization_name,
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
