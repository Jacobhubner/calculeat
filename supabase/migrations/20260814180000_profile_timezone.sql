-- =========================================================
-- MIGRATION: Spara användarens tidszon på profilen
-- Datum: 2026-08-14
--
-- OBS: la kolumnen på FEL TABELL (profiles i stället för user_profiles).
-- Rättat i 20260814190000, som även tar bort den felplacerade kolumnen.
--
-- Efter att datumberäkningen flyttats till lokal tid (localDateString) följer
-- appen redan enhetens tidszon automatiskt. Kolumnen behövs ändå för tre fall
-- där enhetens tidszon inte räcker:
--
--   1. Resa — telefonen ställer om och dagen bryts plötsligt efter destinationens
--      midnatt, mitt i en dag användaren redan loggat.
--   2. Flera enheter — jobbdator på UTC och telefon på Europe/Stockholm ger två
--      olika "idag" för samma konto.
--   3. Ett framtida serverjobb som stänger loggar vid midnatt kan inte fråga en
--      stängd webbläsare vilken tidszon användaren har.
--
-- NULL = ingen tidszon fastställd ännu; klienten faller då tillbaka på enhetens.
-- Värdet är en IANA-identifierare ('Europe/Stockholm'), inte en offset, så att
-- sommartid hanteras korrekt.
-- =========================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text;

-- Format-check, inte en lista över giltiga zoner: IANA-databasen uppdateras
-- löpande och en hårdkodad lista skulle bli fel över tid. Kravet är bara att
-- värdet ser ut som 'Region/Stad' (ev. 'Region/Stad/Underdel') eller 'UTC'.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_timezone_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_timezone_format
  CHECK (
    timezone IS NULL
    OR timezone = 'UTC'
    -- Siffror och + i sista segmentet: vissa system rapporterar 'Etc/GMT+5'.
    OR timezone ~ '^[A-Za-z_]+/[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)?$'
  ) NOT VALID;

ALTER TABLE public.profiles
  VALIDATE CONSTRAINT chk_timezone_format;

COMMENT ON COLUMN public.profiles.timezone IS
  'IANA-tidszon (t.ex. Europe/Stockholm) som användarens dygn räknas efter. '
  'NULL = inte fastställd, klienten använder då enhetens tidszon. '
  'Sätts automatiskt vid första besöket; ändras bara efter användarens samtycke.';
