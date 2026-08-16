-- Bringa den gamla `profiles`-skuggkopian i linje med sanningen.
--
-- Triggern skriver inte längre över user_profiles (se föregående migration),
-- men de inaktuella värdena bör ändå städas: de är en fälla för framtida
-- flöden som råkar läsa därifrån, och gör felsökning missvisande.
--
-- Riktningen är entydig: user_profiles.updated_at är nyare än
-- profiles.updated_at för SAMTLIGA divergerande rader.
--
-- Rör bara aktiva, icke-preview-profiler. Preview-rader raderas ändå av
-- exit_preview_profile.
UPDATE public.profiles p
SET
  weight_kg           = up.weight_kg,
  height_cm           = up.height_cm,
  gender              = up.gender,
  birth_date          = up.birth_date,
  body_fat_percentage = up.body_fat_percentage,
  bmr                 = up.bmr,
  tdee                = up.tdee,
  calories_min        = up.calories_min,
  calories_max        = up.calories_max,
  calorie_goal        = up.calorie_goal,
  deficit_level       = up.deficit_level,
  custom_tdee         = up.custom_tdee,
  activity_level      = up.activity_level,
  bmr_formula         = up.bmr_formula,
  pal_system          = up.pal_system,
  intensity_level     = up.intensity_level,
  custom_pal          = up.custom_pal,
  body_composition_method = up.body_composition_method,
  fat_min_percent     = up.fat_min_percent,
  fat_max_percent     = up.fat_max_percent,
  carb_min_percent    = up.carb_min_percent,
  carb_max_percent    = up.carb_max_percent,
  protein_min_percent = up.protein_min_percent,
  protein_max_percent = up.protein_max_percent
FROM public.user_profiles up
WHERE up.id = p.user_id
  AND p.is_active = true
  AND coalesce(p.is_preview, false) = false;
