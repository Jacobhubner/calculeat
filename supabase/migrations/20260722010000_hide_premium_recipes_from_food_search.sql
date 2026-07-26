-- =========================================================
-- MIGRATION: Dölj premium-receptens food_items för gratisanvändare
-- Date: 2026-07-22
-- Läcka: premium-låsta officiella recept var blurrade i Upptäck-fliken,
-- men deras globala följeslagar-food_items (is_recipe=true, user_id=NULL)
-- låg öppna i Calculeat-fliken och gick att söka fram och LOGGA gratis.
-- Fix: search_food_items döljer helt food_items som tillhör ett
-- premium_only-officiellt recept, om användaren saknar recipe_bank_full
-- OCH premium_enforcement='on'. En hjälppredikat-funktion håller villkoret
-- på ett ställe. Egna kopior (user_id = p_user_id) döljs aldrig — de har
-- premium_only=false på sin egen receptrad.
-- =========================================================

-- Predikat: är detta food_item ett premium-lås för den givna användaren?
CREATE OR REPLACE FUNCTION public.food_item_is_premium_locked(
  p_food_item_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT value FROM public.app_config WHERE key = 'premium_enforcement'), 'off') = 'on'
    AND NOT COALESCE(
      (public.get_plan_limits(public.get_user_plan(p_user_id)) ->> 'recipe_bank_full')::boolean,
      false
    )
    AND EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.food_item_id = p_food_item_id
        AND r.visibility = 'official'
        AND r.premium_only = true
    );
$$;

REVOKE EXECUTE ON FUNCTION public.food_item_is_premium_locked FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.food_item_is_premium_locked TO authenticated, service_role;

-- search_food_items: lägg till premium-lås-filtret i båda gren (list + huvud).
CREATE OR REPLACE FUNCTION public.search_food_items(
  p_tab text, p_user_id uuid, p_search text DEFAULT NULL::text, p_color text DEFAULT NULL::text,
  p_is_recipe boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0,
  p_locale text DEFAULT NULL::text
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
    -- Dölj premium-låsta receptföljeslagare för gratisanvändare
    AND NOT (fi.is_recipe AND fi.user_id IS NULL
             AND public.food_item_is_premium_locked(fi.id, p_user_id))
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
               AND public.food_item_is_premium_locked(fi.id, p_user_id))
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
