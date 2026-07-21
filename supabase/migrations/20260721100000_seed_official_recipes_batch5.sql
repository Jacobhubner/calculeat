-- =========================================================
-- MIGRATION: Seed receptbanken — batch 5 (10 originalrecept)
-- Date: 2026-07-21
-- Tema: mer svensk husmanskost + desserter. Samma pg_temp-pipeline som
-- batch 1-4, exakt SLV-namnmatchning, idempotent. 4 gratis + 6 premium.
-- Totalt i banken efter denna: 50 recept.
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

-- ── GRATIS (4) — husmanskost ───────────────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Ugnsbakad torsk med potatis och dillsås', 3, false,
  ARRAY['middag','husman','fisk','högprotein'], 10, 25,
  E'1. Sätt ugnen på 200°C och koka potatisen.\n2. Lägg torskfilén i en smord form, salta och peppra. Baka 15–20 minuter tills fisken är genomvit.\n3. Smält smöret, rör i mjöl och späd med mjölk till en vit sås. Rör ner hackad dill.\n4. Servera torsken med potatis och dillsås.',
  '[{"n":"Torsk rå","g":450},{"n":"Potatis höst rå","g":500},{"n":"Smör fett 80%","g":30},{"n":"Vetemjöl","g":20},{"n":"Mellanmjölk fett 1,5% berikad","g":300},{"n":"Dill färsk","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Blodpudding med lingon', 2, false,
  ARRAY['middag','husman','klassiker','snabbt'], 5, 10,
  E'1. Skiva blodpuddingen.\n2. Stek skivorna i smör tills de fått fin yta på båda sidor.\n3. Servera med lingonsylt.',
  '[{"n":"Blodpudding blodkorv fett 10%","g":300},{"n":"Smör fett 80%","g":15},{"n":"Lingonsylt","g":80}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Makaronipudding med ägg', 4, false,
  ARRAY['middag','husman','budget','barn'], 10, 30,
  E'1. Koka makaronerna och lägg i en smord ugnsform.\n2. Vispa ihop ägg och mjölk, salta lätt.\n3. Häll äggstanningen över makaronerna.\n4. Grädda i 175°C ca 25–30 minuter tills stanningen satt sig. Servera gärna med ketchup.',
  '[{"n":"Pasta okokt","g":300},{"n":"Ägg rått","g":220},{"n":"Mellanmjölk fett 1,5% berikad","g":500},{"n":"Ketchup","g":40}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Stekt sej med kokt potatis', 3, false,
  ARRAY['middag','husman','fisk','högprotein'], 10, 15,
  E'1. Koka potatisen.\n2. Salta sejfilén och vänd den i lite mjöl.\n3. Stek i smör tills gyllene och genomstekt, ca 3 minuter per sida.\n4. Servera med potatis och citron.',
  '[{"n":"Sej rå","g":450},{"n":"Potatis höst rå","g":500},{"n":"Vetemjöl","g":20},{"n":"Smör fett 80%","g":25}]'::jsonb
);

-- ── PREMIUM (6) — 2 husman + 4 dessert ─────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Ryggbiff med bearnaisesås och potatis', 2, true,
  ARRAY['middag','husman','högprotein','lyx'], 10, 20,
  E'1. Koka eller ugnsrosta potatisen.\n2. Låt köttet bli rumstempererat. Salta och peppra.\n3. Stek biffarna hårt ca 2–3 minuter per sida för rosa kärna. Låt vila några minuter.\n4. Servera med potatis och bearnaisesås.',
  '[{"n":"Nöt ryggbiff rå","g":300},{"n":"Potatis höst rå","g":400},{"n":"Bearnaisesås hemlagad","g":100},{"n":"Smör fett 80%","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Stuvad vitkål med korv', 3, true,
  ARRAY['middag','husman','budget'], 10, 25,
  E'1. Strimla vitkålen och fräs mjuk i smör.\n2. Pudra över mjöl, rör om och späd med mjölk till en stuvning. Låt sjuda 10 minuter. Salta och peppra.\n3. Stek den skivade falukorven gyllene.\n4. Servera korven med den stuvade vitkålen.',
  '[{"n":"Vitkål","g":500},{"n":"Korv falukorv kött 58%","g":300},{"n":"Smör fett 80%","g":20},{"n":"Vetemjöl","g":20},{"n":"Mellanmjölk fett 1,5% berikad","g":300}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Kladdkaka', 10, true,
  ARRAY['dessert','fika','vegetariskt'], 10, 18,
  E'1. Sätt ugnen på 175°C. Smält smöret.\n2. Vispa ägg och socker, rör ner smält smör, mjöl och kakao till en slät smet.\n3. Häll i en smord form och grädda 15–18 minuter — mitten ska förbli kladdig.\n4. Låt svalna. Servera gärna med vispad grädde.',
  '[{"n":"Smör fett 80%","g":150},{"n":"Socker","g":250},{"n":"Ägg rått","g":110},{"n":"Vetemjöl","g":120},{"n":"Kakaopulver fett 10-15%","g":40}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Frasvåfflor med sylt och grädde', 4, true,
  ARRAY['dessert','fika','vegetariskt','helg'], 10, 20,
  E'1. Vispa ihop mjöl med hälften av mjölken till en slät smet, rör i resten av mjölken och det smälta smöret.\n2. Låt smeten svälla 10 minuter.\n3. Grädda våfflor i ett hett våffeljärn tills gyllene och frasiga.\n4. Servera med sylt och vispad grädde.',
  '[{"n":"Vetemjöl","g":200},{"n":"Mellanmjölk fett 1,5% berikad","g":400},{"n":"Smör fett 80%","g":75},{"n":"Jordgubbssylt","g":100},{"n":"Vispgrädde fett 40%","g":150}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Jordgubbar med grädde', 2, true,
  ARRAY['dessert','sommar','vegetariskt','snabbt'], 5, 0,
  E'1. Skölj och dela jordgubbarna.\n2. Vispa grädden fluffig med en aning socker.\n3. Fördela jordgubbarna i skålar och toppa med grädden.',
  '[{"n":"Jordgubbar","g":300},{"n":"Vispgrädde fett 40%","g":150},{"n":"Socker","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Chokladmousse', 4, true,
  ARRAY['dessert','vegetariskt'], 20, 0,
  E'1. Smält den mörka chokladen försiktigt över vattenbad, låt svalna något.\n2. Vispa grädden fluffig.\n3. Rör äggulorna i chokladen. Vänd sedan ner grädden luftigt.\n4. Fördela i glas och låt stelna i kylen minst 2 timmar.',
  '[{"n":"Mörk choklad kakao 70%","g":150},{"n":"Vispgrädde fett 40%","g":250},{"n":"Ägg rått","g":55},{"n":"Socker","g":30}]'::jsonb
);
