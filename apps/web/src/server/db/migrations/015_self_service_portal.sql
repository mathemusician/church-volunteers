-- Self-Service Portal Migration
-- Migration: 015_self_service_portal.sql

-- 1. Add coordinator contact fields to reminder_settings
ALTER TABLE reminder_settings 
ADD COLUMN IF NOT EXISTS coordinator_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS coordinator_phone VARCHAR(20);

-- 2. Volunteer tokens for magic link authentication
CREATE TABLE IF NOT EXISTS volunteer_tokens (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP,
  
  CONSTRAINT volunteer_tokens_phone_org_unique UNIQUE(phone, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_tokens_token ON volunteer_tokens(token);
CREATE INDEX IF NOT EXISTS idx_volunteer_tokens_phone ON volunteer_tokens(phone);
CREATE INDEX IF NOT EXISTS idx_volunteer_tokens_expires ON volunteer_tokens(expires_at);

-- 3. Add cancellation tracking to signups
ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 4. Update default message template to include self-service URL placeholder
UPDATE reminder_settings 
SET message_template = 'Hi {name}, reminder: You''re signed up for {role} at {event} on {date}. Can''t make it? {self_service_url} Questions? Text {coordinator_name} at {coordinator_phone}. Reply STOP to unsubscribe.'
WHERE message_template = 'Hi {name}, reminder: You''re signed up for {role} at {event} on {date}. Questions? Contact your coordinator.';
