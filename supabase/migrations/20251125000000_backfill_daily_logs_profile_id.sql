-- Backfill profile_id for existing daily logs that have NULL profile_id
-- This migration assigns old logs to each user's currently active profile

-- Step 1: Backfill profile_id for logs with NULL profile_id
UPDATE daily_logs
SET profile_id = (
  SELECT p.id
  FROM profiles p
  WHERE p.user_id = daily_logs.user_id
  AND p.is_active = true
  LIMIT 1
)
WHERE profile_id IS NULL;

-- Step 2: Add NOT NULL constraint to profile_id column
-- This ensures all future logs must have a profile_id
ALTER TABLE daily_logs
ALTER COLUMN profile_id SET NOT NULL;

-- Step 3: Verify no NULL values remain (optional check)
-- If this fails, there are users without an active profile
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM daily_logs
  WHERE profile_id IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % daily logs with NULL profile_id after backfill', null_count;
  END IF;

  RAISE NOTICE 'Backfill completed successfully. All daily logs now have profile_id.';
END $$;
