import crypto from 'crypto';
import { query } from '@/lib/db';

export function generateMagicLinkToken(): string {
  // Generate a secure random token (32 bytes = 64 hex chars)
  return crypto.randomBytes(32).toString('hex');
}

export function getMagicLinkExpiration(): Date {
  // Tokens expire in 15 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  return expiresAt;
}

export async function createMagicLinkToken(email: string, inviteToken?: string): Promise<string> {
  const token = generateMagicLinkToken();
  const expiresAt = getMagicLinkExpiration();

  await query(
    `INSERT INTO magic_link_tokens (email, token, expires_at, invite_token)
    VALUES ($1, $2, $3, $4)`,
    [email.toLowerCase(), token, expiresAt, inviteToken || null]
  );

  return token;
}

export async function verifyMagicLinkToken(token: string) {
  const result = await query(
    `SELECT * FROM magic_link_tokens 
    WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    return null; // Invalid or expired
  }

  return result.rows[0];
}

export async function markMagicLinkAsUsed(token: string) {
  await query(
    `UPDATE magic_link_tokens 
    SET used = TRUE, used_at = NOW() 
    WHERE token = $1`,
    [token]
  );
}

export async function cleanupExpiredTokens() {
  // Delete tokens older than 7 days
  await query(
    `DELETE FROM magic_link_tokens 
    WHERE created_at < NOW() - INTERVAL '7 days'`
  );
}
