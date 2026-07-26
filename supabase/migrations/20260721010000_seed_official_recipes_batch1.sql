-- =========================================================
-- MIGRATION: Seed receptbanken — batch 1 (10 originalrecept)
-- Date: 2026-07-21
-- Alla ingredienser refererar globala Livsmedelsverket-livsmedel
-- (user_id IS NULL) via EXAKT namnmatchning — hjälparen failar högljutt
-- om en ingrediens saknas (hellre stoppa än fel näringsdata).
-- Foljeslagar-food_item: user_id=NULL (global lasbar), is_recipe=true
-- (filtreras ur livsmedelsflikarna), naringsvarde per 100 g + per portion
-- beraknat fran ingredienserna (samma logik som appens receptkalkylator,
-- inkl. fargtrosklarna Solid <1 Gron, <=2.4 Gul, annars Orange).
-- Recepten ags av superadminen. Idempotent via namn-guard.
-- Instruktionstexterna ar originaltext skriven for Calculeat.
-- =========================================================

CREATE FUNCTION pg_temp.seed_official_recipe(
  p_name text,
  p_servings int,
  p_premium boolean,
  p_tags text[],
  p_prep int,
  p_cook int,
  p_instructions text,
  p_ings jsonb  -- [{"n": "Exakt SLV-namn", "g": gram}, ...]
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_admin uuid;
  v_ing jsonb;
  v_fi record;
  v_w numeric;
  v_tot_w numeric := 0;
  v_tot_kcal numeric := 0;
  v_tot_fat numeric := 0;
  v_tot_carb numeric := 0;
  v_tot_prot numeric := 0;
  v_food_id uuid := gen_random_uuid();
  v_recipe_id uuid := gen_random_uuid();
  v_order int := 0;
  v_kpg numeric;
  v_color text;
BEGIN
  SELECT user_id INTO v_admin FROM public.admins WHERE is_super_admin = true LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'seed: ingen superadmin hittad'; END IF;

  -- Idempotens: hoppa over om receptet redan finns
  IF EXISTS (SELECT 1 FROM public.recipes WHERE user_id = v_admin AND name = p_name) THEN
    RAISE NOTICE 'seed: "%" finns redan — hoppar over', p_name;
    RETURN;
  END IF;

  -- Summera naring fran ingredienserna (per-100g-varden i food_items)
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

  -- Foljeslagar-food_item (samma faltlogik som appens per-portion-format)
  INSERT INTO public.food_items (
    id, user_id, source, name, is_recipe, default_amount, default_unit,
    calories, fat_g, carb_g, protein_g, weight_grams, kcal_per_gram,
    energy_density_color, food_type, grams_per_piece, serving_unit,
    kcal_per_unit, fat_per_unit, carb_per_unit, protein_per_unit
  ) VALUES (
    v_food_id, NULL, 'manual', p_name, true, 1, 'portion',
    ROUND(v_tot_kcal / v_tot_w * 100, 1),
    ROUND(v_tot_fat  / v_tot_w * 100, 1),
    ROUND(v_tot_carb / v_tot_w * 100, 1),
    ROUND(v_tot_prot / v_tot_w * 100, 1),
    ROUND(v_tot_w / p_servings, 1),
    ROUND(v_kpg, 3),
    v_color, 'Solid',
    ROUND(v_tot_w / p_servings, 1), 'portion',
    ROUND(v_tot_kcal / p_servings, 1),
    ROUND(v_tot_fat  / p_servings, 1),
    ROUND(v_tot_carb / p_servings, 1),
    ROUND(v_tot_prot / p_servings, 1)
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
  'Overnight oats med blåbär', 1, false,
  ARRAY['frukost','vegetariskt'], 5, 0,
  E'1. Blanda havregryn, mjölk och kvarg i en burk med lock.\n2. Rör om, toppa med blåbär och ringla över honung.\n3. Låt stå i kylen över natten (minst 4 timmar). Ät kall direkt ur burken.',
  '[{"n":"Havregryn fullkorn","g":50},{"n":"Mellanmjölk fett 1,5% berikad","g":150},{"n":"Kvarg naturell fett 0,2%","g":100},{"n":"Blåbär","g":75},{"n":"Honung","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Krämig tonfiskpasta', 2, false,
  ARRAY['lunch','snabbt','högprotein'], 5, 15,
  E'1. Koka pastan enligt anvisning på förpackningen.\n2. Finhacka löken och fräs den mjuk i olivolja.\n3. Rör ner crème fraiche, avrunnen tonfisk och majs. Låt sjuda 2–3 minuter.\n4. Blanda såsen med den nykokta pastan. Smaka av med salt och svartpeppar.',
  '[{"n":"Pasta okokt","g":160},{"n":"Tonfisk i vatten konserv. avrunnen","g":140},{"n":"Crème fraiche lätt fett 13%","g":150},{"n":"Majskorn konserv. u. lag","g":100},{"n":"Lök gul","g":60},{"n":"Olivolja","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Klassisk köttfärssås med pasta', 4, false,
  ARRAY['middag','klassiker'], 10, 30,
  E'1. Finhacka lök, vitlök och morot. Fräs mjukt i olivolja i en stor kastrull.\n2. Höj värmen, lägg i färsen och bryn tills den fått färg.\n3. Tillsätt krossade tomater. Låt sjuda under lock 20–30 minuter.\n4. Koka pastan enligt förpackningen. Smaka av såsen med salt, peppar och gärna en nypa socker.',
  '[{"n":"Nöt färs rå fett 10%","g":500},{"n":"Tomat krossad konserv. m. lag","g":800},{"n":"Lök gul","g":120},{"n":"Morot","g":100},{"n":"Vitlök","g":10},{"n":"Olivolja","g":15},{"n":"Pasta okokt","g":320}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Äggmacka med avokado', 1, false,
  ARRAY['frukost','mellanmål','vegetariskt'], 10, 0,
  E'1. Koka äggen 8–10 minuter, spola kalla och skala.\n2. Mosa avokadon med en gaffel, salta och peppra.\n3. Bred avokadomoset på brödet och toppa med skivade ägg.',
  '[{"n":"Ägg rått","g":110},{"n":"Avokado","g":70},{"n":"Bröd fullkorn råg fibrer ca 7%","g":70}]'::jsonb
);

-- ── PREMIUM (6) ────────────────────────────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Kycklingwok med jasminris', 2, true,
  ARRAY['middag','högprotein'], 15, 15,
  E'1. Koka riset enligt förpackningen.\n2. Strimla kycklingen och skär grönsakerna i bitar.\n3. Hetta upp rapsolja i wok. Woka kycklingen tills genomstekt, lägg åt sidan.\n4. Woka broccoli, paprika och vitlök 2–3 minuter. Lägg tillbaka kycklingen, häll i sojan och låt fräsa ihop en minut. Servera med riset.',
  '[{"n":"Kyckling bröstfilé rå u. skinn","g":300},{"n":"Ris jasmin okokt","g":140},{"n":"Broccoli","g":150},{"n":"Paprika röd","g":120},{"n":"Sojasås","g":30},{"n":"Rapsolja","g":15},{"n":"Vitlök","g":10}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Ugnsbakad lax med potatis och broccoli', 2, true,
  ARRAY['middag','fisk','högprotein'], 10, 25,
  E'1. Sätt ugnen på 200°C. Koka potatisen.\n2. Lägg laxen i en smord form, salta och peppra. Baka i ugnen 15–20 minuter.\n3. Ångkoka eller koka broccolin de sista minuterna.\n4. Servera laxen med potatis, broccoli och en klick smör.',
  '[{"n":"Lax odlad Norge fjordlax rå","g":250},{"n":"Potatis höst rå","g":400},{"n":"Broccoli","g":200},{"n":"Smör fett 80%","g":20}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Proteinpannkakor med banan', 1, true,
  ARRAY['frukost','högprotein'], 5, 10,
  E'1. Mosa bananen och vispa ihop med ägg, havregryn och kvarg till en smet.\n2. Låt smeten svälla 5 minuter.\n3. Stek små pannkakor i rapsolja på medelvärme, ca 2 minuter per sida.',
  '[{"n":"Ägg rått","g":110},{"n":"Havregryn fullkorn","g":40},{"n":"Kvarg naturell fett 0,2%","g":100},{"n":"Banan","g":100},{"n":"Rapsolja","g":5}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Kikärtsgryta med kokosmjölk', 3, true,
  ARRAY['middag','vegetariskt'], 10, 25,
  E'1. Koka riset enligt förpackningen.\n2. Fräs hackad lök och vitlök i rapsolja tills mjuka.\n3. Tillsätt kikärtor, krossade tomater och kokosmjölk. Låt sjuda 15 minuter.\n4. Smaka av med salt, peppar och gärna curry eller spiskummin. Servera med riset.',
  '[{"n":"Kikärtor konserv. u. lag","g":400},{"n":"Tomat krossad konserv. m. lag","g":400},{"n":"Kokosmjölk fett ca 24%","g":200},{"n":"Lök gul","g":100},{"n":"Vitlök","g":10},{"n":"Rapsolja","g":10},{"n":"Ris jasmin okokt","g":180}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Kvargbowl med hallon och honung', 1, true,
  ARRAY['mellanmål','högprotein','vegetariskt'], 5, 0,
  E'1. Lägg kvargen i en skål.\n2. Toppa med hallon och havregryn.\n3. Ringla över honung och servera direkt.',
  '[{"n":"Kvarg naturell fett 0,2%","g":250},{"n":"Hallon","g":100},{"n":"Honung","g":15},{"n":"Havregryn fullkorn","g":20}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Krämig laxpasta', 2, true,
  ARRAY['middag','fisk'], 10, 20,
  E'1. Koka pastan enligt förpackningen.\n2. Skär laxen i kuber. Fräs hackad lök mjuk i olivolja, lägg i laxen och stek några minuter.\n3. Rör ner crème fraiche och låt sjuda 3–4 minuter tills laxen är genomstekt.\n4. Blanda med pastan och smaka av med salt, peppar och citron.',
  '[{"n":"Pasta okokt","g":160},{"n":"Lax odlad Norge fjordlax rå","g":200},{"n":"Crème fraiche lätt fett 13%","g":150},{"n":"Lök gul","g":50},{"n":"Olivolja","g":10}]'::jsonb
);
