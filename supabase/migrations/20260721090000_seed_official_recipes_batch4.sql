-- =========================================================
-- MIGRATION: Seed receptbanken — batch 4 (10 originalrecept)
-- Date: 2026-07-21
-- Tema: svensk husmanskost + desserter (önskat av användaren).
-- Samma pg_temp-pipeline som batch 1-3, exakt SLV-namnmatchning, idempotent.
-- 4 gratis + 6 premium. Totalt i banken efter denna: 40 recept.
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
  'Köttbullar med potatismos och lingon', 4, false,
  ARRAY['middag','husman','klassiker'], 20, 25,
  E'1. Blanda färsen med ströbröd, ägg, hackad lök och en skvätt mjölk. Salta och peppra. Rulla bullar.\n2. Stek köttbullarna gyllene runt om.\n3. Koka potatisen mjuk, mosa med mjölk och smör till ett slätt mos.\n4. Servera köttbullar med potatismos och lingonsylt.',
  '[{"n":"Nöt färs rå fett 10%","g":500},{"n":"Ströbröd malt hårt bröd fullkorn vete råg socker fibrer ca 5%","g":40},{"n":"Ägg rått","g":55},{"n":"Lök gul","g":80},{"n":"Mellanmjölk fett 1,5% berikad","g":100},{"n":"Potatis höst rå","g":700},{"n":"Smör fett 80%","g":30},{"n":"Lingonsylt","g":60}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Korv stroganoff med ris', 4, false,
  ARRAY['middag','husman','snabbt'], 10, 20,
  E'1. Koka riset enligt förpackningen.\n2. Skiva falukorven i stavar och stek gyllene i olja.\n3. Fräs hackad lök mjuk, rör i tomatpuré och stek en minut.\n4. Häll i grädde och krossade tomater, lägg i korven och låt sjuda 10 minuter. Servera med riset.',
  '[{"n":"Korv falukorv kött 58%","g":400},{"n":"Ris jasmin okokt","g":240},{"n":"Lök gul","g":100},{"n":"Tomatpuré konc. konserv.","g":40},{"n":"Vispgrädde fett 40%","g":150},{"n":"Tomat krossad konserv. m. lag","g":200},{"n":"Rapsolja","g":15}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Pannkakor', 4, false,
  ARRAY['middag','husman','vegetariskt','barn'], 10, 20,
  E'1. Vispa ihop mjöl med hälften av mjölken till en slät smet. Rör i resten av mjölken, äggen och en nypa salt.\n2. Låt smeten vila 10 minuter.\n3. Stek tunna pannkakor i smör på medelhög värme, ca 1 minut per sida.\n4. Servera med sylt.',
  '[{"n":"Vetemjöl","g":250},{"n":"Mellanmjölk fett 1,5% berikad","g":600},{"n":"Ägg rått","g":165},{"n":"Smör fett 80%","g":30},{"n":"Jordgubbssylt","g":80}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Raggmunk med fläsk och lingon', 3, false,
  ARRAY['middag','husman','klassiker'], 15, 20,
  E'1. Riv potatisen grovt. Blanda med mjöl, ägg och mjölk till en tjock smet. Salta.\n2. Stek baconet knaprigt, ta upp.\n3. Stek raggmunkarna i baconfettet + lite smör tills gyllene på båda sidor.\n4. Servera med det stekta fläsket och lingonsylt.',
  '[{"n":"Potatis höst rå","g":600},{"n":"Vetemjöl","g":80},{"n":"Ägg rått","g":110},{"n":"Mellanmjölk fett 1,5% berikad","g":250},{"n":"Gris bacon rå","g":150},{"n":"Smör fett 80%","g":20},{"n":"Lingonsylt","g":60}]'::jsonb
);

-- ── PREMIUM (6) — 3 husman + 3 dessert ─────────────────────────────────

