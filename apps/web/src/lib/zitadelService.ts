/**
 * ZITADEL Service User Helper
 *
 * This module handles authentication for ZITADEL Management API calls
 * using client_credentials flow with a service user.
 */

interface ServiceTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Get a service user access token for Management API calls
 * Includes the reserved audience scope for ZITADEL APIs
 */
export async function getServiceUserToken(): Promise<string> {
  const issuer = process.env.AUTH_ZITADEL_ISSUER;
  const clientId = process.env.ZITADEL_SERVICE_CLIENT_ID;
  const clientSecret = process.env.ZITADEL_SERVICE_CLIENT_SECRET;

  if (!issuer || !clientId || !clientSecret) {
    throw new Error('Missing ZITADEL service user configuration');
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  // Request new token
  const tokenEndpoint = `${issuer}/oauth/v2/token`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid profile urn:zitadel:iam:org:project:id:zitadel:aud',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get service user token: ${response.status} ${errorText}`);
  }

  const data: ServiceTokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Get the authenticated user's ID from ZITADEL
 * Uses the user's access token to call /auth/v1/users/me
 */
export async function getCurrentUserId(userAccessToken: string): Promise<string> {
  const issuer = process.env.AUTH_ZITADEL_ISSUER;

  if (!issuer) {
    throw new Error('Missing ZITADEL issuer configuration');
  }

  const response = await fetch(`${issuer}/auth/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user info: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.user?.id || data.id;
}
