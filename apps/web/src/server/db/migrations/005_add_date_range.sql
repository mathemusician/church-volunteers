-- Add begin_date and end_date for recurring templates
ALTER TABLE volunteer_events ADD COLUMN begin_date DATE;
ALTER TABLE volunteer_events ADD COLUMN end_date DATE;
