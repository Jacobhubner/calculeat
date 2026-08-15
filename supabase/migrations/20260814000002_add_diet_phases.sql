-- =========================================================
-- MIGRATION: Faser (cut / bulk / maintenance / reverse diet)
-- Date: 2026-08-14
--
-- BAKGRUND
-- profiles.calorie_goal är ett riktningsval ('Weight loss' | 'Weight gain' |
-- 'Maintain weight' | 'Custom TDEE') utan tidslinje, historik eller
-- övergångslogik. Det räcker inte för det som faktiskt efterfrågas:
-- separata mål per fas, guidade fasbyten och strukturerad reverse diet.
--
-- MODELL — fas som objekt, calorie_goal som spegel
-- diet_phases äger sanningen (typ, start, planerad längd, kalori- och
-- proteinmål). Den AKTIVA fasen speglas ned till profiles.calorie_goal och
-- deficit_level via trigger, så att befintlig kod — profilformulär,
-- TDEE-verktyget, målkalkylatorn, makrolägen, MetabolicCalibration — kan
-- fortsätta läsa calorie_goal utan att röras. Ingen cutover, ingen
-- storskalig omskrivning; UI:t kan flyttas över fas för fas.
--
-- EN AKTIV FAS I TAGET: partiellt unikt index på (user_id) WHERE
-- ended_at IS NULL. Att avsluta en fas = sätta ended_at, aldrig DELETE —
-- historiken är poängen med modellen.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.diet_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  phase_type text NOT NULL CHECK (phase_type IN ('cut', 'bulk', 'maintenance', 'reverse')),

  started_at date NOT NULL DEFAULT CURRENT_DATE,
  /** NULL = pågående fas. Avslutade faser behålls som historik. */
  ended_at date,

  /** Planerad längd i veckor. NULL = tills vidare (vanligt för maintenance). */
  planned_weeks integer CHECK (planned_weeks IS NULL OR planned_weeks BETWEEN 1 AND 104),

  /** Kalorimål för fasen. Sätts vid start från TDEE och fasens natur. */
  target_calories integer CHECK (target_calories IS NULL OR target_calories BETWEEN 800 AND 8000),

  /**
   * Proteinmål i g/kg kroppsvikt. Detta är skälet till att fasen behövs:
   * proteinbehovet är högre under cut (muskelbevarande i underskott) än
   * under bulk. Dagens macros.ts härleder protein från AKTIVITETSNIVÅ,
   * inte fas — fasen ger den saknade dimensionen.
   */
  protein_g_per_kg numeric(4,2) CHECK (protein_g_per_kg IS NULL OR protein_g_per_kg BETWEEN 0.5 AND 4.0),

  /** Vikt vid fasstart — gör det möjligt att utvärdera fasen i efterhand. */
  start_weight_kg numeric(5,2) CHECK (start_weight_kg IS NULL OR start_weight_kg BETWEEN 20 AND 400),

  /** Reverse diet: hur mycket kalorimålet trappas upp per vecka. */
  weekly_calorie_step integer CHECK (weekly_calorie_step IS NULL OR weekly_calorie_step BETWEEN 0 AND 500),

  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),

  /** Preview-sandlådan: raderas av exit_preview_profile, se nedan. */
  is_preview boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT diet_phases_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- En aktiv fas per användare och läge (skarpt/preview).
CREATE UNIQUE INDEX IF NOT EXISTS diet_phases_one_active_per_user
  ON public.diet_phases (user_id, is_preview)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_diet_phases_user_started
  ON public.diet_phases (user_id, is_preview, started_at DESC);

ALTER TABLE public.diet_phases ENABLE ROW LEVEL SECURITY;

-- KRITISK REGEL: ny tabell ⇒ block_anonymous_users-policy
CREATE POLICY "block_anonymous_users" ON public.diet_phases
  AS RESTRICTIVE FOR ALL
  USING ((SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)) IS FALSE);

CREATE POLICY "Users can view own diet phases" ON public.diet_phases
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own diet phases" ON public.diet_phases
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own diet phases" ON public.diet_phases
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own diet phases" ON public.diet_phases
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ── updated_at ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_diet_phases_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_diet_phases_updated_at ON public.diet_phases;
CREATE TRIGGER trg_diet_phases_updated_at
  BEFORE UPDATE ON public.diet_phases
  FOR EACH ROW EXECUTE FUNCTION public.touch_diet_phases_updated_at();

