-- Add confirmation tracking columns to volunteer_signups
-- Migration: 016_add_confirmation_columns.sql

ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS confirmed_via VARCHAR(20); -- 'sms', 'web', 'manual'

CREATE INDEX IF NOT EXISTS idx_volunteer_signups_confirmed ON volunteer_signups(confirmed_at) WHERE confirmed_at IS NOT NULL;
