-- Add profile_id column to daily_logs table to link logs to specific profiles
-- This allows users to have different profiles with different goals

-- Step 1: Add the column as nullable first
ALTER TABLE daily_logs
ADD COLUMN profile_id UUID;

-- Step 2: Migrate existing data - set profile_id to user's first/active profile
-- For existing logs, we'll use the user's first profile (oldest created)
UPDATE daily_logs dl
SET profile_id = (
  SELECT p.id
  FROM profiles p
  WHERE p.user_id = dl.user_id
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE profile_id IS NULL;

-- Step 3: Make the column NOT NULL now that we have data
ALTER TABLE daily_logs
ALTER COLUMN profile_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE daily_logs
ADD CONSTRAINT daily_logs_profile_id_fkey
FOREIGN KEY (profile_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Step 5: Add composite index for efficient querying by user and profile
CREATE INDEX IF NOT EXISTS daily_logs_user_profile_date_idx
ON daily_logs(user_id, profile_id, log_date DESC);

-- Step 6: Drop old index and create new one that includes profile_id
DROP INDEX IF EXISTS daily_logs_user_date_idx;
CREATE UNIQUE INDEX daily_logs_user_profile_date_key
ON daily_logs(user_id, profile_id, log_date);

-- Note: This allows users to have one log per profile per day
-- If they switch profiles mid-day, they can have multiple logs per day (one per profile)
