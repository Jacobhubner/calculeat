-- handle_new_user: sätter nu username atomiskt vid signup
-- username normaliseras från profile_name via normalize_username()
-- Reserverade ord får suffix _user; konflikter hanteras med auto-suffix
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile_id    uuid;
  v_profile_name  text;
  v_username_base text;
  v_username      text;
BEGIN
  v_profile_name  := COALESCE(NEW.raw_user_meta_data->>'profile_name', 'Användare');
  v_username_base := public.normalize_username(v_profile_name);

  IF length(v_username_base) < 2 THEN
    v_username_base := 'user_' || substr(NEW.id::text, 1, 6);
  END IF;

  IF v_username_base = ANY(ARRAY['admin','support','calculeat','help','api',
                                  'system','null','undefined','root','mod','moderator']) THEN
    v_username_base := v_username_base || '_user';
  END IF;

  v_username := public.find_available_username(v_username_base);

  INSERT INTO public.user_profiles (id, email, profile_name, username)
  VALUES (NEW.id, NEW.email, v_profile_name, v_username);

  INSERT INTO public.profiles (user_id, profile_name, is_active)
  VALUES (NEW.id, v_profile_name, true)
  RETURNING id INTO v_profile_id;

  UPDATE public.user_profiles
  SET active_profile_id = v_profile_id
  WHERE id = NEW.id;

  RETURN NEW;

EXCEPTION WHEN others THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RAISE;
END;
$$;
