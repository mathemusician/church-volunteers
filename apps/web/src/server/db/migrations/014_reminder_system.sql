-- Reminder System Migration
-- Migration: 014_reminder_system.sql

-- 1. Reminder Settings Table (organization and event level)
CREATE TABLE IF NOT EXISTS reminder_settings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES volunteer_events(id) ON DELETE CASCADE,
  
  -- Reminder schedule (JSONB for flexibility)
  -- Example: [{"type": "days_before", "value": 2, "time": "18:00"}, {"type": "hours_before", "value": 2}]
  schedule JSONB NOT NULL DEFAULT '[{"type": "days_before", "value": 1, "time": "18:00"}]',
  
  -- Message template with variable substitution
  message_template TEXT NOT NULL DEFAULT 'Hi {name}, reminder: You''re signed up for {role} at {event} on {date}. Questions? Contact your coordinator.',
  
  -- Settings
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Either org-level (event_id NULL) or event-level override
  UNIQUE(organization_id, event_id)
);

-- 2. SMS Replies Table (for two-way SMS)
CREATE TABLE IF NOT EXISTS sms_replies (
  id SERIAL PRIMARY KEY,
  
  -- Link to original SMS
  sms_message_id INTEGER REFERENCES sms_messages(id) ON DELETE SET NULL,
  text_id VARCHAR(100), -- Textbelt's original message ID
  
  -- Reply details
  from_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  
  -- Webhook data for linking back to signup
  webhook_data JSONB,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Auto-detected intent
  detected_intent VARCHAR(20), -- 'confirm', 'cancel', 'stop', 'help', 'other'
  
  -- Timestamps
  received_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_replies_unread ON sms_replies(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_sms_replies_from ON sms_replies(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_replies_received ON sms_replies(received_at DESC);

-- 3. Add last_reminder_sent_at to volunteer_signups for quick status lookup
ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- 4. Add reply_webhook_url to sms_messages for tracking which messages can receive replies
ALTER TABLE sms_messages
ADD COLUMN IF NOT EXISTS reply_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_data JSONB;

-- 5. Index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_sms_messages_reminder_lookup 
ON sms_messages(signup_id, message_type, created_at DESC) 
WHERE message_type = 'reminder';

-- 6. Index for reminder settings lookup
CREATE INDEX IF NOT EXISTS idx_reminder_settings_org ON reminder_settings(organization_id) WHERE event_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_reminder_settings_event ON reminder_settings(event_id) WHERE event_id IS NOT NULL;
