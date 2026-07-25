-- Steg 3 av preview-sandlådan ("Testa som ny användare"): egna livsmedel.
--
-- Preview-läget ska fungera EXAKT som en ny användare, även när man skapar
-- egna livsmedel. Personliga food_items har samma user_id som den riktiga
-- användaren, så RLS ensam kan inte skilja preview-livsmedel från riktiga.
-- Vi taggar därför preview-skapade rader med is_preview=true (samma mönster
-- som daily_logs/meal_entries/weight_history/calibration_history) och filtrerar
-- i läsningarna. exit_preview_profile raderar dem så inget överlever avslut.
--
-- Globala livsmedel (user_id IS NULL — SLV/CalculEat/USDA) är alltid
-- is_preview=false och visas i båda lägena. Endast PERSONLIGA rader
-- (user_id = p_user_id) filtreras på is_preview.

-- 1. Kolumn + index -----------------------------------------------------------
ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS is_preview boolean NOT NULL DEFAULT false;

-- Partiellt index: preview-rader är fåtaliga och rensas ofta.
CREATE INDEX IF NOT EXISTS idx_food_items_user_preview
  ON public.food_items (user_id)
  WHERE is_preview = true;

-- 1b. Gör per-användare-unika index preview-medvetna -------------------------
-- Annars kan en preview-användare inte skapa/redigera/dölja ett livsmedel som
-- kolliderar med något i det riktiga kontot (samma data_hash, namn eller
-- global_food_id). En riktig ny användare stöter aldrig på det. Preview- och
-- riktiga rader separeras via is_preview.
DROP INDEX IF EXISTS public.idx_food_items_user_data_hash;
CREATE UNIQUE INDEX idx_food_items_user_data_hash
  ON public.food_items USING btree (user_id, data_hash, is_preview)
  WHERE ((user_id IS NOT NULL) AND (is_recipe = false));

DROP INDEX IF EXISTS public.idx_food_items_user_name;
CREATE UNIQUE INDEX idx_food_items_user_name
  ON public.food_items USING btree (user_id, name, is_preview)
  WHERE (user_id IS NOT NULL);

DROP INDEX IF EXISTS public.idx_unique_user_cow;
CREATE UNIQUE INDEX idx_unique_user_cow
  ON public.food_items USING btree (user_id, global_food_id, is_preview)
  WHERE (global_food_id IS NOT NULL);

-- 2. exit_preview_profile: radera även preview-livsmedel ----------------------
CREATE OR REPLACE FUNCTION public.exit_preview_profile()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id        uuid := auth.uid();
  v_preview_id     uuid;
  v_old_profile_id uuid;
  v_backup         jsonb;
BEGIN
  SELECT active_profile_id, preview_backup_profile_id, preview_user_profiles_backup
  INTO v_preview_id, v_old_profile_id, v_backup
  FROM user_profiles WHERE id = v_user_id;

  IF v_old_profile_id IS NULL THEN RETURN; END IF;

  DELETE FROM daily_logs         WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM meal_entries        WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM weight_history      WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM calibration_history WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM food_items          WHERE user_id = v_user_id AND is_preview = true;

  IF v_backup IS NOT NULL THEN
    UPDATE user_profiles
    SET
      profile_name                 = (v_backup->>'profile_name'),
      weight_kg                    = (v_backup->>'weight_kg')::numeric,
      height_cm                    = (v_backup->>'height_cm')::numeric::integer,
      gender                       = (v_backup->>'gender'),
      birth_date                   = (v_backup->>'birth_date')::date,
      body_fat_percentage          = (v_backup->>'body_fat_percentage')::numeric,
      bmr                          = (v_backup->>'bmr')::numeric,
      tdee                         = (v_backup->>'tdee')::numeric::integer,
      calories_min                 = (v_backup->>'calories_min')::numeric,
      calories_max                 = (v_backup->>'calories_max')::numeric,
      bmr_formula                  = (v_backup->>'bmr_formula'),
      activity_level               = (v_backup->>'activity_level'),
      pal_system                   = (v_backup->>'pal_system'),
      intensity_level              = (v_backup->>'intensity_level'),
      training_frequency_per_week  = (v_backup->>'training_frequency_per_week')::numeric,
      training_duration_minutes    = (v_backup->>'training_duration_minutes')::numeric,
      daily_steps                  = (v_backup->>'daily_steps'),
      custom_pal                   = (v_backup->>'custom_pal')::numeric,
      calorie_goal                 = (v_backup->>'calorie_goal'),
      deficit_level                = (v_backup->>'deficit_level'),
      custom_tdee                  = (v_backup->>'custom_tdee')::numeric,
      body_composition_method      = (v_backup->>'body_composition_method'),
      fat_min_percent              = (v_backup->>'fat_min_percent')::numeric,
      fat_max_percent              = (v_backup->>'fat_max_percent')::numeric,
      carb_min_percent             = (v_backup->>'carb_min_percent')::numeric,
      carb_max_percent             = (v_backup->>'carb_max_percent')::numeric,
      protein_min_percent          = (v_backup->>'protein_min_percent')::numeric,
      protein_max_percent          = (v_backup->>'protein_max_percent')::numeric,
      training_activity_id         = (v_backup->>'training_activity_id'),
      training_days_per_week       = (v_backup->>'training_days_per_week')::numeric::integer,
      training_minutes_per_session = (v_backup->>'training_minutes_per_session')::numeric::integer,
      walking_activity_id          = (v_backup->>'walking_activity_id'),
      steps_per_day                = (v_backup->>'steps_per_day')::numeric::integer,
      hours_standing_per_day       = (v_backup->>'hours_standing_per_day')::numeric,
      household_activity_id        = (v_backup->>'household_activity_id'),
      household_hours_per_day      = (v_backup->>'household_hours_per_day')::numeric,
      spa_factor                   = (v_backup->>'spa_factor')::numeric,
      tdee_source                  = (v_backup->>'tdee_source'),
      tdee_calculated_at           = (v_backup->>'tdee_calculated_at')::timestamptz,
      tdee_calculation_snapshot    = (v_backup->'tdee_calculation_snapshot'),
      target_weight_kg             = (v_backup->>'target_weight_kg')::numeric,
      initial_weight_kg            = (v_backup->>'initial_weight_kg')::numeric,
      meals_config                 = (v_backup->'meals_config'),
      active_profile_id            = v_old_profile_id,
      preview_backup_profile_id    = NULL,
      preview_user_profiles_backup = NULL
    WHERE id = v_user_id;
  ELSE
    UPDATE user_profiles
    SET active_profile_id         = v_old_profile_id,
        preview_backup_profile_id = NULL
    WHERE id = v_user_id;
  END IF;

  DELETE FROM profiles
  WHERE id = v_preview_id AND profile_name = '__preview__';
