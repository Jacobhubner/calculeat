export type Gender = 'male' | 'female'

// All 10 BMR formulas from Excel
export type BMRFormula =
  | 'Mifflin-St Jeor equation'
  | 'Cunningham equation'
  | 'Oxford/Henry equation'
  | 'Schofield equation'
  | 'Revised Harris-Benedict equation'
  | 'Original Harris-Benedict equation'
  | 'MacroFactor standard equation'
  | 'MacroFactor FFM equation'
  | 'MacroFactor athlete equation'
  | 'Fitness Stuff Podcast equation'

// All 6 PAL systems from Excel
export type PALSystem =
  | 'FAO/WHO/UNU based PAL values'
  | 'DAMNRIPPED PAL values'
  | 'Pro Physique PAL values'
  | 'Fitness Stuff PAL values'
  | 'Basic internet PAL values'
  | 'Custom PAL'

export type ActivityLevel =
  | 'Sedentary'
  | 'Lightly active'
  | 'Moderately active'
  | 'Very active'
  | 'Extremely active'

export type IntensityLevel = 'None' | 'Light' | 'Moderate' | 'Difficult' | 'Intense'

export type DailySteps =
  | '3 000 – 4 999 steps/day'
  | '5 000 – 6 999 steps/day'
  | '7 000 – 8 999 steps/day'
  | '9 000 – 10 999 steps/day'
  | '11 000 – 12 999 steps/day'
  | '≥ 13 000 steps/day'

export type CalorieGoal = 'Maintain weight' | 'Weight gain' | 'Weight loss' | 'Custom TDEE'

export type DeficitLevel = '10-15%' | '20-25%' | '25-30%'

// All 12 body composition methods from Excel
export type BodyCompositionMethod =
  | 'Jackson/Pollock 3 Caliper Method (Male)'
  | 'Jackson/Pollock 3 Caliper Method (Female)'
  | 'Jackson/Pollock 4 Caliper Method'
  | 'Jackson/Pollock 7 Caliper Method'
  | 'Durnin/Womersley Caliper Method'
  | 'Parillo Caliper Method'
  | 'Covert Bailey Measuring Tape Method'
  | 'U.S. Navy Body Fat Formula'
  | 'YMCA Measuring Tape Method'
  | 'Modified YMCA Measuring Tape Method'
  | 'Heritage BMI to Body Fat Method'
  | 'Reversed Cunningham equation'

export interface UserProfile {
  id: string
  email: string
  profile_name?: string
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number

  // BMR & TDEE calculations
  bmr_formula?: BMRFormula
  pal_system?: PALSystem
  activity_level?: ActivityLevel
  intensity_level?: IntensityLevel
  training_frequency_per_week?: number
  training_duration_minutes?: number
  daily_steps?: DailySteps
  custom_pal?: number

  // Body composition
  body_fat_percentage?: number
  body_composition_method?: BodyCompositionMethod

  // Goals
  calorie_goal?: CalorieGoal
  deficit_level?: DeficitLevel
  custom_tdee?: number
  target_weight_kg?: number
  target_body_fat_percentage?: number

  // Calculated values
  bmr?: number
  tdee?: number
  calories_min?: number
  calories_max?: number

  // Macro preferences
  fat_min_percent?: number
  fat_max_percent?: number
  carb_min_percent?: number
  carb_max_percent?: number
  protein_min_percent?: number
  protein_max_percent?: number

  created_at?: string
  updated_at?: string
  display_order?: number // User-controlled sort order
}

export interface UserProfileFormData {
  profile_name?: string
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number

  // BMR & TDEE
  bmr_formula?: BMRFormula
  pal_system?: PALSystem
  activity_level?: ActivityLevel
  intensity_level?: IntensityLevel
  training_frequency_per_week?: number
  training_duration_minutes?: number
  daily_steps?: DailySteps
  custom_pal?: number

  // Body composition
  body_fat_percentage?: number
  body_composition_method?: BodyCompositionMethod

  // Goals
  calorie_goal?: CalorieGoal
  deficit_level?: DeficitLevel
  custom_tdee?: number
  target_weight_kg?: number
  target_body_fat_percentage?: number

  // Macros
  fat_min_percent?: number
  fat_max_percent?: number
  carb_min_percent?: number
  carb_max_percent?: number
  protein_min_percent?: number
  protein_max_percent?: number
}

// Profile type for multiple profiles feature
export interface Profile {
  id: string
  user_id: string
  profile_name: string
  is_active: boolean

  // Personal information
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number

  // BMR & TDEE calculations
  bmr_formula?: BMRFormula
  pal_system?: PALSystem
  activity_level?: ActivityLevel
  intensity_level?: IntensityLevel
  training_frequency_per_week?: number
  training_duration_minutes?: number
  daily_steps?: DailySteps
  custom_pal?: number

  // Body composition
  body_fat_percentage?: number
  body_composition_method?: BodyCompositionMethod

  // Calculated values
  bmr?: number
  tdee?: number
  calories_min?: number
  calories_max?: number

  // Goals
  calorie_goal?: CalorieGoal
  deficit_level?: DeficitLevel
  custom_tdee?: number
  target_weight_kg?: number
  target_body_fat_percentage?: number

  // Macro preferences
  fat_min_percent?: number
  fat_max_percent?: number
  carb_min_percent?: number
  carb_max_percent?: number
  protein_min_percent?: number
  protein_max_percent?: number

  // Meal configuration
  meals_config?: {
    meals: Array<{
      name: string
      percentage: number
    }>
  }

  // Timestamps
  created_at?: string
  updated_at?: string
}

// Form data for creating/updating profiles
export interface ProfileFormData {
  profile_name: string
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number

  // BMR & TDEE
  bmr_formula?: BMRFormula
  pal_system?: PALSystem
  activity_level?: ActivityLevel
  intensity_level?: IntensityLevel
  training_frequency_per_week?: number
  training_duration_minutes?: number
  daily_steps?: DailySteps
  custom_pal?: number

  // Body composition
  body_fat_percentage?: number
  body_composition_method?: BodyCompositionMethod

  // Goals
  calorie_goal?: CalorieGoal
  deficit_level?: DeficitLevel
  custom_tdee?: number
  target_weight_kg?: number
  target_body_fat_percentage?: number

  // Calculated values
  bmr?: number
  tdee?: number

  // Macro preferences
  fat_min_percent?: number
  fat_max_percent?: number
  carb_min_percent?: number
  carb_max_percent?: number
  protein_min_percent?: number
  protein_max_percent?: number

  // Meal configuration
  meals_config?: {
    meals: Array<{
      name: string
      percentage: number
    }>
  }
}

// Measurement set type for body composition measurements
export interface MeasurementSet {
  id: string
  user_id: string
  set_date: string // YYYY-MM-DD format
  created_at: string
  name?: string // Optional custom name (if NULL, display "date - time" as default)
  display_order?: number // User-controlled sort order

  // Caliper measurements (mm)
  chest?: number
  abdominal?: number
  thigh?: number
  tricep?: number
  subscapular?: number
  suprailiac?: number
  midaxillary?: number
  bicep?: number
  lower_back?: number
  calf?: number

  // Tape measurements (cm)
  neck?: number
  waist?: number
  hip?: number
  wrist?: number
  ankle?: number
  forearm?: number
  thigh_circ?: number
  calf_circ?: number
}
