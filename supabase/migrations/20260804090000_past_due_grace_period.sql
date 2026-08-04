-- =========================================================
-- past_due behåller åtkomst under Stripes retry-period
--
-- Problem: get_user_plan släppte bara igenom status IN ('active','trialing').
-- invoice.payment_failed sätter 'past_due', vilket innebar att en betalande
-- kund vars kort nekades tappade Premium OMEDELBART — trots att Stripe
-- fortsätter försöka dra pengarna i ~3 veckor och kunden mycket väl kan
-- betala dagen efter. Recept låstes och historiken kapades till 30 dagar
-- medan kunden fortfarande var på väg att betala.
--
-- Lösning: 'past_due' behandlas som giltig så länge current_period_end inte
-- passerats — perioden användaren redan betalat för är hens att använda.
-- När Stripe till slut ger upp skickas customer.subscription.deleted →
-- status='canceled' → åtkomsten stängs.
--
-- Oförändrat i övrigt: admin/founder-logiken, behörighetskontrollen
-- (is_support_admin) och fallbacken mot premium_enforcement.
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_sub    record;
BEGIN
  -- Får anropas för sig själv, av service role (auth.uid() null, t.ex.
  -- triggers under SECURITY DEFINER-RPCs eller seeds), eller av admin.
  IF v_caller IS NOT NULL AND v_caller <> p_user_id AND NOT public.is_support_admin() THEN
    RAISE EXCEPTION 'get_user_plan: not allowed for other users';
  END IF;

  IF p_user_id IS NULL THEN
    RETURN 'free';
  END IF;

  -- Admins och super admins är alltid founder
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = p_user_id) THEN
    RETURN 'founder';
  END IF;

  SELECT plan, status, current_period_end INTO v_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  -- active/trialing: giltig tills perioden löper ut (null = tills vidare,
  -- t.ex. manuella founder-rader).
  -- past_due: karens — Stripe försöker fortfarande dra betalningen, så
  -- användaren behåller åtkomsten perioden ut. Kräver ett satt
  -- current_period_end; null vore obegränsad karens och släpps därför inte.
  IF FOUND
     AND (
       (v_sub.status IN ('active', 'trialing')
         AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now()))
       OR
       (v_sub.status = 'past_due'
         AND v_sub.current_period_end IS NOT NULL
         AND v_sub.current_period_end > now())
     )
  THEN
    RETURN v_sub.plan;
  END IF;

  -- Ingen giltig prenumeration: soft launch = founder, hard launch = free
  IF (SELECT value FROM public.app_config WHERE key = 'premium_enforcement') = 'on' THEN
    RETURN 'free';
  END IF;

  RETURN 'founder';
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_plan(uuid) FROM anon;
