-- Add enabled flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE users SET enabled = TRUE WHERE enabled IS NULL;
