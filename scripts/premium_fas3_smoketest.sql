-- =========================================================
-- FAS 3-RÖKTEST: premium-kvoter på DB-nivå
-- Kör i Supabase SQL Editor. Självstädande: alla testrader
-- (prenumeration, måltider, recept, listor) tas bort i slutet.
-- Kräver: migration 20260712000000 (+ 20260713000000 för
-- admin_set_user_plan-varianten, men detta test skriver raden direkt).
--
-- Förväntat resultat: alla rader = PASS.
-- =========================================================

CREATE TEMP TABLE IF NOT EXISTS _fas3_results (step text, outcome text);
TRUNCATE _fas3_results;

DO $$
DECLARE
  v_user  uuid;
  v_i     int;
  v_plan  text;
  v_list  uuid;
  v_msg   text;
BEGIN
  -- ── Setup: välj en icke-admin-användare utan prenumerationsrad ──
  SELECT u.id INTO v_user
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = u.id)
    AND NOT EXISTS (SELECT 1 FROM public.user_subscriptions s WHERE s.user_id = u.id)
  ORDER BY u.created_at DESC
  LIMIT 1;

  IF v_user IS NULL THEN
    INSERT INTO _fas3_results VALUES ('setup', 'FAIL: ingen lämplig testanvändare (icke-admin utan sub-rad)');
    RETURN;
  END IF;

  -- Forcerad free-rad (märkt så cleanup hittar den)
  INSERT INTO public.user_subscriptions (user_id, plan, status, source, note)
  VALUES (v_user, 'free', 'active', 'manual', 'FAS3-SMOKETEST');

  -- ── Test 1: plan-upplösning ──
  v_plan := public.get_user_plan(v_user);
  INSERT INTO _fas3_results VALUES
    ('1. forcerad free-plan', CASE WHEN v_plan = 'free' THEN 'PASS' ELSE 'FAIL: ' || v_plan END);

  -- ── Test 2: saved_meals-kvot (10 ok, 11:e stoppas) ──
  BEGIN
    FOR v_i IN 1..10 LOOP
      INSERT INTO public.saved_meals (user_id, name)
      VALUES (v_user, 'FAS3-SMOKETEST-' || v_i);
    END LOOP;
    INSERT INTO _fas3_results VALUES ('2a. 10 måltider under kvot', 'PASS');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _fas3_results VALUES ('2a. 10 måltider under kvot', 'FAIL: ' || SQLERRM);
  END;

  BEGIN
    INSERT INTO public.saved_meals (user_id, name) VALUES (v_user, 'FAS3-SMOKETEST-11');
    INSERT INTO _fas3_results VALUES ('2b. 11:e måltiden stoppas', 'FAIL: insert gick igenom');
  EXCEPTION WHEN OTHERS THEN
    v_msg := SQLERRM;
    INSERT INTO _fas3_results VALUES
      ('2b. 11:e måltiden stoppas',
       CASE WHEN v_msg LIKE '%PREMIUM_LIMIT_REACHED:saved_meals%' THEN 'PASS' ELSE 'FAIL: ' || v_msg END);
  END;

  -- ── Test 3: recipes-kvot (befintliga + nya ≤ 3, nästa stoppas) ──
  -- Obs: räknar användarens befintliga personliga recept och fyller upp till 3.
  DECLARE
    v_existing int;
  BEGIN
    SELECT count(*) INTO v_existing
    FROM public.recipes WHERE user_id = v_user AND shared_list_id IS NULL;

    IF v_existing >= 3 THEN
      INSERT INTO _fas3_results VALUES ('3a. fyll receptkvot', 'PASS (redan ' || v_existing || ' recept)');
    ELSE
      FOR v_i IN 1..(3 - v_existing) LOOP
        INSERT INTO public.recipes (user_id, name)
        VALUES (v_user, 'FAS3-SMOKETEST-' || v_i);
      END LOOP;
      INSERT INTO _fas3_results VALUES ('3a. fyll receptkvot', 'PASS');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _fas3_results VALUES ('3a. fyll receptkvot', 'FAIL: ' || SQLERRM);
  END;

  BEGIN
    INSERT INTO public.recipes (user_id, name) VALUES (v_user, 'FAS3-SMOKETEST-4');
    INSERT INTO _fas3_results VALUES ('3b. 4:e receptet stoppas', 'FAIL: insert gick igenom');
  EXCEPTION WHEN OTHERS THEN
    v_msg := SQLERRM;
    INSERT INTO _fas3_results VALUES
      ('3b. 4:e receptet stoppas',
       CASE WHEN v_msg LIKE '%PREMIUM_LIMIT_REACHED:recipes%' THEN 'PASS' ELSE 'FAIL: ' || v_msg END);
  END;

  -- ── Test 4: shared_lists-kvot (1 skapad-och-medlem, 2:a stoppas) ──
  BEGIN
    INSERT INTO public.shared_lists (name, created_by)
    VALUES ('FAS3-SMOKETEST-1', v_user)
    RETURNING id INTO v_list;
    INSERT INTO public.shared_list_members (shared_list_id, user_id)
    VALUES (v_list, v_user);
    INSERT INTO _fas3_results VALUES ('4a. första listan under kvot', 'PASS');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _fas3_results VALUES ('4a. första listan under kvot', 'FAIL: ' || SQLERRM);
  END;

  BEGIN
    INSERT INTO public.shared_lists (name, created_by) VALUES ('FAS3-SMOKETEST-2', v_user);
    INSERT INTO _fas3_results VALUES ('4b. andra listan stoppas', 'FAIL: insert gick igenom');
  EXCEPTION WHEN OTHERS THEN
    v_msg := SQLERRM;
    INSERT INTO _fas3_results VALUES
      ('4b. andra listan stoppas',
       CASE WHEN v_msg LIKE '%PREMIUM_LIMIT_REACHED:owned_shared_lists%' THEN 'PASS' ELSE 'FAIL: ' || v_msg END);
  END;

  -- ── Test 5: founder-rad öppnar kvoten igen ──
  BEGIN
    UPDATE public.user_subscriptions SET plan = 'founder'
    WHERE user_id = v_user AND note = 'FAS3-SMOKETEST';
    INSERT INTO public.saved_meals (user_id, name) VALUES (v_user, 'FAS3-SMOKETEST-11');
    INSERT INTO _fas3_results VALUES ('5. founder passerar kvoten', 'PASS');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _fas3_results VALUES ('5. founder passerar kvoten', 'FAIL: ' || SQLERRM);
  END;

  -- ── Cleanup: ta bort ALLA testrader ──
  DELETE FROM public.saved_meals  WHERE user_id = v_user AND name LIKE 'FAS3-SMOKETEST%';
  DELETE FROM public.recipes      WHERE user_id = v_user AND name LIKE 'FAS3-SMOKETEST%';
  DELETE FROM public.shared_lists WHERE created_by = v_user AND name LIKE 'FAS3-SMOKETEST%';
  DELETE FROM public.user_subscriptions WHERE user_id = v_user AND note = 'FAS3-SMOKETEST';
  INSERT INTO _fas3_results VALUES ('6. cleanup', 'PASS — alla testrader borttagna');
END;
$$;

SELECT * FROM _fas3_results;
