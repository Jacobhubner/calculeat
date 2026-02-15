export type Gender = 'male' | 'female'

/** Result from barcode lookup or nutrition label scan */
export interface ScanResult {
  name: string | null
  calories: number
  protein_g: number | null
  carb_g: number | null
  fat_g: number | null
  default_amount: number // alltid 100
  default_unit: string // alltid 'g'
}

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

export interface TDEECalculationSnapshot {
  weight_kg?: number
  height_cm?: number
  age?: number
  gender?: Gender
  body_fat_percentage?: number
  bmr_formula?: BMRFormula
  pal_system?: PALSystem
  activity_level?: ActivityLevel
  intensity_level?: IntensityLevel
  training_frequency_per_week?: number
  training_duration_minutes?: number
  daily_steps?: DailySteps
  custom_pal?: number
  // Beräkna din aktivitetsnivå fields
  training_activity_id?: string
  training_days_per_week?: number
  training_minutes_per_session?: number
  walking_activity_id?: string
  steps_per_day?: number
  hours_standing_per_day?: number
  household_activity_id?: string
  household_hours_per_day?: number
  spa_factor?: number
  calorie_goal?: CalorieGoal
  deficit_level?: DeficitLevel
  calculated_bmr?: number
  calculated_tdee?: number
  note?: string
}

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
  // Beräkna din aktivitetsnivå fields
  training_activity_id?: string
  training_days_per_week?: number
  training_minutes_per_session?: number
  walking_activity_id?: string
  steps_per_day?: number
  hours_standing_per_day?: number
  household_activity_id?: string
  household_hours_per_day?: number
  spa_factor?: number

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

  // TDEE metadata (tracking when and how TDEE was calculated)
  tdee_calculated_at?: string // ISO timestamp
  tdee_source?: 'manual' | 'tdee_calculator_tool' | 'profile_form' | 'legacy'
  tdee_calculation_snapshot?: TDEECalculationSnapshot

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
  // Beräkna din aktivitetsnivå fields
  training_activity_id?: string
  training_days_per_week?: number
  training_minutes_per_session?: number
  walking_activity_id?: string
  steps_per_day?: number
  hours_standing_per_day?: number
  household_activity_id?: string
  household_hours_per_day?: number
  spa_factor?: number

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
  initial_weight_kg?: number // Startvikt när TDEE först beräknades/angavs

  // BMR & TDEE calculations
  bmr_formula?: BMRFormula
  pal_system?: PALSystem
  activity_level?: ActivityLevel
  intensity_level?: IntensityLevel
  training_frequency_per_week?: number
  training_duration_minutes?: number
  daily_steps?: DailySteps
  custom_pal?: number
  // Beräkna din aktivitetsnivå fields
  training_activity_id?: string
  training_days_per_week?: number
  training_minutes_per_session?: number
  walking_activity_id?: string
  steps_per_day?: number
  hours_standing_per_day?: number
  household_activity_id?: string
  household_hours_per_day?: number
  spa_factor?: number

  // Body composition
  body_fat_percentage?: number
  body_composition_method?: BodyCompositionMethod

  // Calculated values
  bmr?: number
  tdee?: number
  calories_min?: number
  calories_max?: number

  // TDEE metadata (tracking when and how TDEE was calculated)
  tdee_calculated_at?: string // ISO timestamp
  tdee_source?: 'manual' | 'tdee_calculator_tool' | 'profile_form' | 'legacy'
  tdee_calculation_snapshot?: TDEECalculationSnapshot

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

  // Color category targets (percentage of daily calories)
  // Based on energy density: green (<1 kcal/g), yellow (1-2.4 kcal/g), orange (>2.4 kcal/g)
  color_green_percent?: number // Default: 0.30 (30%)
  color_yellow_percent?: number // Default: 0.45 (45%)
  color_orange_percent?: number // Default: 0.25 (25%)

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

  // Color category targets (percentage of daily calories)
  color_green_percent?: number
  color_yellow_percent?: number
  color_orange_percent?: number

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

