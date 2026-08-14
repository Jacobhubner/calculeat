-- =========================================================
-- MIGRATION: Definiera biotin, koppar, mangan och pantotensyra
-- Datum: 2026-08-14
--
-- CoFID innehåller de här fyra ämnena, men de saknades i
-- nutrient_definitions. Eftersom food_nutrients.nutrient_code har en främmande
-- nyckel dit hoppades de över vid importen (~4 värden per livsmedel).
--
-- Varken SLV- eller USDA-importen levererar dem, så de har inte behövts
-- tidigare. CoFID mäter alla fyra för merparten av sina livsmedel.
--
-- EuroFIR-koderna är hämtade ur CoFID:s egen kodrad (rad 2 i respektive blad).
-- sort_order beräknas i en CTE i stället för per rad: subqueries mot samma
-- tabell i VALUES ser inte varandras insättningar och hade gett kollisioner.
-- =========================================================

WITH bounds AS (
  SELECT
    COALESCE(MAX(sort_order) FILTER (WHERE category = 'mineral'), 0) AS mineral_max,
    COALESCE(MAX(sort_order) FILTER (WHERE category = 'vitamin'), 0) AS vitamin_max
  FROM public.nutrient_definitions
),
new_rows AS (
  SELECT * FROM (VALUES
    -- Mineraler — placeras sist i sin kategori för att inte rubba
    -- befintlig ordning i näringspanelen
    ('copper',           'Koppar',       'Copper',           'mg', 'CU',    'mineral', 1),
    ('manganese',        'Mangan',       'Manganese',        'mg', 'MN',    'mineral', 2),
    -- Vitaminer
    ('biotin',           'Biotin',       'Biotin',           'ug', 'BIOT',  'vitamin', 1),
    ('pantothenic_acid', 'Pantotensyra', 'Pantothenic acid', 'mg', 'PANTO', 'vitamin', 2)
  ) AS t(nutrient_code, display_name_sv, display_name_en, unit, eurofir_code, category, offset_in_category)
)
INSERT INTO public.nutrient_definitions
  (nutrient_code, display_name_sv, display_name_en, unit, eurofir_code, category, sort_order)
SELECT
  n.nutrient_code,
  n.display_name_sv,
  n.display_name_en,
  n.unit,
  n.eurofir_code,
  n.category,
  CASE n.category
    WHEN 'mineral' THEN b.mineral_max + n.offset_in_category
    ELSE b.vitamin_max + n.offset_in_category
  END
FROM new_rows n
CROSS JOIN bounds b
ON CONFLICT (nutrient_code) DO NOTHING;