-- ── Spegling till profiles.calorie_goal ──────────────────────────────────
-- Håller den gamla modellen i synk med den nya så att befintlig kod
-- fortsätter fungera oförändrad. Endast SKARPA faser (is_preview = false)
-- speglas — preview har sin egen profilrad som ändå återställs vid exit.
--
-- Mappning:
--   cut         → 'Weight loss'    (deficit_level lämnas orörd: användarens val)
--   bulk        → 'Weight gain'
--   maintenance → 'Maintain weight'
--   reverse     → 'Maintain weight' (upptrappning MOT maintenance; kalorimålet
--                                    styrs av fasens target_calories, inte av
--                                    ett procentuellt underskott)
CREATE OR REPLACE FUNCTION public.sync_calorie_goal_from_phase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal text;
BEGIN
  IF NEW.is_preview THEN
    RETURN NEW;
  END IF;

  -- Bara den aktiva fasen styr profilen. En avslutad fas lämnar
  -- calorie_goal orört — nästa fas sätter det när den startas.
  IF NEW.ended_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_goal := CASE NEW.phase_type
    WHEN 'cut'         THEN 'Weight loss'
    WHEN 'bulk'        THEN 'Weight gain'
    WHEN 'maintenance' THEN 'Maintain weight'
    WHEN 'reverse'     THEN 'Maintain weight'
  END;

  UPDATE public.profiles
     SET calorie_goal = v_goal
   WHERE user_id = NEW.user_id
     AND profile_name <> '__preview__';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_calorie_goal_from_phase ON public.diet_phases;
CREATE TRIGGER trg_sync_calorie_goal_from_phase
  AFTER INSERT OR UPDATE OF phase_type, ended_at ON public.diet_phases
  FOR EACH ROW EXECUTE FUNCTION public.sync_calorie_goal_from_phase();