END;
$function$;

-- 3. search_food_items: p_is_preview-parameter -------------------------------
-- Personliga rader (user_id = p_user_id) filtreras på is_preview = p_is_preview.
-- Globala rader (user_id IS NULL) är alltid is_preview=false och opåverkade.
-- Ta bort gamla 9-arg-versionen så namngivna anrop inte blir tvetydiga.
DROP FUNCTION IF EXISTS public.search_food_items(
  text, uuid, text, text, boolean, integer, integer, text, boolean);

CREATE OR REPLACE FUNCTION public.search_food_items(
  p_tab text,
  p_user_id uuid,
  p_search text DEFAULT NULL::text,
  p_color text DEFAULT NULL::text,
  p_is_recipe boolean DEFAULT NULL::boolean,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_locale text DEFAULT NULL::text,
  p_force_free boolean DEFAULT false,
  p_is_preview boolean DEFAULT false
)
 RETURNS TABLE(items jsonb, total_count bigint, total_pages integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_items        jsonb;
  v_total        bigint;
  v_pages        int;
  v_list_id      uuid;
  v_is_list_tab  boolean := false;
  v_all_sources  food_source[] := ARRAY['manual', 'livsmedelsverket', 'usda']::food_source[];
BEGIN
  IF p_tab LIKE 'list:%' THEN
    v_is_list_tab := true;
    BEGIN
      v_list_id := (substring(p_tab from 6))::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid list tab format: %', p_tab;
    END;
  ELSIF p_tab NOT IN ('mina', 'calculeat', 'slv', 'usda', 'alla') THEN
    RAISE EXCEPTION 'Invalid tab: %', p_tab;
  END IF;

  IF v_is_list_tab THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shared_list_members
      WHERE shared_list_id = v_list_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Access denied: not a member of list %', v_list_id;
    END IF;

    SELECT COUNT(*) INTO v_total
    FROM public.food_items fi
    WHERE fi.shared_list_id = v_list_id
      AND (fi.is_hidden IS NOT TRUE)
      AND (
        p_search IS NULL
        OR similarity(fi.name, p_search) > 0.1
        OR fi.name  ILIKE '%' || p_search || '%'
        OR fi.brand ILIKE '%' || p_search || '%'
      )
      AND (p_color IS NULL OR fi.energy_density_color = p_color)
      AND (p_is_recipe IS NULL OR fi.is_recipe = p_is_recipe);

    v_pages := (v_total + GREATEST(p_limit, 1) - 1) / GREATEST(p_limit, 1);

    SELECT COALESCE(jsonb_agg(to_jsonb(sub)), '[]'::jsonb) INTO v_items
    FROM (
      SELECT fi.*
      FROM public.food_items fi
      WHERE fi.shared_list_id = v_list_id
        AND (fi.is_hidden IS NOT TRUE)
        AND (
          p_search IS NULL
          OR similarity(fi.name, p_search) > 0.1
          OR fi.name  ILIKE '%' || p_search || '%'
          OR fi.brand ILIKE '%' || p_search || '%'
        )
        AND (p_color IS NULL OR fi.energy_density_color = p_color)
        AND (p_is_recipe IS NULL OR fi.is_recipe = p_is_recipe)
      ORDER BY
        CASE WHEN p_search IS NOT NULL AND p_search != ''
             THEN similarity(fi.name, p_search)
             ELSE 0
        END DESC,
        fi.name COLLATE "sv-x-icu" ASC
      LIMIT p_limit
      OFFSET p_offset
    ) sub;

    RETURN QUERY SELECT v_items, v_total, v_pages;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM food_items fi
  WHERE
    (fi.user_id IS NULL OR fi.user_id = p_user_id)
    -- Preview-isolering: personliga rader måste matcha p_is_preview;
    -- globala rader (user_id IS NULL) är alltid is_preview=false.
    AND (fi.user_id IS NULL OR fi.is_preview = p_is_preview)
    AND (
      (p_tab = 'mina'      AND fi.user_id = p_user_id)
      OR (p_tab = 'calculeat' AND fi.user_id IS NULL AND fi.source = 'manual')
      OR (p_tab = 'slv'       AND fi.user_id IS NULL AND fi.source = 'livsmedelsverket')
      OR (p_tab = 'usda'      AND fi.user_id IS NULL AND fi.source = 'usda')
      OR (p_tab = 'alla'      AND (
            fi.user_id = p_user_id
            OR (fi.user_id IS NULL AND fi.source = ANY(v_all_sources))
         ))
    )
    AND NOT (
      p_tab = 'mina'
      AND fi.user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM food_items fi2
        WHERE fi2.user_id = p_user_id
          AND fi2.global_food_id = fi.id
      )
    )
    AND NOT (fi.is_recipe AND fi.user_id IS NULL
             AND public.food_item_is_premium_locked(fi.id, p_user_id, p_force_free))
    AND (fi.is_hidden IS NOT TRUE)
    AND (
      p_search IS NULL
      OR similarity(fi.name, p_search) > 0.1
      OR fi.name  ILIKE '%' || p_search || '%'
      OR fi.brand ILIKE '%' || p_search || '%'
    )
    AND (p_color IS NULL OR fi.energy_density_color = p_color)
    AND (p_is_recipe IS NULL OR fi.is_recipe = p_is_recipe);

  v_pages := (v_total + GREATEST(p_limit, 1) - 1) / GREATEST(p_limit, 1);

  SELECT COALESCE(jsonb_agg(to_jsonb(sub)), '[]'::jsonb) INTO v_items
  FROM (
    SELECT fi.*
    FROM food_items fi
    WHERE
      (fi.user_id IS NULL OR fi.user_id = p_user_id)
      AND (fi.user_id IS NULL OR fi.is_preview = p_is_preview)
      AND (
        (p_tab = 'mina'      AND fi.user_id = p_user_id)
        OR (p_tab = 'calculeat' AND fi.user_id IS NULL AND fi.source = 'manual')
        OR (p_tab = 'slv'       AND fi.user_id IS NULL AND fi.source = 'livsmedelsverket')
        OR (p_tab = 'usda'      AND fi.user_id IS NULL AND fi.source = 'usda')
        OR (p_tab = 'alla'      AND (
              fi.user_id = p_user_id
              OR (fi.user_id IS NULL AND fi.source = ANY(v_all_sources))
           ))
      )
      AND NOT (
        p_tab = 'mina'
        AND fi.user_id IS NULL
        AND EXISTS (
          SELECT 1 FROM food_items fi2
          WHERE fi2.user_id = p_user_id
            AND fi2.global_food_id = fi.id
        )
      )
      AND NOT (fi.is_recipe AND fi.user_id IS NULL
               AND public.food_item_is_premium_locked(fi.id, p_user_id, p_force_free))
      AND (fi.is_hidden IS NOT TRUE)
      AND (
        p_search IS NULL
        OR similarity(fi.name, p_search) > 0.1
        OR fi.name  ILIKE '%' || p_search || '%'
        OR fi.brand ILIKE '%' || p_search || '%'
      )
      AND (p_color IS NULL OR fi.energy_density_color = p_color)
      AND (p_is_recipe IS NULL OR fi.is_recipe = p_is_recipe)
    ORDER BY
      CASE WHEN p_search IS NOT NULL AND p_search != '' THEN
        CASE WHEN lower(fi.name) = lower(p_search)           THEN 1.0
             WHEN lower(fi.name) LIKE lower(p_search) || '%' THEN 0.9
             ELSE similarity(fi.name, p_search)
        END
        * CASE
            WHEN p_locale LIKE 'sv%' AND fi.source = 'livsmedelsverket' THEN 1.07
            WHEN p_locale NOT LIKE 'sv%' AND p_locale IS NOT NULL AND fi.source = 'usda' THEN 1.07
            ELSE 1.0
          END
        * COALESCE(fi.data_quality_score, 100) / 100.0
      ELSE 0
      END DESC,
      fi.name COLLATE "sv-x-icu" ASC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN QUERY SELECT v_items, v_total, v_pages;
END;
$function$;
