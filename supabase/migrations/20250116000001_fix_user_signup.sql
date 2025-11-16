-- Fix user signup to create initial profile
-- Migration created: 2025-01-16
-- Purpose: Fix the handle_new_user function to properly create an initial profile when a new user signs up

-- Step 1: Drop the existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Recreate handle_new_user function with profile creation logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_profile_name TEXT;
BEGIN
  -- Get profile name from metadata or use default
  v_profile_name := COALESCE(NEW.raw_user_meta_data->>'profile_name', 'Min Profil');

  -- Insert into user_profiles first (without active_profile_id)
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Create initial profile in profiles table
  INSERT INTO public.profiles (user_id, profile_name, is_active)
  VALUES (NEW.id, v_profile_name, true)
  RETURNING id INTO v_profile_id;

  -- Update user_profiles with active profile reference
  UPDATE public.user_profiles
  SET active_profile_id = v_profile_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix existing users who don't have profiles
-- Create a default profile for any user_profiles without an active_profile_id
DO $$
DECLARE
  v_user RECORD;
  v_profile_id UUID;
BEGIN
  FOR v_user IN
    SELECT id, email, profile_name
    FROM public.user_profiles
    WHERE active_profile_id IS NULL
  LOOP
    -- Create profile for this user
    INSERT INTO public.profiles (user_id, profile_name, is_active)
    VALUES (v_user.id, COALESCE(v_user.profile_name, 'Min Profil'), true)
    RETURNING id INTO v_profile_id;

    -- Update user_profiles with the new profile reference
    UPDATE public.user_profiles
    SET active_profile_id = v_profile_id
    WHERE id = v_user.id;
  END LOOP;
END $$;

-- Step 5: Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates user_profiles entry and initial profile when a new user signs up';
