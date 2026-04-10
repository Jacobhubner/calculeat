/**
 * Metabolic Calibration — Data Quality, Confidence, Clamp & Calorie Estimation
 */

import type { CalibrationConfidence } from '@/lib/types'
import { mean } from './calibration-helpers'
import { BASE_MAX_ADJUSTMENT, PRIOR_STRENGTH } from './calibration-constants'

// ─── Calorie Estimation (Soft Prior Model) ──────────────────────────────────

/**
 * Estimate average daily calories using a soft Bayesian prior.
 *
 * Logged average dominates; target calories act as a weak correction
 * proportional to how incomplete the log is — not a substitute for data.
 *
 * priorWeight = (1 - daysWithData/totalDays) × PRIOR_STRENGTH
 * averageCalories = loggedAvg × (1 - priorWeight) + target × priorWeight
 */
export function getCalorieEstimate(
  loggedAvg: number | null,
  targetCalories: number,
  daysWithData: number,
  totalDays: number
): { averageCalories: number; priorWeight: number } {
  if (loggedAvg === null || daysWithData === 0) {
    // No observations — return target with priorWeight = 0 (no blending occurred)
    return { averageCalories: targetCalories, priorWeight: 0 }
  }
  const incompletenessFraction = totalDays > 0 ? 1 - daysWithData / totalDays : 0
  const priorWeight = incompletenessFraction * PRIOR_STRENGTH
  const averageCalories = loggedAvg * (1 - priorWeight) + targetCalories * priorWeight
  return { averageCalories, priorWeight }
}

// ─── Selective Logging Detection ────────────────────────────────────────────

export interface SelectiveLoggingIndicator {
  isLikely: boolean
  severity: 'none' | 'mild' | 'strong'
  loggedVsTargetRatio: number
}

/**
 * Detect selective logging: users logging only "good" (low calorie) days.
 * If actual avg is significantly below target AND completeness is mediocre
 * AND user is losing weight, the food log data is likely biased downward.
 */
export function detectSelectiveLogging(
  actualCaloriesAvg: number | null,
  targetCalories: number,
  foodLogCompleteness: number,
  weightChangeKg: number
): SelectiveLoggingIndicator {
  if (!actualCaloriesAvg || foodLogCompleteness >= 90) {
    return { isLikely: false, severity: 'none', loggedVsTargetRatio: 1 }
  }

  const ratio = actualCaloriesAvg / targetCalories
  const isDeficit = weightChangeKg < -0.1
  const isLikely = ratio < 0.85 && foodLogCompleteness < 80 && isDeficit
  const severity: SelectiveLoggingIndicator['severity'] = !isLikely
    ? 'none'
    : ratio < 0.75
      ? 'strong'
      : 'mild'

  return { isLikely, severity, loggedVsTargetRatio: ratio }
}

// ─── Data Quality Index ──────────────────────────────────────────────────────

export interface DataQualityResult {
  score: number
  label: string
  maxAbsoluteAdjustment: number
  factors: {
    logScore: number
    freqScore: number
    clusterScore: number
  }
}

/**
 * Composite data quality score (0-100).
 * Drives adaptive max-adjustment (±75–200 kcal based on quality).
 *
 * Timing consistency is intentionally excluded: recorded_at is always
 * normalised to midnight (date-only input), so stddev would always be 0
 * and the factor would carry no information.
 */
export function calculateDataQualityIndex(
  foodLogCompleteness: number,
  measurementCount: number,
  periodDays: number,
  startClusterSize: number,
  endClusterSize: number
): DataQualityResult {
  // Food log quality (45% weight) — 90% completeness = 100 score
  const logScore = Math.min(100, foodLogCompleteness * (100 / 90))

  // Measurement frequency (35% weight) — 50% of days measured = 100
  const idealFreq = 0.5
  const freqScore = Math.min(100, (measurementCount / periodDays / idealFreq) * 100)

  // Cluster adequacy (20% weight) — 100p requires ≥3 in each cluster (min of both sides × 2 / 6).
  // Using min(start, end) × 2 instead of sum prevents 5+1 from scoring the same as 3+3.
  const clusterScore = Math.min(100, ((Math.min(startClusterSize, endClusterSize) * 2) / 6) * 100)

  const score = Math.round(logScore * 0.45 + freqScore * 0.35 + clusterScore * 0.2)

  // Continuous cap: 75 kcal at DQI=0, 200 kcal at DQI=100 — no cliff effects
  const maxAbsoluteAdjustment = Math.round(75 + (score / 100) * 125)

  let label: string
  if (score >= 80) {
    label = 'Utmärkt data'
  } else if (score >= 60) {
    label = 'Bra data'
  } else if (score >= 40) {
    label = 'Tillräcklig data'
  } else {
    label = 'Begränsad data'
  }

  return {
    score,
    label,
    maxAbsoluteAdjustment,
    factors: { logScore, freqScore, clusterScore },
  }
}

// ─── Convergence Smoothing ───────────────────────────────────────────────────

export interface ConvergenceResult {
  smoothedTDEE: number
  convergenceScore: number
}

function calculateConvergenceScore(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const maxDeviation = Math.max(...values.map(v => Math.abs(v - avg)))
  return Math.max(0, Math.round(100 - (maxDeviation / avg) * 1000))
}

