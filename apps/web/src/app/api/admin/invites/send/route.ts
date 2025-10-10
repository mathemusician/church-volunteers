import { NextRequest, NextResponse } from 'next/server';
import { getCurrentOrgContext, hasPermission } from '@/lib/orgContext';
import { createInvite } from '@/lib/invites';
import { generateInviteUrl } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const orgContext = await getCurrentOrgContext();
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    // Check if user has permission to invite (owner or admin)
    if (!hasPermission(orgContext.userRole, 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can send invites' },
        { status: 403 }
      );
    }

    const { email, role, name } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Role must be admin or member' }, { status: 400 });
    }

    // Create invite (stores in organization_members with status="pending")
    const invite = await createInvite(
      orgContext.organizationId,
      email,
      role,
      orgContext.userEmail,
      name
    );

    // Generate sign-in URL for manual sharing
    // (Email will be handled by ZITADEL Management API in the future)
    const signInUrl = generateInviteUrl(invite.invite_token!);

    return NextResponse.json(
      {
        message: 'Invitation created successfully',
        invite: {
          email: invite.user_email,
          role: invite.role,
          signInUrl, // Return URL for admin to share manually
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
