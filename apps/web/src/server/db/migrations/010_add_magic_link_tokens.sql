-- Add magic link authentication tokens
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Optional: link to invite token if this is for accepting an invite
  invite_token VARCHAR(64)
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);

-- Clean up expired/used tokens older than 7 days
COMMENT ON TABLE magic_link_tokens IS 'Stores magic link tokens for passwordless authentication. Tokens expire after 15 minutes.';