/**
 * Exponential smoothing of calibration history.
 * Applied ONLY when writing to profile — not in internal calculation.
 *
 * Principle: does not mask consistent trend deviations.
 * If all recent calibrations point in the same direction, smoothing
 * follows the trend rather than dampening it.
 */
export function applyConvergenceSmoothing(
  rawTDEE: number,
  calibrationHistory: Array<{
    applied_tdee: number
    confidence_level: string
    calibrated_at?: string
    data_quality_index?: number | null
  }>,
  alpha: number = 0.6
): ConvergenceResult {
  const maxHistory = 3

  // DQI-weighted staleness guard: filter out old calibrations
  // High DQI (≥60) → 180-day window, low DQI (<60) → 90-day window
  const now = Date.now()
  const freshHistory = calibrationHistory.filter(c => {
    if (!c.calibrated_at) return true // no date = keep (legacy entries)
    const ageMs = now - new Date(c.calibrated_at).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const maxAge = (c.data_quality_index ?? 0) >= 60 ? 180 : 90
    return ageDays <= maxAge
  })

  if (freshHistory.length === 0) {
    return { smoothedTDEE: rawTDEE, convergenceScore: 0 }
  }

  const recent = freshHistory.slice(0, maxHistory).reverse() // oldest first

  // Check for consistent trend — if all point same direction, don't dampen
  const allValues = [...recent.map(c => c.applied_tdee), rawTDEE]
  const diffs = allValues.slice(1).map((v, i) => v - allValues[i])
  const allSameDirection = (diffs.length >= 2 && diffs.every(d => d > 0)) || diffs.every(d => d < 0)

  if (allSameDirection) {
    // Consistent trend: minimal smoothing, follow the direction
    const lightAlpha = 0.8
    let smoothed = recent[0].applied_tdee
    for (let i = 1; i < recent.length; i++) {
      smoothed = lightAlpha * recent[i].applied_tdee + (1 - lightAlpha) * smoothed
    }
    smoothed = lightAlpha * rawTDEE + (1 - lightAlpha) * smoothed

    return {
      smoothedTDEE: Math.round(smoothed),
      convergenceScore: calculateConvergenceScore(allValues),
    }
  }

  // Normal smoothing
  let smoothed = recent[0].applied_tdee
  for (let i = 1; i < recent.length; i++) {
    smoothed = alpha * recent[i].applied_tdee + (1 - alpha) * smoothed
  }
  smoothed = alpha * rawTDEE + (1 - alpha) * smoothed

  return {
    smoothedTDEE: Math.round(smoothed),
    convergenceScore: calculateConvergenceScore(allValues),
  }
}

// ─── Confidence ──────────────────────────────────────────────────────────────

export function calculateConfidence(
  startClusterSize: number,
  endClusterSize: number,
  foodLogCompleteness: number,
  periodDays: 14 | 21 | 28,
  actualSpanDays?: number,
  snr?: number
): CalibrationConfidence {
  let level: CalibrationConfidence['level']
  const degradeReasons: CalibrationConfidence['degradeReasons'] = []

  if (startClusterSize >= 3 && endClusterSize >= 3) {
    level = 'high'
  } else if (startClusterSize >= 2 || endClusterSize >= 2) {
    level = 'standard'
    degradeReasons.push('low_cluster_size')
  } else {
    level = 'low'
    degradeReasons.push('low_cluster_size')
  }

  // Degrade if measurements cover less than 50% of the period
  if (actualSpanDays !== undefined && actualSpanDays / periodDays < 0.5) {
    level = level === 'high' ? 'standard' : 'low'
    degradeReasons.push('sparse_coverage')
  }

  // Degrade if signal-to-noise ratio is very low (t-statistic of slope < 1.0).
  // SNR here is slope / (residualSd / √n): period-invariant, equivalent to the
  // OLS t-statistic. t < 1 means the slope estimate is smaller than its own
  // standard error — noise clearly dominates.
  // Raw R² is intentionally NOT used — it is suppressed by normal daily fluctuations
  // (0.5–2 kg) even when a real trend exists, making it unreliable for daily weigh-ins.
  if (snr !== undefined && snr < 1.0) {
    level = level === 'high' ? 'standard' : 'low'
    degradeReasons.push('nonlinear_trend')
  }

  return {
    level,
    degradeReasons,
    startClusterSize,
    endClusterSize,
    foodLogCompleteness,
    periodDays,
  }
}

// ─── Adaptive Clamp ──────────────────────────────────────────────────────────

export function getMaxAdjustment(
  confidence: CalibrationConfidence,
  isFirstCalibration: boolean,
  foodLogWeight: number,
  _dataQuality: DataQualityResult
): number {
  let maxPercent = BASE_MAX_ADJUSTMENT[confidence.periodDays as 14 | 21 | 28] ?? 0.15

  // Reduce for low confidence
  if (confidence.level === 'low') {
    maxPercent *= 0.6
  }

  // Scale by food log weight (replaces binary 70% threshold)
  // At foodLogWeight=0 (no food log), multiply by 0.5
  // At foodLogWeight=1 (full food log), multiply by 1.0
  maxPercent *= 0.5 + 0.5 * foodLogWeight

  // First calibration gets wider range
  if (isFirstCalibration) {
    maxPercent = Math.min(maxPercent * 1.5, 0.25)
  }

  // Absolute bounds
  return Math.max(0.05, Math.min(0.25, maxPercent))
}
