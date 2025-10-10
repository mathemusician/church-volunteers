-- Enable Row Level Security
ALTER DATABASE church_volunteers SET row_security = on;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  keycloak_id VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'volunteer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  availability JSONB,
  skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create volunteer_assignments table
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, volunteer_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (true);

CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for volunteers table
CREATE POLICY volunteers_select_policy ON volunteers
  FOR SELECT
  USING (true);

CREATE POLICY volunteers_insert_policy ON volunteers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY volunteers_update_policy ON volunteers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for events table
CREATE POLICY events_select_policy ON events
  FOR SELECT
  USING (true);

CREATE POLICY events_insert_policy ON events
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY events_update_policy ON events
  FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for volunteer_assignments table
CREATE POLICY assignments_select_policy ON volunteer_assignments
  FOR SELECT
  USING (true);

CREATE POLICY assignments_insert_policy ON volunteer_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM volunteers v
      WHERE v.id = volunteer_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY assignments_update_policy ON volunteer_assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      WHERE v.id = volunteer_id AND v.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_assignments_event_id ON volunteer_assignments(event_id);
CREATE INDEX idx_assignments_volunteer_id ON volunteer_assignments(volunteer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
