-- =========================================================
-- MIGRATION: Add USDA tab + locale-aware ranking to search_food_items
-- Date: 2026-06-01
-- Description:
--   - Adds 'usda' tab support
--   - Adds USDA to 'alla' via allowlist (DataSource.includeInAll)
--   - Adds p_locale parameter for mild source-boost in ranking
--   - Composite ranking: exact > prefix > trigram * quality * locale-boost
--   - Changes 'alla' ORDER BY collation to "und-x-icu" (language-neutral)
--   - Validates 'usda' as a recognized tab
-- =========================================================

-- Drop old 7-parameter signature before replacing with 8-parameter version (added p_locale)
DROP FUNCTION IF EXISTS public.search_food_items(text, uuid, text, text, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.search_food_items(
  p_tab       text,
  p_user_id   uuid,
  p_search    text    DEFAULT NULL,
  p_color     text    DEFAULT NULL,
  p_is_recipe boolean DEFAULT NULL,
  p_limit     integer DEFAULT 50,
  p_offset    integer DEFAULT 0,
  p_locale    text    DEFAULT NULL
)
RETURNS TABLE (
  items        jsonb,
  total_count  bigint,
  total_pages  int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items        jsonb;
  v_total        bigint;
  v_pages        int;
  v_list_id      uuid;
  v_is_list_tab  boolean := false;
  -- Allowlist of global sources shown in 'alla' (mirrors DataSourceConfig.includeInAll)
  v_all_sources  text[]  := ARRAY['manual', 'livsmedelsverket', 'usda'];
BEGIN
  -- -------------------------------------------------------
  -- Identifiera om p_tab är ett listtab ('list:{uuid}')
  -- -------------------------------------------------------
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

  -- -------------------------------------------------------
  -- LISTTAB-gren: frågar items som tillhör shared_list_id
  -- -------------------------------------------------------
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
        fi.name COLLATE "und-x-icu" ASC
      LIMIT p_limit
      OFFSET p_offset
    ) sub;

    RETURN QUERY SELECT v_items, v_total, v_pages;
    RETURN;
  END IF;

  -- -------------------------------------------------------
  -- STATISKA TABBAR: mina / calculeat / slv / usda / alla
  -- -------------------------------------------------------

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
      -- Composite ranking: exact > prefix > trigram, with quality + locale source-boost
      CASE WHEN p_search IS NOT NULL AND p_search != '' THEN
        CASE WHEN lower(fi.name) = lower(p_search)           THEN 1.0
             WHEN lower(fi.name) LIKE lower(p_search) || '%' THEN 0.9
             ELSE similarity(fi.name, p_search)
        END
        -- Mild locale-based source boost (1.07 — subtil, never hides a better match)
        * CASE
            WHEN p_locale LIKE 'sv%' AND fi.source = 'livsmedelsverket' THEN 1.07
            WHEN p_locale NOT LIKE 'sv%' AND p_locale IS NOT NULL AND fi.source = 'usda' THEN 1.07
            ELSE 1.0
          END
      ELSE 0
      END DESC,
      -- Quality score tiebreaker when no search term
      COALESCE(fi.data_quality_score, 100) DESC,
      -- Language-neutral collation — correct for mixed SLV (sv) + USDA (en) names
      fi.name COLLATE "und-x-icu" ASC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN QUERY SELECT v_items, v_total, v_pages;
END;
$$;

COMMENT ON FUNCTION public.search_food_items IS
  'Server-side paginering och sökning för food_items.
   Stöder flikvärden: mina, calculeat, slv, usda, alla, list:{uuid}.
   mina: bara user_id = p_user_id (shadowing ON).
   calculeat: user_id IS NULL AND source = manual.
   slv: user_id IS NULL AND source = livsmedelsverket.
   usda: user_id IS NULL AND source = usda.
   alla: allowlist-baserad (manual, livsmedelsverket, usda) — utökbar via v_all_sources.
   p_locale: används för mild source-boost i ranking (1.07).
   Ranking: exakt match > prefix > trigram, viktat med quality score och locale-boost.
   Kollation: und-x-icu (language-neutral, korrekt för mixed-language results).
   SECURITY DEFINER: kör med förhöjda rättigheter för cross-user shadowing-logik.';
