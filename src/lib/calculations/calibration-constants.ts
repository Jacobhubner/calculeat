/**
 * Metabolic Calibration — Constants
 *
 * All fixed parameters for the calibration model.
 * See calibration.ts (barrel) for the full Model Governance table.
 */

export const KCAL_PER_KG = 7700

/** Minimum data points per period */
export const MIN_DATA_POINTS: Record<14 | 21 | 28, number> = {
  14: 4,
  21: 5,
  28: 6,
}

/** Minimum cluster size per period */
export const MIN_CLUSTER_SIZE: Record<14 | 21 | 28, number> = {
  14: 2,
  21: 2,
  28: 2,
}

/** Base max adjustment per period */
export const BASE_MAX_ADJUSTMENT: Record<14 | 21 | 28, number> = {
  14: 0.12,
  21: 0.15,
  28: 0.2,
}

/** Minimum days between calibrations */
export const MIN_DAYS_BETWEEN_CALIBRATIONS = 14

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

/** Confidence floor: Δweight below this % of body weight = low signal */
export const LOW_SIGNAL_THRESHOLD_PERCENT = 0.25

/**
 * How strongly target calories pull the estimate when days are missing.
 * Max pull: PRIOR_STRENGTH × 100% of missing fraction.
 */
export const PRIOR_STRENGTH = 0.3
