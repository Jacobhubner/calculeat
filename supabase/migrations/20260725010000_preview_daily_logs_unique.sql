-- Buggfix preview-sandlådan ("Testa som ny användare"): daily_logs-unikhet.
--
-- daily_logs hade UNIQUE (user_id, log_date) UTAN is_preview. En preview-
-- användare som redan har en RIKTIG logg för samma datum kunde därför inte
-- skapa sin preview-logg → 409 Conflict i useEnsureTodayLog. useTodayLog fann
-- ingen preview-logg (returnerade null), så TodayPage-effekten försökte skapa
-- loggen om och om igen → oändlig loop av 409 (POST) + 406 (GET) i konsolen.
--
-- Fix: gör unikheten preview-medveten så preview- och riktiga loggar för samma
-- datum kan samexistera (samma mönster som food_items-indexen i steg 3,
-- migration 20260725000000).
--
-- Övriga preview-taggade tabeller kontrollerade: meal_entries
-- (daily_log_id, meal_order) är redan preview-scopad via parent daily_log;
-- weight_history och calibration_history har bara PK. Endast daily_logs berörs.

ALTER TABLE public.daily_logs
  DROP CONSTRAINT IF EXISTS daily_logs_user_id_log_date_key;

CREATE UNIQUE INDEX daily_logs_user_id_log_date_key
  ON public.daily_logs USING btree (user_id, log_date, is_preview);