SELECT pg_temp.seed_official_recipe(
  'Fläskkotlett med gräddsås och potatis', 2, true,
  ARRAY['middag','husman','högprotein'], 10, 25,
  E'1. Koka potatisen.\n2. Salta och peppra kotletterna, stek dem gyllene och genomstekta i smör. Ta upp.\n3. Häll grädde i stekpannan, koka ihop med stekskyn till en sås. Smaka av.\n4. Servera kotletterna med potatis och gräddsås.',
  '[{"n":"Fläskkotlett panerad stekt","g":300},{"n":"Potatis höst rå","g":400},{"n":"Vispgrädde fett 40%","g":150},{"n":"Smör fett 80%","g":20}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Pytt i panna med stekt ägg', 2, true,
  ARRAY['middag','husman','snabbt'], 10, 20,
  E'1. Tärna potatis, lök och falukorv i små bitar.\n2. Stek potatisen gyllene i olja, tillsätt lök och korv och stek tills allt fått fin färg. Salta och peppra.\n3. Stek äggen med rinnande gula.\n4. Lägg upp pytten och toppa med ett stekt ägg per portion.',
  '[{"n":"Potatis höst rå","g":500},{"n":"Korv falukorv kött 58%","g":200},{"n":"Lök gul","g":100},{"n":"Ägg rått","g":110},{"n":"Rapsolja","g":20}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Prinskorv med potatismos', 2, true,
  ARRAY['middag','husman','barn','snabbt'], 5, 20,
  E'1. Koka potatisen mjuk.\n2. Stek prinskorven gyllene.\n3. Mosa potatisen med mjölk och smör till ett slätt mos. Salta.\n4. Servera korven med moset och en klick ketchup.',
  '[{"n":"Korv prinskorv kött 61%","g":250},{"n":"Potatis höst rå","g":400},{"n":"Mellanmjölk fett 1,5% berikad","g":80},{"n":"Smör fett 80%","g":20},{"n":"Ketchup","g":30}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Risgrynsgröt', 4, true,
  ARRAY['dessert','husman','vegetariskt','barn'], 5, 40,
  E'1. Koka grötriset i lite vatten några minuter tills vattnet sugits upp.\n2. Tillsätt mjölken och koka på låg värme under omrörning ca 30–40 minuter tills gröten är krämig.\n3. Rör i lite socker och salt.\n4. Servera med kanel och socker.',
  '[{"n":"Ris grötris rundkornigt okokt","g":200},{"n":"Mellanmjölk fett 1,5% berikad","g":1000},{"n":"Socker","g":20},{"n":"Kanel","g":3}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Chokladbollar', 12, true,
  ARRAY['dessert','fika','vegetariskt','barn'], 15, 0,
  E'1. Blanda havregryn, socker, kakao och vaniljsocker.\n2. Rör i det mjuka smöret och en skvätt kallt kaffe eller vatten till en smidig smet.\n3. Rulla bollar och rulla dem i kokosflingor.\n4. Låt stå kallt en stund innan servering.',
  '[{"n":"Havregryn fullkorn","g":300},{"n":"Socker","g":150},{"n":"Smör fett 80%","g":150},{"n":"Kakaopulver fett 10-15%","g":40},{"n":"Kokosflingor","g":50}]'::jsonb
);

SELECT pg_temp.seed_official_recipe(
  'Äppelkaka med vaniljsås', 6, true,
  ARRAY['dessert','fika','vegetariskt'], 20, 30,
  E'1. Sätt ugnen på 200°C. Skala och skiva äpplena, lägg i en smord form och strö över lite kanel.\n2. Smält smöret. Vispa ägg och socker pösigt, rör ner smält smör, mjöl och bakpulver.\n3. Bred smeten över äpplena och grädda 25–30 minuter tills gyllene.\n4. Servera ljummen med vaniljsås.',
  '[{"n":"Äpple m. skal","g":400},{"n":"Vetemjöl","g":150},{"n":"Socker","g":150},{"n":"Smör fett 80%","g":100},{"n":"Ägg rått","g":110},{"n":"Bakpulver","g":5},{"n":"Kanel","g":3},{"n":"Vaniljsås ätf.","g":300}]'::jsonb
);
