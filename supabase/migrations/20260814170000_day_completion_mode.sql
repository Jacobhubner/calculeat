-- =========================================================
-- MIGRATION: Flytta dagavslutningsläget från localStorage till profilen
-- Datum: 2026-08-14
--
-- OBS: la kolumnen på FEL TABELL (profiles i stället för user_profiles).
-- Rättat i 20260814190000, som även tar bort den felplacerade kolumnen.
--
-- Läget låg bara i localStorage under nyckeln 'day-completion-mode'. Det
-- innebar att valet inte följde med mellan enheter eller webbläsare, och
-- försvann när webbläsardata rensades — användare som valt 'auto' hamnade
-- tyst tillbaka på 'manual' utan att förstå varför.
--
-- 'manual' som default speglar den tidigare fallbacken i koden
-- (localStorage.getItem(...) || 'manual'), så befintligt beteende bevaras
-- för alla som inte aktivt valt något.
-- =========================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS day_completion_mode text NOT NULL DEFAULT 'manual';

-- NOT VALID + VALIDATE: undviker en lång ACCESS EXCLUSIVE-låsning på tabellen.
-- Alla befintliga rader har default-värdet, så valideringen kan inte misslyckas.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_day_completion_mode;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_day_completion_mode
  CHECK (day_completion_mode IN ('manual', 'auto')) NOT VALID;

ALTER TABLE public.profiles
  VALIDATE CONSTRAINT chk_day_completion_mode;

COMMENT ON COLUMN public.profiles.day_completion_mode IS
  'Hur dagens logg avslutas: manual = användaren trycker "Avsluta dag", '
  'auto = öppna loggar från tidigare dagar stängs när appen öppnas nästa gång. '
  'Ingen server stänger loggar vid midnatt — städningen sker klientsidan.';
