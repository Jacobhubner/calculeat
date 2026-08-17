-- SÄKERHETSFIX: funktionen saknade behörighetskontroll.
--
-- Den är SECURITY DEFINER och skriver ett GLOBALT livsmedel (user_id = NULL)
-- som alla användare ser. Kontrollen fanns bara i gränssnittet, som döljer
-- knappen för icke-admins — men RPC:n gick att anropa direkt. Verifierat
-- 2026-08-17: en vanlig användare kunde lägga till i den globala listan.
--
-- Samma fälla som RLS-läckan i message_attachments: en spärr i UI:t är ingen
-- spärr. Kontrollen måste ligga där skrivningen sker.
CREATE OR REPLACE FUNCTION public.copy_food_item_to_calculeat(p_food_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source food_items%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = (SELECT auth.uid())
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_admin');
  END IF;

  SELECT * INTO v_source FROM food_items WHERE id = p_food_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM food_items
    WHERE user_id IS NULL AND source = 'manual' AND lower(name) = lower(v_source.name)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_exists');
  END IF;

  INSERT INTO food_items (
    name, calories, fat_g, carb_g, protein_g,
    default_amount, default_unit, weight_grams,
    food_type, barcode, grams_per_piece, serving_unit,
    density_g_per_ml, ml_per_gram, reference_amount, reference_unit,
    notes, source, user_id
  )
  SELECT
    name, calories, fat_g, carb_g, protein_g,
    default_amount, default_unit, weight_grams,
    food_type, barcode, grams_per_piece, serving_unit,
    density_g_per_ml, ml_per_gram, reference_amount, reference_unit,
    notes, 'manual', NULL
  FROM food_items WHERE id = p_food_item_id
  RETURNING id INTO v_new_id;

  INSERT INTO food_nutrients (food_item_id, nutrient_code, amount, unit, reference_amount, reference_unit)
  SELECT v_new_id, nutrient_code, amount, unit, reference_amount, reference_unit
  FROM food_nutrients WHERE food_item_id = p_food_item_id;

  RETURN jsonb_build_object('success', true, 'new_food_item_id', v_new_id);
END;
$$;

-- DROP behövs inte (samma signatur), men GRANT:en måste vara intakt:
-- PostgREST ansluter som 'authenticator' och behöver PUBLIC-granten.
GRANT EXECUTE ON FUNCTION public.copy_food_item_to_calculeat(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.copy_food_item_to_calculeat(uuid) TO authenticated;
