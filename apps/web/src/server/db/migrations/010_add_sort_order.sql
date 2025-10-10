-- Add sort_order column to volunteer_events for manual reordering
ALTER TABLE volunteer_events ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_volunteer_events_sort_order ON volunteer_events(sort_order);
