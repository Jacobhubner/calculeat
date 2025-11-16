-- Fix handle_new_user function to use correct column name
-- Migration created: 2025-01-16
-- Purpose: Fix critical bug where function tried to insert into non-existent 'full_name' column
-- The correct column name is 'profile_name' in the user_profiles table

-- Drop and recreate the handle_new_user function with correct column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_profile_name TEXT;
BEGIN
  -- Get profile name from metadata or use default
  v_profile_name := COALESCE(NEW.raw_user_meta_data->>'profile_name', 'Min Profil');

  -- Insert into user_profiles first (without active_profile_id)
  -- FIXED: Changed from full_name to profile_name (correct column name)
  INSERT INTO public.user_profiles (id, email, profile_name)
  VALUES (NEW.id, NEW.email, v_profile_name);

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

-- Update comment to reflect the fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that creates user_profiles entry and initial profile when a new user signs up - FIXED to use profile_name instead of full_name';
