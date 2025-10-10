import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken, acceptInvite, declineInvite } from '@/lib/invites';
import { auth } from '@/auth';

// GET - Get invite details (no auth required - anyone with the link can view)
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    const invite = await getInviteByToken(token);

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    return NextResponse.json({
      organization: {
        name: invite.organization_name,
        description: invite.organization_description,
      },
      role: invite.role,
      invitedBy: invite.invited_by,
      invitedAt: invite.invited_at,
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Accept or decline invite
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Must be signed in' }, { status: 401 });
    }

    const { token } = params;
    const { action } = await request.json();

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept or decline' }, { status: 400 });
    }

    // Get invite to verify email matches
    const invite = await getInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
    }

    if (invite.user_email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      const member = await acceptInvite(token);
      if (!member) {
        return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Invite accepted successfully',
        organizationId: member.organization_id,
      });
    } else {
      await declineInvite(token);
      return NextResponse.json({ message: 'Invite declined' });
    }
  } catch (error) {
    console.error('Error processing invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
