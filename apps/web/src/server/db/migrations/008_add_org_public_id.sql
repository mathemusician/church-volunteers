-- Add public_id to organizations for URL routing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_id VARCHAR(12) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_organizations_public_id ON organizations(public_id);

-- Generate public_id for existing organizations (random 12-char alphanumeric)
-- You'll need to run this manually or generate them in the app on first access
UPDATE organizations 
SET public_id = LOWER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 12))
WHERE public_id IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE organizations ALTER COLUMN public_id SET NOT NULL;
