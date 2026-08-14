-- =========================================================
-- MIGRATION: Flytta day_completion_mode och timezone till user_profiles
-- Datum: 2026-08-14
--
-- 20260814170000 och 20260814180000 la kolumnerna på public.profiles. Fel
-- tabell: profiles bär flerprofilsstödet (profile_name, is_active), medan
-- user_profiles är kanonisk källa för kontots inställningar och den enda
-- tabell useUpdateProfile skriver till ("canonical source (Fas 3)").
--
-- Följden i produktion: "Could not find the 'timezone' column of
-- 'user_profiles' in the schema cache" — varje sparning gav 400 Bad Request.
--
-- Kolumnerna läggs nu på rätt tabell. De felplacerade tas bort igen; de har
-- aldrig lästs eller skrivits av någon kod, så inget data går förlorat.
-- =========================================================

-- ── 1. Rätt tabell ───────────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS day_completion_mode text NOT NULL DEFAULT 'manual';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS chk_day_completion_mode;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT chk_day_completion_mode
  CHECK (day_completion_mode IN ('manual', 'auto')) NOT VALID;

ALTER TABLE public.user_profiles
  VALIDATE CONSTRAINT chk_day_completion_mode;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS chk_timezone_format;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT chk_timezone_format
  CHECK (
    timezone IS NULL
    OR timezone = 'UTC'
    -- Siffror och + i sista segmentet: vissa system rapporterar 'Etc/GMT+5'.
    OR timezone ~ '^[A-Za-z_]+/[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)?$'
  ) NOT VALID;

ALTER TABLE public.user_profiles
  VALIDATE CONSTRAINT chk_timezone_format;

COMMENT ON COLUMN public.user_profiles.day_completion_mode IS
  'Hur dagens logg avslutas: manual = användaren trycker "Avsluta dag", '
  'auto = öppna loggar från tidigare dagar stängs när appen öppnas nästa gång. '
  'Ingen server stänger loggar vid midnatt — städningen sker klientsidan.';

COMMENT ON COLUMN public.user_profiles.timezone IS
  'IANA-tidszon (t.ex. Europe/Stockholm) som användarens dygn räknas efter. '
  'NULL = inte fastställd, klienten använder då enhetens tidszon.';

-- ── 2. Städa bort de felplacerade kolumnerna ─────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_day_completion_mode;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_timezone_format;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS day_completion_mode;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS timezone;
