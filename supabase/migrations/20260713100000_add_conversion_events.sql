-- =========================================================
-- Konverteringsevents (Fas 5) — funnel-mätning för premium:
-- paywall_shown → checkout_started → checkout_success/cancelled.
-- Trial/betald-status finns redan i user_subscriptions (webhook);
-- den här tabellen ger stegen FÖRE betalningen.
-- Skrivs fire-and-forget från klienten; läses endast via SQL/admin.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.conversion_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event      text        NOT NULL CHECK (event IN (
                'paywall_shown', 'checkout_started', 'checkout_success', 'checkout_cancelled')),
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_event_created
  ON public.conversion_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user
  ON public.conversion_events (user_id, created_at DESC);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- Användare får bara skriva sina egna events. Ingen SELECT-policy:
-- funnel-analys görs som service role/superadmin i SQL Editor.
CREATE POLICY "Users can insert own conversion events"
  ON public.conversion_events FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.conversion_events IS
  'Premium-funnel: paywall_shown/checkout_started/checkout_success/checkout_cancelled. Klienten skriver, endast admin läser.';
