import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * POST /api/zitadel/passkeys/list
 *
 * Lists all passkeys for the current user
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

    // Call ZITADEL Auth API to search for user's passkeys
    const response = await fetch(`${issuer}/auth/v1/users/me/passwordless/_search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Empty query to get all passkeys
        queries: [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZITADEL API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to list passkeys', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the list of passkeys
    return NextResponse.json({
      result: data.result || [],
      details: data.details,
    });
  } catch (error) {
    console.error('Error listing passkeys:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
