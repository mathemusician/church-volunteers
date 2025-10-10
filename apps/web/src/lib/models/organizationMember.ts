import { query } from '@/lib/db';

export type MemberRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'pending' | 'active' | 'inactive';

export interface OrganizationMember {
  id: number;
  organization_id: number;
  user_email: string;
  user_name: string | null;
  role: MemberRole;
  invited_by: string | null;
  invited_at: Date;
  joined_at: Date | null;
  status: MemberStatus;
}

export async function addMember(
  organizationId: number,
  userEmail: string,
  role: MemberRole = 'member',
  userName?: string,
  invitedBy?: string,
  status: MemberStatus = 'active'
): Promise<OrganizationMember> {
  const result = await query(
    `INSERT INTO organization_members 
      (organization_id, user_email, user_name, role, invited_by, status, joined_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      organizationId,
      userEmail,
      userName || null,
      role,
      invitedBy || null,
      status,
      status === 'active' ? new Date() : null,
    ]
  );
  return result.rows[0];
}

export async function getMemberRole(
  organizationId: number,
  userEmail: string
): Promise<MemberRole | null> {
  const result = await query(
    `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_email = $2 AND status = 'active'`,
    [organizationId, userEmail]
  );
  return result.rows[0]?.role || null;
}

export async function isMember(organizationId: number, userEmail: string): Promise<boolean> {
  const result = await query(
    `SELECT id FROM organization_members
     WHERE organization_id = $1 AND user_email = $2 AND status = 'active'`,
    [organizationId, userEmail]
  );
  return result.rows.length > 0;
}

export async function getOrgMembers(organizationId: number): Promise<OrganizationMember[]> {
  const result = await query(
    `SELECT * FROM organization_members
     WHERE organization_id = $1
     ORDER BY 
       CASE role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'member' THEN 3
       END,
       joined_at DESC`,
    [organizationId]
  );
  return result.rows;
}

export async function updateMemberRole(
  organizationId: number,
  userEmail: string,
  newRole: MemberRole
): Promise<OrganizationMember> {
  const result = await query(
    `UPDATE organization_members
     SET role = $3
     WHERE organization_id = $1 AND user_email = $2
     RETURNING *`,
    [organizationId, userEmail, newRole]
  );
  return result.rows[0];
}

export async function removeMember(organizationId: number, userEmail: string): Promise<void> {
  await query('DELETE FROM organization_members WHERE organization_id = $1 AND user_email = $2', [
    organizationId,
    userEmail,
  ]);
}

export async function hasOwner(organizationId: number): Promise<boolean> {
  const result = await query(
    `SELECT id FROM organization_members
     WHERE organization_id = $1 AND role = 'owner' AND status = 'active'`,
    [organizationId]
  );
  return result.rows.length > 0;
}
