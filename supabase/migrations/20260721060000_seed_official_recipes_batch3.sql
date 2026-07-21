-- =========================================================
-- MIGRATION: Seed receptbanken — batch 3 (10 originalrecept)
-- Date: 2026-07-21
-- Tema: pizza, spaghetti bolognese, fler frukostar (önskat av användaren).
-- Samma pg_temp-pipeline som batch 1/2, exakt SLV-namnmatchning, idempotent.
-- 4 gratis + 6 premium. Totalt i banken efter denna: 30 recept.
-- Vatten (0 kcal) och salt utelämnas ur ingredienslistan — de påverkar
-- inte näringsberäkningen och finns inte som separata SLV-rader att matcha.
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

-- ── GRATIS (4) ─────────────────────────────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Spaghetti bolognese', 4, false,
  ARRAY['middag','klassiker','italienskt'], 10, 35,
  E'1. Finhacka lök, vitlök och morot. Fräs mjukt i olivolja i en stor gryta.\n2. Höj värmen och bryn färsen tills den fått fin färg.\n3. Rör i tomatpuré och stek en minut, tillsätt sedan krossade tomater. Låt sjuda 20–30 minuter på låg värme.\n4. Koka spaghettin al dente. Smaka av såsen med salt, peppar och basilika. Servera såsen över pastan.',
  '[{"n":"Nöt färs rå fett 10%","g":500},{"n":"Tomat krossad konserv. m. lag","g":800},{"n":"Tomatpuré konc. konserv.","g":50},{"n":"Lök gul","g":120},{"n":"Morot","g":100},{"n":"Vitlök","g":10},{"n":"Olivolja","g":15},{"n":"Basilika färsk","g":10},{"n":"Pasta okokt","g":320}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Margheritapizza', 2, false,
  ARRAY['middag','italienskt','vegetariskt'], 90, 12,
  E'1. Lös upp jästen i ca 2 dl ljummet vatten. Rör i mjöl, olivolja och salt till en smidig deg. Låt jäsa övertäckt ca 1 timme.\n2. Sätt ugnen på högsta värme (250–275°C).\n3. Kavla ut degen tunt. Bred på ett tunt lager tomatpuré utrört med lite vatten, och fördela mozzarellan.\n4. Grädda 10–12 minuter tills botten är krispig. Toppa med färsk basilika.',
  '[{"n":"Vetemjöl","g":300},{"n":"Jäst färsk","g":15},{"n":"Olivolja","g":20},{"n":"Tomatpuré konc. konserv.","g":80},{"n":"Ost mozzarella fett 18%","g":150},{"n":"Basilika färsk","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Yoghurt med jordgubbar och müsli', 1, false,
  ARRAY['frukost','snabbt','vegetariskt'], 5, 0,
  E'1. Häll yoghurten i en skål.\n2. Skiva jordgubbarna och lägg ovanpå.\n3. Toppa med havregryn och ringla över honung.',
  '[{"n":"Yoghurt naturell fett 3% berikad","g":200},{"n":"Jordgubbar","g":100},{"n":"Havregryn fullkorn","g":30},{"n":"Honung","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Jordnötssmörmacka med banan', 1, false,
  ARRAY['frukost','mellanmål','vegetariskt'], 5, 0,
  E'1. Bred jordnötssmör på brödet.\n2. Skiva bananen och lägg ovanpå.\n3. Strö gärna över lite kanel.',
  '[{"n":"Bröd fullkorn råg fibrer ca 7%","g":70},{"n":"Jordnötssmör","g":25},{"n":"Banan","g":100},{"n":"Kanel","g":1}]'::jsonb
);

