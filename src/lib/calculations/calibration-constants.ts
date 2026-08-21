/**
 * Metabolic Calibration — Constants
 *
 * All fixed parameters for the calibration model.
 * See calibration.ts (barrel) for the full Model Governance table.
 */

export const KCAL_PER_KG = 7700

/**
 * Längsta mätperioden. Den som samlar underlag behöver täcka DEN, inte
 * den kortaste — annars blir den längsta nivån onåbar i praktiken.
 */
export const MAX_CALIBRATION_PERIOD_DAYS = 28

/** Minimum data points per period */
export const MIN_DATA_POINTS: Record<14 | 21 | 28, number> = {
  14: 4,
  21: 5,
  28: 6,
}

/**
 * Minsta avstånd mellan klustrens centroider, i dagar.
 *
 * Tidsbasen är nämnaren i dailyCalorieBalance: 0,3 kg vägningsbrus kostar
 * ~300 kcal/dag vid 7 dagars bas men det dubbla vid 3,5. Regeln hör därför
 * hemma där klustren byggs, inte i en validering nedströms som bara en av
 * anroparna når — hooken kontrollerade klusterstorlek men aldrig det här,
 * runCalibration tvärtom, och grindarna kunde säga olika saker om samma
 * data.
 */
export const MIN_CLUSTER_SEPARATION_DAYS = 7

/** Minimum cluster size per period */
export const MIN_CLUSTER_SIZE: Record<14 | 21 | 28, number> = {
  14: 2,
  21: 2,
  28: 2,
}

/**
 * Absolut golv för hur mycket TDEE får justeras, som andel av nuvarande TDEE.
 *
 * Appliceras EFTER alla riskmultiplikatorer (låg signal, stort underskott,
 * veckodagsbias, underrapportering). Slår flera till samtidigt blir produkten
 * annars så liten att kalibreringen blir en no-op — och ett för litet
 * konvergenstak är dessutom det som gör klämintervallen disjunkta.
 */
export const MIN_ADJUSTMENT_PERCENT = 0.02

/** Base max adjustment per period */
export const BASE_MAX_ADJUSTMENT: Record<14 | 21 | 28, number> = {
  14: 0.12,
  21: 0.15,
  28: 0.2,
}

/** Minimum new weight measurements after last calibration end date before re-applying */
export const MIN_NEW_WEIGHTS_AFTER_CALIBRATION = 3

/** Absolute TDEE floor/ceiling */
export const TDEE_FLOOR = 1200
export const TDEE_CEILING = 5000

/** Max weekly weight change (% of body weight) before blocking */
export const MAX_WEEKLY_CHANGE_PERCENT = 1.5

/** CV thresholds */
export const CV_WARNING_THRESHOLD = 2.0
export const CV_BLOCK_THRESHOLD = 3.0

/** Min daily kcal to count as a real food-log day */
export const MIN_DAILY_KCAL_FOR_LOG = 800

/**
 * Minsta antal loggade dagar för att kalibrering ska tillåtas.
 *
 * VARFÖR (2026-08-16): utan loggdata föll modellen tillbaka på
 * targetCalories — den kalibrerade alltså TDEE mot vad användaren TÄNKTE äta
 * i stället för vad hen åt. Resultatet blir cirkulärt men presenterades med
 * samma auktoritet som en riktig mätning.
 *
 * 7 dagar är vald som lägsta nivå där veckorytm (vardag/helg) fångas.
 * Matloggen väger 45 % av datakvalitetsindexet — tyngst av alla faktorer —
 * så under den nivån är resultatet inte värt att visa.
 */
export const MIN_LOG_DAYS_FOR_CALIBRATION = 7

/**
 * Andel av mätperioden (viktklustrens tidsspann) som måste vara täckt av
 * loggade dagar.
 *
 * VARFÖR (2026-08-16): daysWithLogData är bara ett ANTAL — modellen visste
 * inte NÄR dagarna inföll. Sju loggdagar i periodens första halva plus
 * vägningar spridda över hela perioden uppfyllde båda kraven, trots att
 * intaget och viktförändringen då beskriver olika tidsfönster. Kalibreringen
 * bygger på att de jämförs över SAMMA tid.
 *
 * 0.5 = minst halva mätperioden måste vara loggad. Lägre än så blir den
 * omätta halvan ren gissning via priorWeight.
 */
export const MIN_LOG_COVERAGE_OF_PERIOD = 0.5

/** Confidence floor: Δweight below this % of body weight = low signal */
export const LOW_SIGNAL_THRESHOLD_PERCENT = 0.25

/**
 * How strongly target calories pull the estimate when days are missing.
 * Max pull: PRIOR_STRENGTH × 100% of missing fraction.
 */
export const PRIOR_STRENGTH = 0.3
