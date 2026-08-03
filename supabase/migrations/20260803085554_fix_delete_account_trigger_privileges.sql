-- Kontoradering via GoTrue föll på "Database error deleting user".
--
-- Orsak: när auth-användaren raderas kaskaderar det ner i public.meal_entries,
-- vars AFTER DELETE-trigger recalculate_daily_log_totals gör UPDATE mot
-- public.daily_logs. Triggerfunktionen saknade SECURITY DEFINER och kördes
-- därför som den anropande rollen — supabase_auth_admin, som inte har några
-- rättigheter i public. Systertriggern recalculate_meal_entry_totals hade redan
-- SECURITY DEFINER, vilket är varför bara den ena felade.
--
-- Raderingen fungerade som postgres men aldrig genom auth-API:et, vilket är
-- varför felet inte gick att reproducera med en vanlig SQL-körning.
--
-- search_path låses explicit: en SECURITY DEFINER-funktion utan fast search_path
-- kan luras att köra fel objekt.
CREATE OR REPLACE FUNCTION public.recalculate_daily_log_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_daily_log_id uuid;
  v_totals record;
  v_color_totals record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_daily_log_id := OLD.daily_log_id;
  ELSE
    v_daily_log_id := NEW.daily_log_id;
  END IF;

  SELECT
    COALESCE(SUM(me.meal_calories), 0) as total_calories,
    COALESCE(SUM(me.meal_fat_g),    0) as total_fat,
    COALESCE(SUM(me.meal_carb_g),   0) as total_carb,
    COALESCE(SUM(me.meal_protein_g),0) as total_protein
  INTO v_totals
  FROM public.meal_entries me
  WHERE me.daily_log_id = v_daily_log_id;

  -- Use snapshotted colour — no join to food_items needed
  SELECT
    COALESCE(SUM(CASE WHEN mei.snapshot_energy_density_color = 'Green'  THEN mei.calories ELSE 0 END), 0) as green_calories,
    COALESCE(SUM(CASE WHEN mei.snapshot_energy_density_color = 'Yellow' THEN mei.calories ELSE 0 END), 0) as yellow_calories,
    COALESCE(SUM(CASE WHEN mei.snapshot_energy_density_color = 'Orange' THEN mei.calories ELSE 0 END), 0) as orange_calories
  INTO v_color_totals
  FROM public.meal_entries me
  JOIN public.meal_entry_items mei ON mei.meal_entry_id = me.id
  WHERE me.daily_log_id = v_daily_log_id;

  UPDATE public.daily_logs
  SET
    total_calories  = v_totals.total_calories,
    total_fat_g     = v_totals.total_fat,
    total_carb_g    = v_totals.total_carb,
    total_protein_g = v_totals.total_protein,
    green_calories  = v_color_totals.green_calories,
    yellow_calories = v_color_totals.yellow_calories,
    orange_calories = v_color_totals.orange_calories,
    kcal_per_gram = CASE
      WHEN v_totals.total_calories > 0 THEN
        v_totals.total_calories / NULLIF(
          (SELECT COALESCE(SUM(weight_grams), 0)
           FROM public.meal_entries me2
           JOIN public.meal_entry_items mei2 ON mei2.meal_entry_id = me2.id
           WHERE me2.daily_log_id = v_daily_log_id
          ), 0
        )
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = v_daily_log_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
