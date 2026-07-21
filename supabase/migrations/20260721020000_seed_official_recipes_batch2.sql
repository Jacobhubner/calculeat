-- =========================================================
-- MIGRATION: Seed receptbanken — batch 2 (10 originalrecept)
-- Date: 2026-07-21
-- Samma pipeline som batch 1 (20260721010000): pg_temp-hjälpare med exakt
-- SLV-namnmatchning, idempotent per namn. 3 gratis + 7 premium.
-- Totalt i banken efter denna: 20 recept (7 gratis / 13 premium).
-- =========================================================

CREATE FUNCTION pg_temp.seed_official_recipe(
  p_name text, p_servings int, p_premium boolean, p_tags text[],
  p_prep int, p_cook int, p_instructions text, p_ings jsonb
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_admin uuid; v_ing jsonb; v_fi record; v_w numeric;
  v_tot_w numeric := 0; v_tot_kcal numeric := 0; v_tot_fat numeric := 0;
  v_tot_carb numeric := 0; v_tot_prot numeric := 0;
  v_food_id uuid := gen_random_uuid(); v_recipe_id uuid := gen_random_uuid();
  v_order int := 0; v_kpg numeric; v_color text;
BEGIN
  SELECT user_id INTO v_admin FROM public.admins WHERE is_super_admin = true LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'seed: ingen superadmin hittad'; END IF;
  IF EXISTS (SELECT 1 FROM public.recipes WHERE user_id = v_admin AND name = p_name) THEN
    RAISE NOTICE 'seed: "%" finns redan — hoppar over', p_name; RETURN;
  END IF;
  FOR v_ing IN SELECT * FROM jsonb_array_elements(p_ings) LOOP
    SELECT id, calories, fat_g, carb_g, protein_g INTO v_fi
    FROM public.food_items
    WHERE user_id IS NULL AND source = 'livsmedelsverket' AND name = (v_ing->>'n')
    ORDER BY created_at LIMIT 1;
    IF v_fi.id IS NULL THEN
      RAISE EXCEPTION 'seed "%": ingrediens saknas i globala listan: %', p_name, v_ing->>'n';
    END IF;
    v_w := (v_ing->>'g')::numeric;
    v_tot_w    := v_tot_w    + v_w;
    v_tot_kcal := v_tot_kcal + v_w * COALESCE(v_fi.calories, 0) / 100;
    v_tot_fat  := v_tot_fat  + v_w * COALESCE(v_fi.fat_g, 0)    / 100;
    v_tot_carb := v_tot_carb + v_w * COALESCE(v_fi.carb_g, 0)   / 100;
    v_tot_prot := v_tot_prot + v_w * COALESCE(v_fi.protein_g, 0)/ 100;
  END LOOP;
  v_kpg := v_tot_kcal / v_tot_w;
  v_color := CASE WHEN v_kpg < 1 THEN 'Green' WHEN v_kpg <= 2.4 THEN 'Yellow' ELSE 'Orange' END;
  INSERT INTO public.food_items (
    id, user_id, source, name, is_recipe, default_amount, default_unit,
    calories, fat_g, carb_g, protein_g, weight_grams, kcal_per_gram,
    energy_density_color, food_type, grams_per_piece, serving_unit,
    kcal_per_unit, fat_per_unit, carb_per_unit, protein_per_unit
  ) VALUES (
    v_food_id, NULL, 'manual', p_name, true, 1, 'portion',
    ROUND(v_tot_kcal / v_tot_w * 100, 1), ROUND(v_tot_fat / v_tot_w * 100, 1),
    ROUND(v_tot_carb / v_tot_w * 100, 1), ROUND(v_tot_prot / v_tot_w * 100, 1),
    ROUND(v_tot_w / p_servings, 1), ROUND(v_kpg, 3), v_color, 'Solid',
    ROUND(v_tot_w / p_servings, 1), 'portion',
    ROUND(v_tot_kcal / p_servings, 1), ROUND(v_tot_fat / p_servings, 1),
    ROUND(v_tot_carb / p_servings, 1), ROUND(v_tot_prot / p_servings, 1)
  );
  INSERT INTO public.recipes (
    id, user_id, created_by, food_item_id, name, servings, total_weight_grams,
    instructions, prep_time_min, cook_time_min, visibility, premium_only, tags
  ) VALUES (
    v_recipe_id, v_admin, v_admin, v_food_id, p_name, p_servings, ROUND(v_tot_w, 1),
    p_instructions, p_prep, p_cook, 'official', p_premium, p_tags
  );
  FOR v_ing IN SELECT * FROM jsonb_array_elements(p_ings) LOOP
    SELECT id, calories, fat_g, carb_g, protein_g INTO v_fi
    FROM public.food_items
    WHERE user_id IS NULL AND source = 'livsmedelsverket' AND name = (v_ing->>'n')
    ORDER BY created_at LIMIT 1;
    v_w := (v_ing->>'g')::numeric;
    v_order := v_order + 1;
    INSERT INTO public.recipe_ingredients (
      recipe_id, food_item_id, amount, unit, weight_grams, ingredient_order,
      snapshot_calories, snapshot_fat_g, snapshot_carb_g, snapshot_protein_g
    ) VALUES (
      v_recipe_id, v_fi.id, v_w, 'g', v_w, v_order,
      ROUND(v_w * COALESCE(v_fi.calories,0)/100, 1),
      ROUND(v_w * COALESCE(v_fi.fat_g,0)/100, 1),
      ROUND(v_w * COALESCE(v_fi.carb_g,0)/100, 1),
      ROUND(v_w * COALESCE(v_fi.protein_g,0)/100, 1)
    );
  END LOOP;
END;
$$;

-- ── GRATIS (3) ─────────────────────────────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Havregrynsgröt med äpple och honung', 1, false,
  ARRAY['frukost','vegetariskt'], 2, 8,
  E'1. Koka havregrynen med mjölken under omrörning, ca 3–5 minuter.\n2. Tärna äpplet och rör ner hälften i gröten.\n3. Toppa med resten av äpplet och ringla över honung.',
  '[{"n":"Havregryn fullkorn","g":50},{"n":"Mellanmjölk fett 1,5% berikad","g":250},{"n":"Äpple m. skal","g":100},{"n":"Honung","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Falukorv med makaroner', 2, false,
  ARRAY['middag','klassiker','snabbt'], 5, 15,
  E'1. Koka makaronerna enligt förpackningen.\n2. Skiva falukorven och stek gyllene i rapsolja.\n3. Servera korven med makaronerna och en klick ketchup.',
  '[{"n":"Korv falukorv kött 58%","g":250},{"n":"Pasta okokt","g":160},{"n":"Ketchup","g":40},{"n":"Rapsolja","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Räkmacka med ägg', 1, false,
  ARRAY['lunch','mellanmål','högprotein'], 10, 0,
  E'1. Koka ägget 8–10 minuter, spola kallt och skala.\n2. Bred gräddfil på brödet.\n3. Toppa med skivat ägg och räkor. Avsluta med svartpeppar och gärna dill och citron.',
  '[{"n":"Räka kokt","g":75},{"n":"Ägg rått","g":55},{"n":"Bröd fullkorn råg fibrer ca 7%","g":35},{"n":"Gräddfil fett 12%","g":20}]'::jsonb
);

