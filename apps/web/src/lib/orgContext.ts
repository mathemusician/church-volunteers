import { auth } from '@/auth';
import { getUserOrganizations } from './models/organization';
import { getMemberRole } from './models/organizationMember';
import type { MemberRole } from './models/organizationMember';

export interface OrgContext {
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  organizationPublicId: string;
  userRole: MemberRole;
  userEmail: string;
}

/**
 * Get the current user's organization context
 * Returns the first active organization for now (Phase 1)
 * Later we'll support multiple orgs with switching (Phase 3)
 */
export async function getCurrentOrgContext(): Promise<OrgContext | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const userEmail = session.user.email;

  // Get user's organizations
  const orgs = await getUserOrganizations(userEmail);

  if (orgs.length === 0) {
    return null;
  }

  // For now, use the first org (Phase 1)
  // In Phase 3, we'll check session for selected org
  const org = orgs[0];
  const role = await getMemberRole(org.id, userEmail);

  if (!role) {
    return null;
  }

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizationSlug: org.slug,
    organizationPublicId: org.public_id,
    userRole: role,
    userEmail,
  };
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(role: MemberRole, requiredRole: MemberRole): boolean {
  const roleHierarchy: Record<MemberRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}

/**
 * Require organization context, throw if not found
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const context = await getCurrentOrgContext();

  if (!context) {
    throw new Error('No organization context found');
  }

  return context;
}
