export type Gender = 'male' | 'female'

/** Result from barcode lookup or nutrition label scan */
export interface ScanResult {
  name: string | null
  calories: number
  protein_g: number | null
  carb_g: number | null
  fat_g: number | null
  saturated_fat_g?: number | null
  sugars_g?: number | null
  salt_g?: number | null
  fiber_g?: number | null
  default_amount: number // alltid 100
  default_unit: string // 'g' eller 'ml' beroende på etikett
  food_type?: 'Solid' | 'Liquid' | 'Soup'
  serving_unit?: string | null
  grams_per_piece?: number | null
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
  | 'Beräkna din aktivitetsnivå'

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
  /** BMR uppskattad med Mifflin vid manuell TDEE-inmatning (ej beräknad av användaren) */
  estimated_bmr?: number
  estimated_bmr_formula?: string
}

export interface UserProfile {
  id: string
  email: string
  username?: string
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
  tdee_source?:
    | 'manual'
    | 'tdee_calculator_tool'
    | 'profile_form'
    | 'legacy'
    | 'metabolic_calibration'
  tdee_calculation_snapshot?: TDEECalculationSnapshot

  // Macro preferences
  fat_min_percent?: number
  fat_max_percent?: number
  carb_min_percent?: number
  carb_max_percent?: number
  protein_min_percent?: number
  protein_max_percent?: number

  // Meal configuration
  meals_config?: {
    meals?: Array<{ name: string; percentage: number }>
  } | null

  created_at?: string
  updated_at?: string
  display_order?: number // User-controlled sort order
  active_profile_id?: string
  preview_backup_profile_id?: string | null
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
  show_energy_density?: boolean
  /**
   * 'manual' = användaren trycker "Avsluta dag" själv.
   * 'auto'   = öppna loggar från tidigare dagar stängs när appen öppnas.
   * Låg tidigare bara i localStorage och följde därför inte med mellan enheter.
   */
  day_completion_mode?: 'manual' | 'auto'
  /**
   * IANA-tidszon ('Europe/Stockholm') som dygnet räknas efter. Sätts automatiskt
   * från enheten första gången; ändras därefter bara efter användarens samtycke,
   * så att en resa inte tyst flyttar dygnsgränsen mitt i en pågående dag.
   */
  timezone?: string

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
  tdee_source?:
    | 'manual'
    | 'tdee_calculator_tool'
    | 'profile_form'
    | 'legacy'
    | 'metabolic_calibration'
  tdee_calculation_snapshot?: TDEECalculationSnapshot

  /**
   * Antal skarpa kalibreringar genom tiderna. Sätts av databastrigger och
   * minskas aldrig — radering av kalibreringshistorik får inte nollställa
   * gratisnivåns kvot. Preview-kalibreringar räknas inte.
   */
  lifetime_calibration_count?: number

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
  day_completion_mode?: 'manual' | 'auto'
  timezone?: string
  birth_date?: string
  gender?: Gender
  height_cm?: number
  weight_kg?: number
  initial_weight_kg?: number

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
  /**
   * null = rensa fältet. useUpdateProfile strippar `undefined` (så att en
   * utelämnad nyckel inte skriver över befintligt värde) — den som VILL tömma
   * fältet måste därför skicka null explicit.
   */
  body_fat_percentage?: number | null
  body_composition_method?: BodyCompositionMethod | null

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
  tdee_calculated_at?: string
  tdee_source?:
    | 'manual'
    | 'tdee_calculator_tool'
    | 'profile_form'
    | 'legacy'
    | 'metabolic_calibration'
  tdee_calculation_snapshot?: TDEECalculationSnapshot

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

  // Display preferences
  show_energy_density?: boolean

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

  // Body weight at time of measurement
  weight_kg?: number | null

  // Caliper measurements (mm) — nullable to allow explicit DB clearing
  chest?: number | null
  abdominal?: number | null
  thigh?: number | null
  tricep?: number | null
  subscapular?: number | null
  suprailiac?: number | null
  midaxillary?: number | null
  bicep?: number | null
  lower_back?: number | null
  calf?: number | null

  // Tape measurements (cm) — nullable to allow explicit DB clearing
  neck?: number | null
  waist?: number | null
  hip?: number | null
  wrist?: number | null
  ankle?: number | null
  forearm?: number | null
  thigh_circ?: number | null
  calf_circ?: number | null
}

// Weight history type for tracking weight changes over time
// Note: Changed from profile_id to user_id - weight history is now shared across all profile cards
export interface WeightHistory {
  id: string
  user_id: string
  weight_kg: number
  recorded_at: string
  notes?: string
  body_fat_percentage?: number
  created_at: string
}

