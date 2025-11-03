-- Add week-specific instances for availability sheets
-- This allows tracking who's playing specific weeks while maintaining standing availability

CREATE TABLE availability_week_signups (
  id SERIAL PRIMARY KEY,
  sheet_id INTEGER NOT NULL REFERENCES availability_sheets(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sheet_id, week_start_date, day_of_week, name)
);

-- Index for fast week queries
CREATE INDEX idx_week_signups_sheet_week ON availability_week_signups(sheet_id, week_start_date);
CREATE INDEX idx_week_signups_day ON availability_week_signups(day_of_week);

COMMENT ON TABLE availability_week_signups IS 'Week-specific signups that override standing availability';
COMMENT ON COLUMN availability_week_signups.week_start_date IS 'Monday of the week (ISO 8601 week start)';
