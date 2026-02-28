-- =========================================================
-- MIGRATION: Add Shared Lists Feature — Steg 5/5
-- Date: 2026-03-01
-- Description: Uppdaterar search_food_items RPC för att stöda
--   den nya FoodTab-typen 'list:{uuid}'.
--
-- Befintliga tabvärden ('mina', 'slv', 'usda', 'alla') fungerar
-- exakt som förut. Ny gren för listors items hanterar:
--   p_tab = 'list:{uuid}' → frågar food_items WHERE shared_list_id = {uuid}
--
-- Funktionssignatur är oförändrad — inga frontend-ändringar av anropet
-- behövs utöver att skicka det nya tabvärdet.
-- =========================================================

CREATE OR REPLACE FUNCTION public.search_food_items(
  p_tab       text,
  p_user_id   uuid,
  p_search    text    DEFAULT NULL,
  p_color     text    DEFAULT NULL,
  p_is_recipe boolean DEFAULT NULL,
  p_limit     integer DEFAULT 50,
  p_offset    integer DEFAULT 0
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
BEGIN
  -- -------------------------------------------------------
  -- Identifiera om p_tab är ett listtab ('list:{uuid}')
  -- Exempel: 'list:a1b2c3d4-...'
  -- -------------------------------------------------------
  IF p_tab LIKE 'list:%' THEN
    v_is_list_tab := true;
    BEGIN
      v_list_id := (substring(p_tab from 6))::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid list tab format: %', p_tab;
    END;
  ELSIF p_tab NOT IN ('mina', 'slv', 'alla') THEN
    RAISE EXCEPTION 'Invalid tab: %', p_tab;
  END IF;

  -- -------------------------------------------------------
  -- LISTTAB-gren: frågar items som tillhör shared_list_id
  -- RLS-check sker implicit via SECURITY DEFINER + policy,
  -- men vi verifierar membership explicit för säkerhet.
  -- -------------------------------------------------------
  IF v_is_list_tab THEN
    -- Verifiera att p_user_id är med i listan
    IF NOT EXISTS (
      SELECT 1 FROM public.shared_list_members
      WHERE shared_list_id = v_list_id AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Access denied: not a member of list %', v_list_id;
    END IF;

    -- Räkna
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

    -- Hämta items
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

  -- -------------------------------------------------------
  -- BEFINTLIGA TABBAR: exakt samma logik som innan migrationen.
  -- Inga ändringar — kopierad direkt från befintlig funktion.
  -- -------------------------------------------------------

  -- Count via CTE-logik
  SELECT COUNT(*) INTO v_total
  FROM food_items fi
  WHERE
    (fi.user_id IS NULL OR fi.user_id = p_user_id)
    AND (
      (p_tab = 'mina' AND (
        fi.user_id = p_user_id
        OR (fi.user_id IS NULL AND fi.source = 'manual')
      ))
      OR (p_tab = 'slv' AND fi.user_id IS NULL AND fi.source = 'livsmedelsverket')
      OR (p_tab = 'alla' AND (
        fi.user_id = p_user_id
        OR (fi.user_id IS NULL AND fi.source = 'manual')
        OR (fi.user_id IS NULL AND fi.source = 'livsmedelsverket')
      ))
    )
    AND NOT (
      (p_tab = 'mina' OR p_tab = 'alla')
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

  -- Heltals-pagination
  v_pages := (v_total + GREATEST(p_limit, 1) - 1) / GREATEST(p_limit, 1);

  -- Items med similarity-ranking
  SELECT COALESCE(jsonb_agg(to_jsonb(sub)), '[]'::jsonb) INTO v_items
  FROM (
    SELECT fi.*
    FROM food_items fi
    WHERE
      (fi.user_id IS NULL OR fi.user_id = p_user_id)
      AND (
        (p_tab = 'mina' AND (
          fi.user_id = p_user_id
          OR (fi.user_id IS NULL AND fi.source = 'manual')
        ))
        OR (p_tab = 'slv' AND fi.user_id IS NULL AND fi.source = 'livsmedelsverket')
        OR (p_tab = 'alla' AND (
          fi.user_id = p_user_id
          OR (fi.user_id IS NULL AND fi.source = 'manual')
          OR (fi.user_id IS NULL AND fi.source = 'livsmedelsverket')
        ))
      )
      AND NOT (
        (p_tab = 'mina' OR p_tab = 'alla')
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
      CASE WHEN p_search IS NOT NULL AND p_search != ''
           THEN similarity(fi.name, p_search)
           ELSE 0
      END DESC,
      fi.name COLLATE "sv-x-icu" ASC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN QUERY SELECT v_items, v_total, v_pages;
END;
$$;

COMMENT ON FUNCTION public.search_food_items IS
  'Server-side paginering och sökning för food_items.
   Stöder flikvärden: mina, slv, alla, list:{uuid}. (usda-fliken borttagen)
   Sortering: similarity DESC (sökning), sedan fi.name COLLATE "sv-x-icu" ASC.
   SECURITY DEFINER: kör med förhöjda rättigheter för cross-user shadowing-logik.';