/**
 * Fastyp. 'reverse' = strukturerad upptrappning efter avslutad cut, där
 * kalorimålet höjs stegvis mot beräknat TDEE istället för i ett hopp.
 */
export type DietPhaseType = 'cut' | 'bulk' | 'maintenance' | 'reverse'

/**
 * Fokusspår — styr både fasernas namn och vilket kostläge de pekar mot.
 * 'strength' = maximera muskeluppbyggnad (gymspråk, atletlägen),
 * 'health'   = hälsa och balans (allmänspråk, NNR/viktminskning).
 */
export type PhaseFocus = 'strength' | 'health'

/**
 * En fas i användarens planering. Till skillnad från profiles.calorie_goal
 * (ett riktningsval utan tidslinje) har fasen start, planerad längd, egna
 * mål och bevaras som historik när den avslutas.
 *
 * Den aktiva fasen (ended_at === null) speglas till profiles.calorie_goal
 * via databastrigger, så befintlig kod som läser calorie_goal fortsätter
 * fungera oförändrad.
 */
export interface DietPhase {
  id: string
  user_id: string
  phase_type: DietPhaseType
  /**
   * Fokusspåret fasen startades i. Avgör vilket namn som visas och vilket
   * kostläge fasen pekar mot — måste sparas, annars byter en pågående fas
   * namn om användaren senare väljer ett annat fokus.
   */
  focus: PhaseFocus
  /** ISO-datum (YYYY-MM-DD) */
  started_at: string
  /** null = pågående fas */
  ended_at: string | null
  planned_weeks?: number | null
  target_calories?: number | null
  /** Proteinmål i g per kg kroppsvikt */
  protein_g_per_kg?: number | null
  start_weight_kg?: number | null
  /** Reverse diet: kalorihöjning per vecka */
  weekly_calorie_step?: number | null
  /**
   * Underskottsdjup, endast för cut. NULL för övriga fastyper — de har
   * inget underskott att gradera. Speglas till profilernas deficit_level av
   * triggern sync_calorie_goal_from_phase, som också reagerar på ändringar.
   */
  deficit_level?: DeficitLevel | null
  /**
   * Datum då nivån senast ändrades under pågående period. NULL = orörd.
   * phaseTracking håller uppföljningen i 'too_early' tio dagar efter bytet,
   * eftersom den förväntade takten annars räknas retroaktivt på hela
   * perioden med den nya nivån.
   */
  deficit_level_changed_at?: string | null
  notes?: string | null
  is_preview: boolean
  created_at: string
  updated_at: string
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
  degradeReasons: Array<
    'low_cluster_size' | 'sparse_coverage' | 'nonlinear_trend' | 'sparse_food_log'
  >
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
    | 'nonlinear_trend'
    | 'high_cv'
    | 'outlier_removed'
    | 'low_signal'
    | 'selective_logging'
    | 'weekday_bias'
    | 'underreporting'
    | 'large_deficit'
  message: string
}

// Full calibration result from the calculation module
export interface CalibrationResult {
  startCluster: WeightCluster
  endCluster: WeightCluster
  weightChangeKg: number
  actualDays: number
  /** Det värde som faktiskt användes i beräkningen (loggat blandat med mål) */
  averageCalories: number
  /** Loggat dagssnitt, oblandat. null när inget loggats. */
  loggedCaloriesAvg: number | null
  /**
   * Användarens kalorimål under perioden, oblandat.
   *
   * Sparas separat från loggedCaloriesAvg för att skillnaden dem emellan är
   * den enda signal vi har på underrapportering: loggar användaren
   * systematiskt under sitt mål samtidigt som vikten inte följer med, är
   * loggen sannolikt ofullständig.
   */
  targetCaloriesUsed: number
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
      clusterScore: number
    }
  }
  /** Standard error of TDEE estimate (kcal), propagated from OLS weight uncertainty + calorie variance */
  tdeeSE: number
  /** 90% confidence interval lower bound for rawTDEE (kcal) */
  tdeeLower90: number
  /** 90% confidence interval upper bound for rawTDEE (kcal) */
  tdeeUpper90: number
  /** Measurements filtered out as outliers (IQR method) */
  filteredOutliers: Array<{ weight_kg: number; recorded_at: Date }>
  /** Which factors reduced the clamp ceiling */
  clampFactors: {
    lowSignal: boolean
    lowConfidence: boolean
    largeDeficit: boolean
    dqiWasBindingCap: boolean
  }
}

// Calibration history type for tracking TDEE calibrations
export interface CalibrationHistory {
  id: string
  user_id: string
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
  timestamp: number
  weight: number
  rollingAverage: number | null
  displayDate: string
  isPending?: boolean
  isCalibrationEvent?: boolean
}

