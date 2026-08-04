-- =========================================================
-- cancel_at_period_end på user_subscriptions
--
-- Problem: när en användare säger upp i Stripe Customer Portal fortsätter
-- Stripe rapportera status 'trialing'/'active' fram till periodens slut —
-- det enda som ändras är flaggan cancel_at_period_end. Appen saknade det
-- fältet och visade därför "Provperiod till och med X, säg upp innan dess"
-- till någon som REDAN sagt upp. Det inbjuder till dubbel uppsägning och
-- supportärenden av typen "gick min uppsägning igenom?".
--
-- Lösning: spegla flaggan. Skrivs enbart av stripe-webhooken (service role)
-- precis som resten av tabellen — inga nya RLS-policies behövs, användaren
-- läser den via den befintliga SELECT-policyn på egen rad.
--
-- Påverkar INTE get_user_plan: en uppsagd prenumeration är fortfarande
-- giltig perioden ut, vilket redan följer av status + current_period_end.
-- =========================================================

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_subscriptions.cancel_at_period_end IS
  'True när användaren sagt upp men perioden ännu inte löpt ut (speglar Stripes cancel_at_period_end). Åtkomsten består till current_period_end.';
