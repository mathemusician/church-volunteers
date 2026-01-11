-- Add QR token and email columns to volunteer_signups for check-in functionality
ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS qr_token VARCHAR(64);

ALTER TABLE volunteer_signups 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for QR token lookups
CREATE INDEX IF NOT EXISTS idx_volunteer_signups_qr_token 
ON volunteer_signups(qr_token);