-- ── PREMIUM (6) ────────────────────────────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Kycklingpizza med paprika', 2, true,
  ARRAY['middag','högprotein'], 90, 15,
  E'1. Lös upp jästen i ljummet vatten, rör ihop deg med mjöl, olivolja och salt. Låt jäsa ca 1 timme.\n2. Stek strimlad kyckling i rapsolja tills genomstekt.\n3. Kavla ut degen, bred på tomatpuré, fördela mozzarella, kyckling och strimlad paprika.\n4. Grädda i 250°C ca 12–15 minuter tills gyllene.',
  '[{"n":"Vetemjöl","g":300},{"n":"Jäst färsk","g":15},{"n":"Olivolja","g":20},{"n":"Tomatpuré konc. konserv.","g":80},{"n":"Ost mozzarella fett 18%","g":125},{"n":"Kyckling bröstfilé rå u. skinn","g":200},{"n":"Paprika röd","g":120},{"n":"Rapsolja","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Krämig pasta carbonara', 2, true,
  ARRAY['middag','italienskt','snabbt'], 5, 15,
  E'1. Koka spaghettin al dente.\n2. Tärna baconet och stek knaprigt.\n3. Vispa ihop ägg med riven ost och grädde. Salta och peppra.\n4. Blanda den varma pastan med baconet, ta av värmen och rör snabbt i äggblandningen så den blir krämig men inte stelnar. Servera direkt.',
  '[{"n":"Pasta okokt","g":180},{"n":"Gris bacon rå","g":120},{"n":"Ägg rått","g":110},{"n":"Ost hårdost fett 28%","g":50},{"n":"Vispgrädde fett 40%","g":50}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Amerikanska pannkakor med jordgubbar', 2, true,
  ARRAY['frukost','helg','vegetariskt'], 10, 15,
  E'1. Vispa ihop mjöl, ägg och mjölk till en slät smet. Låt vila 5 minuter.\n2. Stek små tjocka pannkakor i smör på medelvärme, ca 1–2 minuter per sida.\n3. Toppa med skivade jordgubbar och en skvätt honung.',
  '[{"n":"Vetemjöl","g":150},{"n":"Ägg rått","g":110},{"n":"Mellanmjölk fett 1,5% berikad","g":200},{"n":"Smör fett 80%","g":15},{"n":"Jordgubbar","g":150},{"n":"Honung","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Äggröra med bacon', 1, true,
  ARRAY['frukost','högprotein'], 5, 8,
  E'1. Stek baconet knaprigt i en panna, ta upp.\n2. Vispa äggen lätt med salt och peppar.\n3. Häll äggen i pannan på medelvärme och rör försiktigt tills de stannar men fortfarande är krämiga.\n4. Servera äggröran med baconet vid sidan.',
  '[{"n":"Ägg rått","g":165},{"n":"Gris bacon rå","g":60},{"n":"Smör fett 80%","g":5}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Proteingröt med jordgubbar', 1, true,
  ARRAY['frukost','högprotein','vegetariskt'], 3, 6,
  E'1. Koka havregrynen med mjölken under omrörning, ca 4 minuter.\n2. Ta av från värmen och rör ner kvargen för extra protein och krämighet.\n3. Toppa med jordgubbar och ringla över honung.',
  '[{"n":"Havregryn fullkorn","g":60},{"n":"Mellanmjölk fett 1,5% berikad","g":200},{"n":"Kvarg naturell fett 0,2%","g":100},{"n":"Jordgubbar","g":100},{"n":"Honung","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Lasagne', 4, true,
  ARRAY['middag','italienskt','storkok'], 25, 45,
  E'1. Gör en köttfärssås: fräs lök, vitlök och morot, bryn färsen, tillsätt tomatpuré och krossade tomater. Sjud 20 minuter.\n2. Rör ihop en enkel ostsås av matlagningsgrädde och riven ost.\n3. Varva köttfärssås, lasagneplattor och ostsås i en form, avsluta med ost.\n4. Grädda i 200°C ca 40–45 minuter tills gyllene och genomvarm.',
  '[{"n":"Nöt färs rå fett 10%","g":500},{"n":"Tomat krossad konserv. m. lag","g":400},{"n":"Tomatpuré konc. konserv.","g":50},{"n":"Lök gul","g":100},{"n":"Morot","g":100},{"n":"Vitlök","g":10},{"n":"Pasta okokt","g":200},{"n":"Matlagningsgrädde fett 15%","g":300},{"n":"Ost hårdost fett 28%","g":100},{"n":"Olivolja","g":15}]'::jsonb
);
