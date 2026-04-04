-- Add optional body fat percentage to per-entry weight tracking.
-- This is independent of profiles.body_fat_percentage (the profile-level field).
ALTER TABLE public.weight_history
  ADD COLUMN IF NOT EXISTS body_fat_percentage NUMERIC(5,2)
    CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0 AND body_fat_percentage <= 100));
