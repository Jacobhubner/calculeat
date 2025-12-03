-- Add UPDATE policy for measurement_sets table
-- Migration created: 2025-12-03
-- Purpose: Allow users to update their own measurement sets (change date and measurements)

-- Step 1: Add UPDATE policy
CREATE POLICY "Users can update own measurement sets"
  ON public.measurement_sets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 2: Add comment for documentation
COMMENT ON POLICY "Users can update own measurement sets" ON public.measurement_sets IS
  'Allows users to update their own measurement sets, including changing the date and measurements';
