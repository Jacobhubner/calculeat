-- =========================================================
-- MIGRATION: food_data_sources-tabell + registerdriven search_food_items
-- Datum: 2026-08-14
--
-- Bakgrund:
--   Frontend har ett DATA_SOURCES-register (src/lib/constants/dataSources.ts)
--   som gör datakällor utbytbara utan kodändring. RPC:n kände inte till det
--   och hade i stället källorna inbakade på fem ställen: tab-valideringen,
--   v_all_sources, två WHERE-block och locale-boosten i ranking.
--
--   Att lägga till en källa (t.ex. brittiska CoFID) krävde därför att hela
--   funktionen skrevs om. Nu slår den upp i food_data_sources, så en ny källa
--   blir en INSERT plus ett ALTER TYPE på food_source-enumen.
--
-- Notera:
--   Tabellen speglar DATA_SOURCES i frontend. De två måste hållas i synk —
--   se kommentaren på tabellen.
-- =========================================================

-- ---------------------------------------------------------
-- Tabell: registret över globala datakällor
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.food_data_sources (
  -- Motsvarar food_items.source. Enum, inte text, så en okänd källa inte
  -- kan smyga in via INSERT.
  source_id       food_source PRIMARY KEY,
  -- Fliknyckeln frontend skickar som p_tab ('slv', 'usda', ...).
  tab_key         text        NOT NULL UNIQUE,
  -- Om källan ingår i 'alla'-fliken.
  include_in_all  boolean     NOT NULL DEFAULT true,
  -- BCP 47-prefix där källan är förstahandsval, mest specifik först.
  -- Driver locale-boosten i ranking; tom array = ingen boost.
  primary_locales text[]      NOT NULL DEFAULT ARRAY[]::text[],
  -- Visningsordning i flikraden.
  sort_order      int         NOT NULL DEFAULT 100,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.food_data_sources IS
  'Register över globala livsmedelskällor. Speglar DATA_SOURCES i
   src/lib/constants/dataSources.ts — håll de två i synk vid ändring.
   Ny källa: ALTER TYPE food_source ADD VALUE, sedan INSERT här.';

-- Seed med nuvarande källor. tab_key och primary_locales matchar
-- frontend-registret exakt.
INSERT INTO public.food_data_sources (source_id, tab_key, include_in_all, primary_locales, sort_order)
VALUES
  ('livsmedelsverket', 'slv',  true, ARRAY['sv'],           100),
  ('usda',             'usda', true, ARRAY['en-US', 'en'],   90)
ON CONFLICT (source_id) DO UPDATE
  SET tab_key         = EXCLUDED.tab_key,
      include_in_all  = EXCLUDED.include_in_all,
      primary_locales = EXCLUDED.primary_locales,
      sort_order      = EXCLUDED.sort_order;

-- Läsbar för alla inloggade; bara service_role skriver.
ALTER TABLE public.food_data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read data sources" ON public.food_data_sources;
CREATE POLICY "Anyone can read data sources"
  ON public.food_data_sources FOR SELECT
  TO authenticated, anon
  USING (true);

-- ---------------------------------------------------------
-- Hjälpfunktion: vilken källa är förstahandsval för ett språk
--
-- Ersätter den tidigare hårdkodade CASE-satsen i ranking, som bara kände
-- till sv → livsmedelsverket och allt-annat → usda. Prefixmatchning på
-- subtag-gräns ('en' matchar 'en-GB', men 'en-G' matchar ingenting) och mest
-- specifika träff vinner — samma regel som getDataSourceForLocale i frontend.
--
-- Returnerar EN källa i stället för en boost per rad, så RPC:n kan slå upp
-- den en gång och slippa en korrelerad subquery per rad i ORDER BY.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.preferred_food_source_for_locale(p_locale text)
RETURNS food_source
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT ds.source_id
  FROM public.food_data_sources ds
  CROSS JOIN LATERAL unnest(ds.primary_locales) AS loc
  WHERE p_locale IS NOT NULL
    AND (lower(p_locale) = lower(loc)
         OR lower(p_locale) LIKE lower(loc) || '-%')
  -- Längst matchande mönster = mest specifikt ('en-GB' slår 'en')
  ORDER BY length(loc) DESC
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.preferred_food_source_for_locale IS
  'Källan vars primary_locales bäst matchar angivet språk, mest specifik
   först. NULL om ingen matchar. Speglar getDataSourceForLocale i
   src/lib/constants/dataSources.ts.';

-- ---------------------------------------------------------
-- RPC: search_food_items — nu registerdriven
-- ---------------------------------------------------------
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
  -- Hämtas ur registret i stället för att vara inbakad i funktionen
  v_all_sources  food_source[];
  -- Källan som p_tab pekar ut, NULL för virtuella flikar (mina/calculeat/alla)
  v_tab_source   food_source;
  -- Källan som får locale-boost. Slås upp en gång i stället för per rad.
  v_boost_source food_source;
BEGIN
  -- Fallback till 'usda' när språket inte matchar någon källa (t.ex. 'de-DE').
  -- Bevarar tidigare beteende, där CASE-satsen gav USDA boost för allt
  -- icke-svenskt, och speglar FALLBACK_SOURCE i useFoodSource.ts.
  IF p_locale IS NOT NULL THEN
    v_boost_source := COALESCE(
      public.preferred_food_source_for_locale(p_locale),
      'usda'::food_source
    );
  END IF;

  -- 'manual' är Calculeats egna globala poster. Den har normalt ingen rad i
  -- registret (den är ingen extern datakälla) men ingår alltid i 'alla'.
  -- DISTINCT skyddar mot dubblett om någon ändå lägger in den.
  SELECT array_agg(DISTINCT src) INTO v_all_sources
  FROM (
    SELECT source_id AS src FROM public.food_data_sources WHERE include_in_all
    UNION
    SELECT 'manual'::food_source
  ) s;

  IF p_tab LIKE 'list:%' THEN
    v_is_list_tab := true;
    BEGIN
      v_list_id := (substring(p_tab from 6))::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid list tab format: %', p_tab;
    END;
  ELSIF p_tab IN ('mina', 'calculeat', 'alla') THEN
    -- Virtuella flikar utan egen källa
    v_tab_source := NULL;
  ELSE
    -- Datakällsflik: giltig endast om den finns i registret. Ersätter den
    -- tidigare hårdkodade listan ('mina', 'calculeat', 'slv', 'usda', 'alla').
    SELECT source_id INTO v_tab_source
    FROM public.food_data_sources
    WHERE tab_key = p_tab;

    IF v_tab_source IS NULL THEN
      RAISE EXCEPTION 'Invalid tab: %', p_tab;
    END IF;
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
        fi.name COLLATE "und-x-icu" ASC
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
    AND (fi.user_id IS NULL OR fi.is_preview = p_is_preview)
    AND (
      (p_tab = 'mina'      AND fi.user_id = p_user_id)
      OR (p_tab = 'calculeat' AND fi.user_id IS NULL AND fi.source = 'manual')
      -- Datakällsflik: matchar källan som slogs upp ur registret ovan
      OR (v_tab_source IS NOT NULL AND fi.user_id IS NULL AND fi.source = v_tab_source)
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
        OR (v_tab_source IS NOT NULL AND fi.user_id IS NULL AND fi.source = v_tab_source)
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
        -- Locale-boosten kommer ur registret i stället för en hårdkodad
        -- sv/usda-CASE, så en ny källa får rätt boost automatiskt.
        -- v_boost_source är uppslagen en gång ovan.
        * CASE WHEN v_boost_source IS NOT NULL AND fi.source = v_boost_source
               THEN 1.07 ELSE 1.0 END
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

COMMENT ON FUNCTION public.search_food_items IS
  'Server-side paginering och sökning för food_items.
   Flikvärden: mina, calculeat, alla, list:{uuid} samt tab_key ur
   food_data_sources (slv, usda, ...).
   mina: bara user_id = p_user_id (shadowing ON).
   calculeat: user_id IS NULL AND source = manual.
   Datakällsflik: user_id IS NULL AND source = motsvarande source_id.
   alla: manual + alla källor med include_in_all.
   Ranking: exakt match > prefix > trigram, viktat med quality score och
   locale-boost ur food_data_sources.primary_locales.
   SECURITY DEFINER: krävs för cross-user shadowing-logik.';
