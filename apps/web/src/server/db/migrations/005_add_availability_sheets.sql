-- Create availability sheets system (separate from scheduled events)

-- Main availability sheet (e.g., "Wednesday Pickleball")
CREATE TABLE availability_sheets (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  min_players INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Days of the week for each sheet (0=Sunday, 1=Monday, ..., 6=Saturday)
CREATE TABLE availability_days (
  id SERIAL PRIMARY KEY,
  sheet_id INTEGER NOT NULL REFERENCES availability_sheets(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  position INTEGER DEFAULT 0,
  UNIQUE(sheet_id, day_of_week)
);

-- People's availability (reuse the concept, but new relation)
CREATE TABLE availability_signups (
  id SERIAL PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES availability_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_availability_sheets_org ON availability_sheets(organization_id);
CREATE INDEX idx_availability_days_sheet ON availability_days(sheet_id);
CREATE INDEX idx_availability_signups_day ON availability_signups(day_id);

-- Comments for documentation
COMMENT ON TABLE availability_sheets IS 'Weekly availability sheets for recurring activities (e.g., pickleball, coffee meetups)';
COMMENT ON TABLE availability_days IS 'Days of the week for each availability sheet (0=Sun through 6=Sat)';
COMMENT ON TABLE availability_signups IS 'People who are available on specific days';
