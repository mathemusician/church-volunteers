import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/lib/invites';
import { auth } from '@/auth';
import { getClient } from '@/lib/db';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const client = await getClient();

  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
    }

    const { token } = await params;
    const userEmail = session.user.email.toLowerCase();

    // Get invite details
    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    await client.query('BEGIN');

    // Use upsert to atomically add/update member (prevents TOCTOU race)
    const result = await client.query(
      `INSERT INTO organization_members 
        (organization_id, user_email, user_name, role, status, joined_at, invited_by)
       VALUES ($1, $2, $3, $4, 'active', NOW(), $5)
       ON CONFLICT (organization_id, user_email) 
       DO UPDATE SET 
         status = 'active',
         user_name = COALESCE(EXCLUDED.user_name, organization_members.user_name),
         joined_at = COALESCE(organization_members.joined_at, NOW())
       RETURNING *`,
      [invite.organization_id, userEmail, session.user.name, invite.role, invite.invited_by]
    );

    // Invalidate the invite token
    await client.query(
      `UPDATE organization_members 
       SET invite_token = NULL, token_expires_at = NULL
       WHERE id = $1`,
      [invite.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      message: 'Invite accepted successfully',
      organizationId: invite.organization_id,
      organizationName: invite.organization_name,
      isNewMember: result.rows[0]?.joined_at === null,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
