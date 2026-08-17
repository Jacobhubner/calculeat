-- Backfillen gissade 'payment_started' för varje Stripe-rad som inte var
-- 'trialing' vid avläsningen. För en prenumeration som redan hunnit sägas
-- upp blir den gissningen fel: statusen är då 'canceled', och provperioden
-- syns inte längre i raden.
--
-- jacob2: skapad 2026-08-04, period slut 2026-08-11 — exakt 7 dagar, vilket
-- är provperiodens längd (TRIAL_DAYS). Prenumerationen avslutades utan att
-- förnyas, alltså ingen debitering. Samma mönster som ninniphu, som rättades
-- i 20260817... efter kontroll mot en 0,00 kr-faktura i Stripe.
--
-- Konsekvensen av felet: panelen visade "Har betalat" för ett konto som
-- aldrig betalat. För ett testkonto är det harmlöst, men samma gissning
-- skulle märka en riktig kund fel — och underlaget används för att bedöma
-- om någon ska få gratis premium.
UPDATE public.subscription_events e
SET event_type = 'trial_started',
    reason = 'Rättad 2026-08-17: backfillen gissade betalning, men perioden '
             || 'var exakt 7 dagar (2026-08-04 till 2026-08-11) — alltså '
             || 'provperiod som avslutades utan debitering. Tidsstämpeln är '
             || 'ungefärlig.'
FROM public.user_profiles up
WHERE up.id = e.user_id
  AND up.username = 'jacob2'
  AND e.event_type = 'payment_started'
  AND e.source = 'stripe';
