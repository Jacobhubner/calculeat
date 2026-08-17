-- Loggen ska bära de fakta som trial-spärren och kundåteranvändningen vilar
-- på, så de överlever att user_subscriptions-raden försvinner.
--
-- BAKGRUND: raden för en riktig kund raderades 2026-08-17. Eftersom både
-- hasUsedTrial och customer-återanvändningen lästes ur DEN raden skulle hon
-- ha fått en andra gratis provperiod och en dubblerad Stripe-kundpost.
-- subscription_events är append-only och kan inte tappas på samma sätt.
ALTER TABLE public.subscription_events
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

COMMENT ON COLUMN public.subscription_events.stripe_customer_id IS
  'Stripe-kunden vid händelsen. Låter checkout återanvända kunden även om '
  'user_subscriptions-raden gått förlorad.';

-- Uppslag per användare: senaste händelse med en kund, och om trial använts.
CREATE INDEX IF NOT EXISTS subscription_events_stripe_customer_idx
  ON public.subscription_events(user_id, created_at DESC)
  WHERE stripe_customer_id IS NOT NULL;

-- Fyll i historiskt från de rader som finns kvar
UPDATE public.subscription_events e
SET stripe_customer_id = s.stripe_customer_id
FROM public.user_subscriptions s
WHERE s.user_id = e.user_id
  AND e.source = 'stripe'
  AND e.stripe_customer_id IS NULL
  AND s.stripe_customer_id IS NOT NULL;
