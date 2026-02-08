-- Add last_used_at column to saved_meals table for tracking recent usage
-- This enables sorting saved meals by recency in the Load Meal dialog

ALTER TABLE saved_meals
ADD COLUMN last_used_at TIMESTAMPTZ;

-- Create index for efficient sorting by last used date
CREATE INDEX idx_saved_meals_last_used
ON saved_meals(user_id, last_used_at DESC NULLS LAST);

-- Add comment for documentation
COMMENT ON COLUMN saved_meals.last_used_at IS 'Timestamp when this saved meal was last loaded into a daily log';
