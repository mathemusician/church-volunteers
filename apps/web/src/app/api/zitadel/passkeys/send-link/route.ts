import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getServiceUserToken, getCurrentUserId } from '@/lib/zitadelService';

/**
 * POST /api/zitadel/passkeys/send-link
 *
 * Sends a passkey registration link to the user's email
 * Uses Management API with service user token
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

    // Get the user's ID from their access token
    const userId = await getCurrentUserId(session.accessToken);

    // Get service user token for Management API
    const serviceToken = await getServiceUserToken();

    // Call ZITADEL Management API to send passkey link
    const response = await fetch(`${issuer}/management/v1/users/${userId}/passwordless/_send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZITADEL Management API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to send passkey link', details: errorText },
        { status: response.status }
      );
    }

    // Successfully sent
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending passkey link:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
