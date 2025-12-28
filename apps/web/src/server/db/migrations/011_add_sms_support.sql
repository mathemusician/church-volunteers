-- Add SMS support to volunteer signups
-- Migration: 011_add_sms_support.sql

-- Add phone and consent fields to volunteer_signups
ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_consented_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sms_opted_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opted_out_at TIMESTAMP;

-- SMS message log for tracking and debugging
CREATE TABLE IF NOT EXISTS sms_messages (
  id SERIAL PRIMARY KEY,
  text_id VARCHAR(50),                    -- Textbelt's message ID for status tracking
  to_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',   -- pending, sent, delivered, failed
  error_message TEXT,
  signup_id INTEGER REFERENCES volunteer_signups(id) ON DELETE SET NULL,
  event_id INTEGER REFERENCES volunteer_events(id) ON DELETE SET NULL,
  message_type VARCHAR(30) DEFAULT 'confirmation',  -- confirmation, reminder, cancellation, change
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_phone ON volunteer_signups(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to_phone ON sms_messages(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_signup ON sms_messages(signup_id) WHERE signup_id IS NOT NULL;
