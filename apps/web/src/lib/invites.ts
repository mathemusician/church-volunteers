import crypto from 'crypto';
import { query } from '@/lib/db';

export function generateInviteToken(): string {
  // Generate a secure random token (32 bytes = 64 hex chars)
  return crypto.randomBytes(32).toString('hex');
}

export function getTokenExpiration(): Date {
  // Tokens expire in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

export async function createInvite(
  organizationId: number,
  email: string,
  role: 'admin' | 'member',
  invitedBy: string,
  userName?: string
) {
  const token = generateInviteToken();
  const expiresAt = getTokenExpiration();

  const result = await query(
    `INSERT INTO organization_members 
      (organization_id, user_email, user_name, role, invited_by, invited_at, status, invite_token, token_expires_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), 'pending', $6, $7)
    ON CONFLICT (organization_id, user_email) 
    DO UPDATE SET 
      invite_token = $6,
      token_expires_at = $7,
      status = 'pending',
      invited_at = NOW()
    RETURNING *`,
    [organizationId, email.toLowerCase(), userName, role, invitedBy, token, expiresAt]
  );

  return result.rows[0];
}

export async function getInviteByToken(token: string) {
  const result = await query(
    `SELECT om.*, o.name as organization_name, o.description as organization_description
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.invite_token = $1 AND om.status = 'pending'`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const invite = result.rows[0];

  // Check if expired
  if (invite.token_expires_at && new Date(invite.token_expires_at) < new Date()) {
    return null; // Expired
  }

  return invite;
}

export async function acceptInvite(token: string) {
  const result = await query(
    `UPDATE organization_members 
    SET status = 'active', 
        joined_at = NOW(),
        invite_token = NULL,
        token_expires_at = NULL
    WHERE invite_token = $1 AND status = 'pending' AND token_expires_at > NOW()
    RETURNING *`,
    [token]
  );

  return result.rows[0] || null;
}

export async function declineInvite(token: string) {
  const result = await query(
    `DELETE FROM organization_members 
    WHERE invite_token = $1 AND status = 'pending'
    RETURNING *`,
    [token]
  );

  return result.rows[0] || null;
}

export async function revokeInvite(organizationId: number, memberEmail: string) {
  const result = await query(
    `DELETE FROM organization_members 
    WHERE organization_id = $1 AND user_email = $2 AND status = 'pending'
    RETURNING *`,
    [organizationId, memberEmail.toLowerCase()]
  );

  return result.rows[0] || null;
}

export async function getOrganizationMembers(organizationId: number) {
  const result = await query(
    `SELECT * FROM organization_members 
    WHERE organization_id = $1 
    ORDER BY 
      CASE 
        WHEN role = 'owner' THEN 1
        WHEN role = 'admin' THEN 2
        ELSE 3
      END,
      joined_at ASC`,
    [organizationId]
  );

  return result.rows;
}
