import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, markMagicLinkAsUsed } from '@/lib/magicLink';
import { getInviteByToken, acceptInvite } from '@/lib/invites';

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    // Verify the magic link token
    const magicLink = await verifyMagicLinkToken(token);

    if (!magicLink) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    // Mark token as used
    await markMagicLinkAsUsed(token);

    // If this magic link was for an invite, auto-accept it
    if (magicLink.invite_token) {
      const invite = await getInviteByToken(magicLink.invite_token);

      if (invite) {
        // Accept the invitation
        await acceptInvite(magicLink.invite_token);

        // Redirect to invite accepted page with organization info
        return NextResponse.redirect(
          new URL(
            `/invites/accepted?org=${encodeURIComponent(invite.organization_name)}&email=${encodeURIComponent(magicLink.email)}`,
            request.url
          )
        );
      }
    }

    // If no invite, just redirect to sign-in
    return NextResponse.redirect(new URL('/signin', request.url));
  } catch (error) {
    console.error('Error processing magic link:', error);
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url));
  }
}
