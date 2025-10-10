-- Volunteer Lists (Events/Categories)
CREATE TABLE IF NOT EXISTS volunteer_events (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer Lists within an Event
CREATE TABLE IF NOT EXISTS volunteer_lists (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES volunteer_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  max_slots INTEGER,
  is_locked BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual Signups
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES volunteer_lists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Volunteer Profiles (Private info visible to admins only)
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  availability TEXT,
  skills TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_lists_event ON volunteer_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_list ON volunteer_signups(list_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_name ON volunteer_profiles(name);
