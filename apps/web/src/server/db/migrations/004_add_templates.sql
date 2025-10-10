-- Add template support to volunteer_events
ALTER TABLE volunteer_events ADD COLUMN is_template BOOLEAN DEFAULT false;
ALTER TABLE volunteer_events ADD COLUMN template_id INTEGER REFERENCES volunteer_events(id) ON DELETE SET NULL;

-- Index for finding templates and their instances
CREATE INDEX IF NOT EXISTS idx_volunteer_events_template ON volunteer_events(is_template);
CREATE INDEX IF NOT EXISTS idx_volunteer_events_template_id ON volunteer_events(template_id);

-- Update constraint: templates don't need a date, but instances do
-- (We'll handle this in the application logic)
