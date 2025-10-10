-- Add date field to volunteer_events
ALTER TABLE volunteer_events ADD COLUMN event_date DATE;

-- Add index for sorting by date
CREATE INDEX IF NOT EXISTS idx_volunteer_events_date ON volunteer_events(event_date);
