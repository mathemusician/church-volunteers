// Email functionality removed - invites are sent manually via link sharing
// In the future, ZITADEL's Management API will handle email invitations

export function generateInviteUrl(inviteToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/${inviteToken}`;
}
