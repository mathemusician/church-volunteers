-- Add auto_extend field for recurring events
ALTER TABLE volunteer_events ADD COLUMN auto_extend BOOLEAN DEFAULT false;

-- Index for finding auto-extend events
CREATE INDEX IF NOT EXISTS idx_volunteer_events_auto_extend ON volunteer_events(auto_extend, event_date);