// Body fat chart data point for per-entry body fat % tracking
export interface BodyFatChartDataPoint {
  date: string
  timestamp: number
  bodyFat: number
  rollingAverage: number | null
  displayDate: string
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
  /** Days until calibration is next recommended. 0 = already recommended. null = never calibrated. */
  daysUntilNextRecommended: number | null
  weightTrend: 'stable' | 'gaining' | 'losing' | 'erratic' | 'insufficient_data'
  suggestedTimePeriod: 14 | 21 | 28
  confidencePreview: 'high' | 'standard' | 'low' | 'unknown'
  /**
   * Framsteg mot de två datakraven. Driver beredskapskortet i Översikt, som
   * visas INNAN användaren kvalificerar — utan det får den som inte når kraven
   * bara tystnad och vet varken att funktionen finns eller hur nära hen är.
   */
  progress: {
    weighIns: { current: number; required: number }
    logDays: { current: number; required: number }
    /**
     * @deprecated Räknade max(saknade vägningar, saknade loggdagar) och
     * visade det som DAGAR — fel enhet. "3 vägningar kvar" blev "om 3
     * dagar", vilket dessutom är omöjligt när vägningarna måste spridas
     * över perioden. Använd blocking i stället.
     */
    daysRemaining: number
    /**
     * Vilken mätperiod kraven ovan gäller. Stiger när användaren klarat en
     * nivå: har hon 14 dagar i hamn mäts hon mot 21:s krav.
     */
    activePeriod: 14 | 21 | 28
    /** Perioder som redan håller — driver trappan i beredskapskortet. */
    reachedPeriods: Array<14 | 21 | 28>
    /**
     * VAD som blockerar just nu, för att kortet ska kunna säga rätt sak.
     *
     *  weighInCount  — för få vägningar
     *  clusterGap    — nog många, men för tätt i tiden (fönstret delas i
     *                  tredjedelar; det behövs mätningar i båda ändarna)
     *  logDays       — för få loggade dagar
     *  logCoverage   — loggarna täcker inte halva mätperioden
     *  none          — inget blockerar
     */
    blocking: 'weighInCount' | 'clusterGap' | 'logDays' | 'logCoverage' | 'none'
    /**
     * Dagar tills nästa vägning är meningsfull, när clusterGap blockerar.
     *
     * Klusterkravet kan inte uppfyllas genom att väga sig igen i dag —
     * mätningarna måste hamna i olika ändar av fönstret. Detta är en
     * NEDRÄKNING, till skillnad från daysRemaining som var ett antal.
     *
     * null betyder "gäller inte" — antingen blockerar något annat än
     * klustringen, eller så hjälper ingen vägning inom överskådlig tid.
     * De två skiljs åt av clusterOutlook, inte av det här fältet.
     */
    daysUntilNextWeighInUseful: number | null
    /**
     * Vad som faktiskt går att göra åt klusterkravet.
     *
     * 'weighToday' — en vägning i dag räcker.
     * 'weighLater' — vägningen gör nytta först om N dagar (se ovan).
     * 'windowExpiring' — mätningarna faller ur fönstret innan de hinner
     *   bilda ett startkluster; ingen enskild vägning löser det.
     * 'notBlocking' — klustringen är inte det som stoppar.
     *
     * Utan det här kunde kortet inte skilja "väg dig i dag" från "ingen
     * vägning hjälper" — båda kom ut som 0 ur den gamla formeln, och
     * användaren fick samma uppmaning dag efter dag utan effekt.
     */
    clusterOutlook: 'weighToday' | 'weighLater' | 'windowExpiring' | 'notBlocking'
    /**
     * Hinder som mer data inte löser.
     *
     * 'planInterval' — gratisnivåns intervall har inte löpt ut.
     * 'missingTdee' — TDEE saknas i profilen.
     * 'none' — inget sådant hinder.
     *
     * Kortet visade förut nedräkningar och "väg dig igen" även i de här
     * lägena, eftersom det bara läste progress och aldrig reason. Att be
     * någon väga sig i 150 dagar till ingen nytta är den värsta sortens
     * vägledning: en uppmaning som garanterat inte leder någonstans.
     */
    hardBlock: 'planInterval' | 'missingTdee' | 'none'
    /** Dagar kvar av plan-intervallet, när hardBlock är 'planInterval'. */
    hardBlockDaysLeft: number | null
    /**
     * Hur vägningarna fördelar sig över mätperiodens ändar.
     *
     * "4 / 6" rymmer inte spridningskravet: fyra vägningar i rad uppfyller
     * talet men ger noll giltiga mätpunkter, eftersom de hamnar i samma
     * ände. Två separata siffror går att agera på — ett totaltal gör det
     * inte.
     */
    weighInSpread: { early: number; late: number }
  }
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