-- ── RPC: starta en ny fas och avsluta den föregående atomärt ─────────────
-- Utan detta blir "byt fas" två anrop från klienten, och ett avbrott
-- mellan dem lämnar användaren antingen utan aktiv fas eller med två.
CREATE OR REPLACE FUNCTION public.start_diet_phase(
  p_phase_type text,
  p_planned_weeks integer DEFAULT NULL,
  p_target_calories integer DEFAULT NULL,
  p_protein_g_per_kg numeric DEFAULT NULL,
  p_weekly_calorie_step integer DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_preview boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_weight numeric;
  v_new_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_phase_type NOT IN ('cut', 'bulk', 'maintenance', 'reverse') THEN
    RAISE EXCEPTION 'invalid_phase_type';
  END IF;

  -- Avsluta pågående fas i samma läge (skarpt/preview)
  UPDATE public.diet_phases
     SET ended_at = CURRENT_DATE
   WHERE user_id = v_user
     AND is_preview = p_is_preview
     AND ended_at IS NULL;

  -- Startvikt: senaste vägningen i rätt läge, annars profilens vikt
  SELECT weight_kg INTO v_weight
    FROM public.weight_history
   WHERE user_id = v_user AND is_preview = p_is_preview
   ORDER BY recorded_at DESC
   LIMIT 1;

  IF v_weight IS NULL THEN
    SELECT weight_kg INTO v_weight FROM public.profiles
     WHERE user_id = v_user
     ORDER BY is_active DESC
     LIMIT 1;
  END IF;

  INSERT INTO public.diet_phases (
    user_id, phase_type, planned_weeks, target_calories,
    protein_g_per_kg, weekly_calorie_step, notes, start_weight_kg, is_preview
  ) VALUES (
    v_user, p_phase_type, p_planned_weeks, p_target_calories,
    p_protein_g_per_kg, p_weekly_calorie_step, p_notes, v_weight, p_is_preview
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_diet_phase(text, integer, integer, numeric, integer, text, boolean) TO authenticated;

COMMENT ON FUNCTION public.start_diet_phase IS
  'Avslutar pågående fas och startar en ny i samma transaktion. Startvikt '
  'hämtas från senaste vägningen. Returnerar den nya fasens id.';

-- ── Preview-städning ─────────────────────────────────────────────────────
-- exit_preview_profile återskapas i sin helhet med diet_phases tillagd.
-- Övrig kropp är oförändrad från 20260726120000_preview_user_meal_settings.
CREATE OR REPLACE FUNCTION public.exit_preview_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id        uuid := auth.uid();
  v_preview_id     uuid;
  v_old_profile_id uuid;
  v_backup         jsonb;
BEGIN
  SELECT active_profile_id, preview_backup_profile_id, preview_user_profiles_backup
  INTO v_preview_id, v_old_profile_id, v_backup
  FROM user_profiles WHERE id = v_user_id;

  IF v_old_profile_id IS NULL THEN RETURN; END IF;

  DELETE FROM daily_logs          WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM meal_entries        WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM weight_history      WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM calibration_history WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM food_items          WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM user_meal_settings  WHERE user_id = v_user_id AND is_preview = true;
  DELETE FROM diet_phases         WHERE user_id = v_user_id AND is_preview = true;

  IF v_backup IS NOT NULL THEN
    UPDATE user_profiles
    SET
      profile_name                 = (v_backup->>'profile_name'),
      weight_kg                    = (v_backup->>'weight_kg')::numeric,
      height_cm                    = (v_backup->>'height_cm')::numeric::integer,
      gender                       = (v_backup->>'gender'),
      birth_date                   = (v_backup->>'birth_date')::date,
      body_fat_percentage          = (v_backup->>'body_fat_percentage')::numeric,
      bmr                          = (v_backup->>'bmr')::numeric,
      tdee                         = (v_backup->>'tdee')::numeric::integer,
      calories_min                 = (v_backup->>'calories_min')::numeric,
      calories_max                 = (v_backup->>'calories_max')::numeric,
      bmr_formula                  = (v_backup->>'bmr_formula'),
      activity_level               = (v_backup->>'activity_level'),
      pal_system                   = (v_backup->>'pal_system'),
      intensity_level              = (v_backup->>'intensity_level'),
      training_frequency_per_week  = (v_backup->>'training_frequency_per_week')::numeric,
      training_duration_minutes    = (v_backup->>'training_duration_minutes')::numeric,
      daily_steps                  = (v_backup->>'daily_steps'),
      custom_pal                   = (v_backup->>'custom_pal')::numeric,
      calorie_goal                 = (v_backup->>'calorie_goal'),
      deficit_level                = (v_backup->>'deficit_level'),
      custom_tdee                  = (v_backup->>'custom_tdee')::numeric,
      body_composition_method      = (v_backup->>'body_composition_method'),
      fat_min_percent              = (v_backup->>'fat_min_percent')::numeric,
      fat_max_percent              = (v_backup->>'fat_max_percent')::numeric,
      carb_min_percent             = (v_backup->>'carb_min_percent')::numeric,
      carb_max_percent             = (v_backup->>'carb_max_percent')::numeric,
      protein_min_percent          = (v_backup->>'protein_min_percent')::numeric,
      protein_max_percent          = (v_backup->>'protein_max_percent')::numeric,
      training_activity_id         = (v_backup->>'training_activity_id'),
      training_days_per_week       = (v_backup->>'training_days_per_week')::numeric::integer,
      training_minutes_per_session = (v_backup->>'training_minutes_per_session')::numeric::integer,
      walking_activity_id          = (v_backup->>'walking_activity_id'),
      steps_per_day                = (v_backup->>'steps_per_day')::numeric::integer,
      hours_standing_per_day       = (v_backup->>'hours_standing_per_day')::numeric,
      household_activity_id        = (v_backup->>'household_activity_id'),
      household_hours_per_day      = (v_backup->>'household_hours_per_day')::numeric,
      spa_factor                   = (v_backup->>'spa_factor')::numeric,
      tdee_source                  = (v_backup->>'tdee_source'),
      tdee_calculated_at           = (v_backup->>'tdee_calculated_at')::timestamptz,
      tdee_calculation_snapshot    = (v_backup->'tdee_calculation_snapshot'),
      target_weight_kg             = (v_backup->>'target_weight_kg')::numeric,
      initial_weight_kg            = (v_backup->>'initial_weight_kg')::numeric,
      meals_config                 = (v_backup->'meals_config'),
      active_profile_id            = v_old_profile_id,
      preview_backup_profile_id    = NULL,
      preview_user_profiles_backup = NULL
    WHERE id = v_user_id;
  ELSE
    UPDATE user_profiles
    SET active_profile_id         = v_old_profile_id,
        preview_backup_profile_id = NULL
    WHERE id = v_user_id;
  END IF;

  DELETE FROM profiles
  WHERE id = v_preview_id AND profile_name = '__preview__';
END;
$function$;
