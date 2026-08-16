-- BUGG: TDEE återgick spontant till ett gammalt värde.
--
-- Konkret fall 2026-08-16: användaren kalibrerade till 3190 i juni, men
-- `profiles`-raden stod kvar på majvärdet 2770. Triggern
-- sync_profile_to_user_profiles skriver HELA profilen — inklusive tdee, bmr,
-- vikt, kroppsfett och makroprocent — från `profiles` till `user_profiles`
-- vid varje UPDATE på den aktiva raden. Alltså återställdes 3190 till 2770.
--
-- Omfattning: 15 av 28 aktiva profiler hade divergerande tdee. Sex av dem
-- hade NULL i `profiles`, vilket hade skrivit NULL över ett giltigt värde.
-- Även vikt (10), bmr (10), calories_max (8) och kroppsfett (5) divergerade.
--
-- `user_profiles` är den kanoniska källan sedan Fas 2 — kalibrering,
-- Målsättning och profilsidan skriver bara dit. Appen läser numera ENDAST
-- `profiles.profile_name` (AuthContext, för preview-detektering); inga
-- numeriska värden konsumeras därifrån.
--
-- Åtgärd: triggern synkar bara profile_name. Övriga fält är avsiktligt
-- borttagna — de hade ingen läsare men kunde skriva över sanningen.
--
-- Detta är ett delsteg mot Fas 3 (profiles → user_profiles som enda källa).
CREATE OR REPLACE FUNCTION public.sync_active_profile_to_user_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- ENDAST namnet. Att synka numeriska fält härifrån innebar att en
    -- inaktuell skuggkopia kunde skriva över aktuella värden.
    UPDATE public.user_profiles
    SET profile_name = NEW.profile_name
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;
