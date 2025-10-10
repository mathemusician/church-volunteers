-- Add password field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add flag to track if password is set
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT FALSE;

-- Update existing users who use OAuth to have has_password = NULL (they don't need passwords)
UPDATE users SET has_password = NULL WHERE password_hash IS NULL;

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password for email/password authentication';
COMMENT ON COLUMN users.has_password IS 'TRUE if user has set a password, NULL if OAuth-only user';
