-- Add support for shareable invite links (not tied to specific email)
CREATE TABLE IF NOT EXISTS organization_invite_links (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  domain_restriction VARCHAR(255),
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_invite_links_token ON organization_invite_links(token);
CREATE INDEX IF NOT EXISTS idx_invite_links_org ON organization_invite_links(organization_id);