// Weight history type for tracking weight changes over time
// Note: Changed from profile_id to user_id - weight history is now shared across all profile cards
export interface WeightHistory {
  id: string
  user_id: string
  weight_kg: number
  recorded_at: string
  notes?: string
  created_at: string
}

// Weight cluster for calibration (averaged group of measurements)
export interface WeightCluster {
  weights: number[]
  dates: Date[]
  average: number
  count: number
  spanDays: number
}

// Calibration confidence level
export interface CalibrationConfidence {
  level: 'high' | 'standard' | 'low'
  startClusterSize: number
  endClusterSize: number
  foodLogCompleteness: number
  periodDays: number
}

// Warning from calibration validation
export interface CalibrationWarning {
  type:
    | 'timing_inconsistency'
    | 'target_calories_fallback'
    | 'low_confidence'
    | 'large_adjustment'
    | 'glycogen_event'
    | 'high_cv'
    | 'outlier_removed'
    | 'low_signal'
    | 'selective_logging'
    | 'large_deficit'
  message: string
}

// Full calibration result from the calculation module
export interface CalibrationResult {
  startCluster: WeightCluster
  endCluster: WeightCluster
  weightChangeKg: number
  actualDays: number
  averageCalories: number
  calorieSource: 'food_log' | 'target_calories' | 'blended'
  foodLogCompleteness: number
  foodLogWeight: number
  currentTDEE: number
  rawTDEE: number
  clampedTDEE: number
  adjustmentPercent: number
  maxAllowedAdjustmentPercent: number
  wasLimited: boolean
  confidence: CalibrationConfidence
  warnings: CalibrationWarning[]
  isStableMaintenance: boolean
  coefficientOfVariation: number
  dataQuality: {
    score: number
    label: string
    maxAbsoluteAdjustment: number
    factors: {
      logScore: number
      freqScore: number
      timingScore: number
      clusterScore: number
    }
  }
}

// Calibration history type for tracking TDEE calibrations
export interface CalibrationHistory {
  id: string
  profile_id: string
  calibrated_at: string
  time_period_days: 14 | 21 | 28
  start_weight_kg: number
  end_weight_kg: number
  weight_change_kg: number
  target_calories: number
  actual_calories_avg: number | null
  used_food_log: boolean
  days_with_log_data: number
  previous_tdee: number
  calculated_tdee: number
  applied_tdee: number
  was_limited: boolean
  start_cluster_size: number
  end_cluster_size: number
  confidence_level: 'high' | 'standard' | 'low'
  calorie_source: 'food_log' | 'target_calories' | 'blended'
  max_allowed_adjustment_percent: number
  coefficient_of_variation: number
  warnings: string[]
  smoothed_tdee: number | null
  is_reverted: boolean
  food_log_weight: number | null
  data_quality_index: number | null
  created_at: string
}

// Weight chart data point for enhanced weight tracking
export interface WeightChartDataPoint {
  date: string
  weight: number
  rollingAverage: number | null
  displayDate: string
  isPending?: boolean
  isCalibrationEvent?: boolean
}

// Weight trend data for projections and statistics
export interface WeightTrendData {
  sevenDayAverage: number | null
  fourteenDayAverage: number | null
  weeklyChangeKg: number | null
  weeklyChangePercent: number | null
  projectedGoalDate: Date | null
  weeksToGoal: number | null
  progressPercent: number | null
  totalChangeKg: number
  chartDataWithTrend: WeightChartDataPoint[]
}

// Calibration availability status
export interface CalibrationAvailability {
  isAvailable: boolean
  isRecommended: boolean
  reason: string
  minDataPoints: number
  currentDataPoints: number
  daysSinceLastCalibration: number | null
  weightTrend: 'stable' | 'gaining' | 'losing' | 'erratic' | 'insufficient_data'
  suggestedTimePeriod: 14 | 21 | 28
  confidencePreview: 'high' | 'standard' | 'low' | 'unknown'
}

// Actual calorie intake data from food logs
export interface ActualIntakeData {
  averageCalories: number | null
  daysWithData: number
  totalDays: number
  completenessPercent: number
  dailyCalories: Array<{
    date: string
    calories: number
    isComplete: boolean
  }>
}
