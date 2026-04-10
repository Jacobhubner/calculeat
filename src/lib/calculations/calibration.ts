/**
 * Metabolic Calibration — Pure calculation module
 *
 * Estimates Maintenance-TDEE from weight change data using cluster averaging
 * with trend-based weight change and adaptive quality controls.
 *
 * Architecture:
 *   Maintenance-TDEE  = estimated from weight trend + calorie intake
 *   Coaching target    = Maintenance-TDEE ± planned deficit/surplus (separate layer)
 *
 * ═══ MODEL GOVERNANCE — Fixed Parameters ═══
 *
 * All clamp calculations are relative to the current profile.tdee.
 * No intermediate value is used — this ensures monotonic convergence.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ Parameter                    │ Value   │ Justification              │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ KCAL_PER_KG                  │ 7700    │ Hall 2008, Thomas 2014.    │
 * │                              │         │ Mixed tissue (fat+water+   │
 * │                              │         │ glycogen), not pure fat.   │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ MAX_WEEKLY_CHANGE_PERCENT    │ 1.5%    │ Helms 2014 + margin.       │
 * │                              │         │ Beyond this = water/       │
 * │                              │         │ glycogen, not tissue.      │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ CV_WARNING_THRESHOLD         │ 2.0%    │ Normal daily fluctuation   │
 * │ CV_BLOCK_THRESHOLD           │ 3.0%    │ ~0.5-1% CV. >3% = erratic │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ LOW_SIGNAL_THRESHOLD_PERCENT │ 0.25%   │ Δweight < 0.25% of body   │
 * │                              │         │ weight = noise dominates.  │
 * │                              │         │ Halves max adjustment.     │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ EMA trend alpha              │ 0.3     │ Moderate smoothing. Lower  │
 * │                              │         │ = smoother, slower. 0.3    │
 * │                              │         │ balances noise rejection   │
 * │                              │         │ vs trend responsiveness.   │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ Food log blending range      │ 40-90%  │ <40% completeness = zero  │
 * │                              │         │ trust (fall back to target)│
 * │                              │         │ ≥90% = full trust. Linear  │
 * │                              │         │ between.                   │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ Selective logging detection   │ ratio   │ loggedAvg/target < 0.85   │
 * │                              │ <0.85   │ + completeness < 80%      │
 * │                              │         │ + losing weight → 30%     │
 * │                              │         │ trust reduction (soft).   │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ DQI weights                  │ 40/30/  │ Food log quality is the   │
 * │                              │ 15/15   │ biggest driver of calorie │
 * │                              │         │ accuracy. Freq and timing │
 * │                              │         │ secondary. Cluster size   │
 * │                              │         │ is a weak signal.         │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ DQI → max absolute adjust    │ 75/100/ │ Hard kcal caps. Percentage│
 * │                              │ 150/200 │ clamp can exceed these —  │
 * │                              │         │ DQI cap always wins.      │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ Convergence smoothing alpha  │ 0.6     │ Normal smoothing. Blends  │
 * │ (normal)                     │         │ with last 3 calibrations. │
 * │ Convergence smoothing alpha  │ 0.8     │ Trend-following. When all │
 * │ (consistent trend)           │         │ recent cals point same    │
 * │                              │         │ direction, minimal damp.  │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ Deficit safeguard threshold  │ >25%    │ >25% deficit → metabolic  │
 * │                              │         │ adaptation/NEAT reduction │
 * │                              │         │ likely. Reduces max adj   │
 * │                              │         │ by 20% (0.8×).           │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ BASE_MAX_ADJUSTMENT          │12/15/20%│ Longer periods = more     │
 * │ (14/21/28 days)              │         │ signal, wider allowance.  │
 * │                              │         │ Multiplied by food log    │
 * │                              │         │ weight (0.5+0.5×flw).    │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ TDEE_FLOOR / TDEE_CEILING    │1200/5000│ Absolute physiological    │
 * │                              │         │ boundaries. Below 1200 =  │
 * │                              │         │ data error. Above 5000 =  │
 * │                              │         │ implausible.             │
 * ├──────────────────────────────┼─────────┼────────────────────────────┤
 * │ MIN_DAYS_BETWEEN_CALIBRATIONS│ 14      │ Hard minimum. Recommended │
 * │                              │         │ 21-28 days (set in        │
 * │                              │         │ useCalibrationAvailability)│
 * └──────────────────────────────┴─────────┴────────────────────────────┘
 *
 * Clamp chain (in order of application):
 *   1. BASE_MAX_ADJUSTMENT[period] × confidence_penalty × foodLogWeight
 *      (no high-confidence bonus — DQI cap makes it redundant and unsafe)
 *   2. ×0.5 if low signal (Δweight < 0.25% body weight)
 *   3. ×0.8 if deficit > 25%
 *   4. min(percentage_clamp, DQI_absolute_cap)  ← DQI always final
 *   5. TDEE_FLOOR / TDEE_CEILING absolute bounds
 *   6. Convergence smoothing applied ONLY at profile-write time
 */

export {
  MIN_DATA_POINTS,
  MIN_CLUSTER_SIZE,
  MIN_DAYS_BETWEEN_CALIBRATIONS,
  MIN_DAILY_KCAL_FOR_LOG,
} from './calibration-constants'

export type { OutlierResult } from './calibration-outliers'
export { detectWeightOutliers } from './calibration-outliers'

export type { OLSTrendResult } from './calibration-trend'
export { calculateWeightTrendOLS, calculateWeightTrend } from './calibration-trend'

export type { ClusterBuildResult } from './calibration-clustering'
export { buildClusters } from './calibration-clustering'

export type {
  DataQualityResult,
  ConvergenceResult,
  SelectiveLoggingIndicator,
} from './calibration-quality'
export {
  getCalorieEstimate,
  detectSelectiveLogging,
  calculateDataQualityIndex,
  applyConvergenceSmoothing,
  calculateConfidence,
  getMaxAdjustment,
} from './calibration-quality'

export type { ValidationError, CalibrationInput } from './calibration-core'
export { validateWeightData, runCalibration } from './calibration-core'
