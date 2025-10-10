-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members with roles
CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member
  invited_by VARCHAR(255),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, inactive
  UNIQUE(organization_id, user_email)
);

-- Add organization_id to existing tables
ALTER TABLE volunteer_events ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_email ON organization_members(user_email);
CREATE INDEX IF NOT EXISTS idx_volunteer_events_org ON volunteer_events(organization_id);

-- For existing data, we'll need to create a default organization and assign all events to it
-- This will be handled in the application code during first run
