-- Nollställ beräkningsfält på profiler med manuellt angivet TDEE.
--
-- Manuellt TDEE har ingen bakomliggande formel. Ett kvarlämnat
-- activity_level + pal_system får useCalculations att räkna om TDEE ur
-- formeln trots att användaren angett värdet själv.
--
-- Verkligt fall 2026-08-16: "Sedentary" låg kvar på en profil med manuellt
-- TDEE 3190. BMR 1929 × 1,2 (Sedentary) = 2315 — 875 kcal fel. Resultatet
-- skrivs inte till profilen i dag (useCalculations-resultatet kastas i
-- TodayPage), men fälten ska spegla att ingen formel används.
--
-- Referensfallet 'david' hade redan NULL rakt igenom — det är det korrekta
-- tillståndet för tdee_source = 'manual'.
--
-- Rör INTE tdee, bmr eller vikt: de är användarens faktiska värden.
UPDATE public.user_profiles
SET activity_level  = NULL,
    pal_system      = NULL,
    intensity_level = NULL,
    custom_pal      = NULL
WHERE tdee_source = 'manual'
  AND (activity_level IS NOT NULL OR pal_system IS NOT NULL
       OR intensity_level IS NOT NULL OR custom_pal IS NOT NULL);

-- Håll skuggkopian i linje (triggern synkar inte längre dessa fält)
UPDATE public.profiles p
SET activity_level  = up.activity_level,
    pal_system      = up.pal_system,
    intensity_level = up.intensity_level,
    custom_pal      = up.custom_pal
FROM public.user_profiles up
WHERE up.id = p.user_id
  AND p.is_active = true
  AND up.tdee_source = 'manual';
