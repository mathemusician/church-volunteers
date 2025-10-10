-- Add invite token fields to organization_members
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_invite_token ON organization_members(invite_token);

-- Add expiration check: tokens expire after 7 days
COMMENT ON COLUMN organization_members.token_expires_at IS 'Invite token expires 7 days after creation';
