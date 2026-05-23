-- Fix handle_new_user: remove full_name reference (column does not exist)
-- Root cause: function was reverted to an old version that referenced full_name
-- Restored full logic from 20250116000002 migration

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_profile_name TEXT;
BEGIN
  v_profile_name := COALESCE(NEW.raw_user_meta_data->>'profile_name', 'Min Profil');

  INSERT INTO public.user_profiles (id, email, profile_name)
  VALUES (NEW.id, NEW.email, v_profile_name);

  INSERT INTO public.profiles (user_id, profile_name, is_active)
  VALUES (NEW.id, v_profile_name, true)
  RETURNING id INTO v_profile_id;

  UPDATE public.user_profiles
  SET active_profile_id = v_profile_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