-- ── PREMIUM (7) ────────────────────────────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Chili con carne', 4, true,
  ARRAY['middag','storkok','högprotein'], 10, 35,
  E'1. Koka riset enligt förpackningen.\n2. Fräs hackad lök och vitlök i rapsolja. Höj värmen och bryn färsen.\n3. Tillsätt paprika, kidneybönor och krossade tomater. Krydda med chilipulver och spiskummin.\n4. Låt sjuda 20–30 minuter. Smaka av och servera med riset.',
  '[{"n":"Nöt färs rå fett 10%","g":400},{"n":"Kidneybönor röda bönor konserv. u. lag","g":400},{"n":"Tomat krossad konserv. m. lag","g":800},{"n":"Lök gul","g":120},{"n":"Vitlök","g":10},{"n":"Paprika röd","g":120},{"n":"Rapsolja","g":15},{"n":"Ris jasmin okokt","g":240}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Krämig kycklingcurry', 3, true,
  ARRAY['middag','högprotein'], 10, 25,
  E'1. Koka riset enligt förpackningen.\n2. Tärna kycklingen och stek i rapsolja tills genomstekt. Lägg åt sidan.\n3. Fräs lök och paprika, rör i currypulver och låt fräsa en halv minut.\n4. Häll i kokosmjölken, lägg tillbaka kycklingen och låt sjuda 10 minuter. Servera med riset.',
  '[{"n":"Kyckling bröstfilé rå u. skinn","g":450},{"n":"Kokosmjölk fett ca 24%","g":300},{"n":"Lök gul","g":100},{"n":"Paprika röd","g":100},{"n":"Rapsolja","g":10},{"n":"Ris jasmin okokt","g":210}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Röd linssoppa', 3, true,
  ARRAY['lunch','middag','vegetariskt','budget'], 10, 25,
  E'1. Fräs hackad lök, vitlök och tärnad morot i rapsolja.\n2. Tillsätt linser, krossade tomater och ca 6 dl vatten eller buljong.\n3. Låt sjuda 15–20 minuter tills linserna är mjuka.\n4. Smaka av med salt, peppar och gärna spiskummin. Mixa slät om du vill.',
  '[{"n":"Linser torkade","g":180},{"n":"Morot","g":150},{"n":"Lök gul","g":100},{"n":"Vitlök","g":10},{"n":"Tomat krossad konserv. m. lag","g":400},{"n":"Rapsolja","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Ost- och svampomelett', 1, true,
  ARRAY['frukost','lunch','högprotein','vegetariskt'], 5, 10,
  E'1. Skiva champinjonerna och stek dem i hälften av smöret.\n2. Vispa äggen med en nypa salt. Häll i resten av smöret i pannan och därefter äggen.\n3. När omeletten nästan stannat: strö över riven ost och champinjoner, vik ihop och servera.',
  '[{"n":"Ägg rått","g":165},{"n":"Ost hårdost fett 26%","g":30},{"n":"Champinjon","g":100},{"n":"Smör fett 80%","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Stekt ris med ägg och grönsaker', 2, true,
  ARRAY['lunch','vegetariskt','budget'], 10, 15,
  E'1. Koka riset (gärna dagen innan — kallt ris blir bäst).\n2. Stek en omelett av äggen, ta upp och strimla.\n3. Woka morot, lök och majs i rapsolja. Lägg i riset och stek på hög värme.\n4. Rör ner ägg och sojasås, stek ihop en minut och servera.',
  '[{"n":"Ris jasmin okokt","g":150},{"n":"Ägg rått","g":110},{"n":"Morot","g":100},{"n":"Majskorn konserv. u. lag","g":100},{"n":"Lök gul","g":60},{"n":"Sojasås","g":25},{"n":"Rapsolja","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Kycklingfajitas i tortilla', 2, true,
  ARRAY['middag'], 15, 15,
  E'1. Strimla kyckling, paprika och rödlök.\n2. Stek kycklingen i rapsolja med fajitaskrydda tills genomstekt. Lägg i grönsakerna och stek ytterligare några minuter.\n3. Värm tortillabröden. Fyll med kycklingblandningen och toppa med gräddfil.',
  '[{"n":"Kyckling bröstfilé rå u. skinn","g":300},{"n":"Bröd vitt vetetortilla","g":120},{"n":"Paprika röd","g":150},{"n":"Lök röd","g":80},{"n":"Gräddfil fett 12%","g":60},{"n":"Rapsolja","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Ugnsrostad sötpotatis med kycklingfilé', 2, true,
  ARRAY['middag','högprotein','mealprep'], 10, 30,
  E'1. Sätt ugnen på 225°C. Tärna sötpotatisen, vänd i olivolja, salt och paprikapulver. Rosta 25–30 minuter.\n2. Stek eller ugnsbaka kycklingfilén tills innertemperaturen når 72°C.\n3. Ångkoka broccolin. Skiva kycklingen och servera allt tillsammans.',
  '[{"n":"Kyckling bröstfilé rå u. skinn","g":300},{"n":"Sötpotatis rå","g":400},{"n":"Broccoli","g":150},{"n":"Olivolja","g":15}]'::jsonb
);
