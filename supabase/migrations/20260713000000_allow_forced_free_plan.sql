-- =========================================================
-- Forcerad free-plan för testkonton (Fas 3)
--
-- Problem: under soft launch (premium_enforcement='off') behandlas
-- alla utan prenumerationsrad som founder — det gick inte att sätta
-- ett enskilt konto till 'free' för att testa gränserna.
--
-- Lösning: admin_set_user_plan accepterar nu
--   'free'    → upsert av en manuell rad med plan='free' (forcerad free,
--               vinner över enforcement-läget — get_user_plan returnerar
--               radens plan när den är giltig)
--   'default' → tar bort den manuella raden (kontot följer
--               enforcement-läget igen; tidigare betydelsen av 'free')
-- =========================================================

CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  p_user_id uuid,
  p_plan    text,
  p_note    text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_super_admin
  ) THEN
    RAISE EXCEPTION 'admin_set_user_plan: super admin required';
  END IF;

  IF p_plan NOT IN ('default', 'free', 'premium', 'founder') THEN
    RAISE EXCEPTION 'admin_set_user_plan: invalid plan %', p_plan;
  END IF;

  -- 'default' = ta bort manuell rad (användaren följer enforcement-läget).
  -- Rör aldrig Stripe-rader — de ägs av webhooken (Fas 4).
  IF p_plan = 'default' THEN
    DELETE FROM public.user_subscriptions
    WHERE user_id = p_user_id AND source = 'manual';
    RETURN;
  END IF;

  INSERT INTO public.user_subscriptions (user_id, plan, status, source, note)
  VALUES (p_user_id, p_plan, 'active', 'manual', p_note)
  ON CONFLICT (user_id) DO UPDATE
    SET plan = EXCLUDED.plan,
        status = 'active',
        note = COALESCE(EXCLUDED.note, user_subscriptions.note)
    WHERE user_subscriptions.source = 'manual';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_plan(uuid, text, text) FROM anon;
