import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * DELETE /api/zitadel/passkeys/[tokenId]
 *
 * Removes a specific passkey for the current user
 * Uses the user's access token to call ZITADEL Auth API
 */
export async function DELETE(request: NextRequest, { params }: { params: { tokenId: string } }) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issuer = process.env.AUTH_ZITADEL_ISSUER;
    if (!issuer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { tokenId } = params;

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    // Call ZITADEL Auth API to delete the passkey
    const response = await fetch(`${issuer}/auth/v1/users/me/passwordless/${tokenId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZITADEL API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to delete passkey', details: errorText },
        { status: response.status }
      );
    }

    // Successfully deleted
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting passkey:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
