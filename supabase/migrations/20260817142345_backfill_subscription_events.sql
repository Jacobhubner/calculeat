-- Backfill från de rader som redan finns i user_subscriptions.
--
-- Vi vet inte exakt när prenumerationen STARTADE — bara när den senast
-- ändrades och när perioden slutade. Vi skapar därför en händelse per
-- befintlig rad, daterad till updated_at, och markerar den som backfill i
-- reason så ingen tror att tidsstämpeln är exakt.
INSERT INTO public.subscription_events (
  user_id, event_type, plan, source, period_end, reason, actor_id, created_at
)
SELECT
  s.user_id,
  CASE
    WHEN s.status = 'canceled' THEN 'canceled'
    WHEN s.status = 'trialing' THEN 'trial_started'
    WHEN s.source = 'manual'   THEN 'granted'
    ELSE 'payment_started'
  END,
  s.plan,
  s.source,
  s.current_period_end,
  'Backfill vid införandet av händelseloggen — tidsstämpeln är radens '
    || 'updated_at, inte den faktiska händelsen',
  NULL,
  s.updated_at
FROM public.user_subscriptions s
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_events e WHERE e.user_id = s.user_id
);
