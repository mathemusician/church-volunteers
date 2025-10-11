import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * POST /api/zitadel/passkeys/create-link
 *
 * Generates a passkey registration link for the current user
 * Uses the user's access token to call ZITADEL Auth API
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const issuer = process.env.AUTH_ZITADEL_ISSUER;
    if (!issuer) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Call ZITADEL Auth API to create passkey registration link
    const response = await fetch(`${issuer}/auth/v1/users/me/passwordless/_link`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZITADEL API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create passkey link', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the link to the client
    return NextResponse.json({
      link: data.link || data.url,
      expiresIn: data.expiresIn || data.expires_in,
    });
  } catch (error) {
    console.error('Error creating passkey link:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
