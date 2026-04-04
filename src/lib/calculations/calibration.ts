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
 *   1. BASE_MAX_ADJUSTMENT[period] × confidence × foodLogWeight
 *   2. ×0.5 if low signal (Δweight < 0.25% body weight)
 *   3. ×0.8 if deficit > 25%
 *   4. min(percentage_clamp, DQI_absolute_cap)  ← DQI always final
 *   5. TDEE_FLOOR / TDEE_CEILING absolute bounds
 *   6. Convergence smoothing applied ONLY at profile-write time
 */

import type {
  WeightHistory,
  WeightCluster,
  CalibrationConfidence,
  CalibrationWarning,
  CalibrationResult,
} from '@/lib/types'

// ─── Constants ──────────────────────────────────────────────────────

const KCAL_PER_KG = 7700

/**
 * Context-aware energy density of weight change.
 * Base: 7700 kcal/kg (Hall 2008, mixed tissue).
 * Rapid loss: glycogen-heavy → lower effective density (~6500).
 * Rapid gain: glycogen refill → lower effective density (~6800).
 * Uses smooth linear interpolation to avoid step-function discontinuities.
 */
function getEffectiveKcalPerKg(weeklyChangePct: number): number {
  if (weeklyChangePct < 0) {
    // Loss side: linear from 7700 at -0.25%/week to 6500 at -1.5%/week
    const t = Math.max(0, Math.min(1, (weeklyChangePct + 1.5) / 1.25))
    return Math.round(6500 + t * 1200)
  }
  if (weeklyChangePct > 0.5) {
    // Gain side: glycogen refill, conservative 6800
    return 6800
  }
  return KCAL_PER_KG
}

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
const BASE_MAX_ADJUSTMENT: Record<14 | 21 | 28, number> = {
  14: 0.12,
  21: 0.15,
  28: 0.2,
}

/** Minimum days between calibrations */
export const MIN_DAYS_BETWEEN_CALIBRATIONS = 14

/** Absolute TDEE floor/ceiling */
const TDEE_FLOOR = 1200
const TDEE_CEILING = 5000

/** Max weekly weight change (% of body weight) before blocking */
const MAX_WEEKLY_CHANGE_PERCENT = 1.5

/** CV thresholds */
const CV_WARNING_THRESHOLD = 2.0
const CV_BLOCK_THRESHOLD = 3.0

/** Min daily kcal to count as a real food-log day */
export const MIN_DAILY_KCAL_FOR_LOG = 800

/** Confidence floor: Δweight below this % of body weight = low signal */
const LOW_SIGNAL_THRESHOLD_PERCENT = 0.25

// ─── Helpers ────────────────────────────────────────────────────────

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stddev(values: number[]): number {
  const avg = mean(values)
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

function meanDate(dates: Date[]): Date {
  const avg = dates.reduce((s, d) => s + d.getTime(), 0) / dates.length
  return new Date(avg)
}

// ─── Outlier Detection ──────────────────────────────────────────────

export interface OutlierResult {
  cleaned: Array<{ weight_kg: number; recorded_at: Date }>
  outliers: Array<{ weight_kg: number; recorded_at: Date }>
}

/**
 * IQR-based outlier detection (1.5× Tukey fence).
 * Returns cleaned measurements and removed outliers.
 */
export function detectWeightOutliers(
  measurements: Array<{ weight_kg: number; recorded_at: Date }>
): OutlierResult {
  if (measurements.length < 4) {
    return { cleaned: measurements, outliers: [] }
  }

  const weights = measurements.map(m => m.weight_kg)
  const sorted = [...weights].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const lowerFence = q1 - 1.5 * iqr
  const upperFence = q3 + 1.5 * iqr

  const cleaned: typeof measurements = []
  const outliers: typeof measurements = []

  for (const m of measurements) {
    if (m.weight_kg < lowerFence || m.weight_kg > upperFence) {
      outliers.push(m)
    } else {
      cleaned.push(m)
    }
  }

  return { cleaned, outliers }
}

// ─── Trend-Based Weight Change ──────────────────────────────────────

/**
 * Calculate weight change using exponential smoothing trend.
 * More robust than raw cluster means against water/glycogen noise.
 * Returns trend start and end values based on smoothed series.
 */
export function calculateWeightTrend(
  measurements: Array<{ weight_kg: number; recorded_at: Date }>
): { trendStart: number; trendEnd: number } | null {
  if (measurements.length < 2) return null

  const sorted = [...measurements].sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())
  const weights = sorted.map(m => m.weight_kg)

  // Exponential smoothing (alpha = 0.3 for moderate smoothing)
  const alpha = 0.3
  const smoothed: number[] = [weights[0]]
  for (let i = 1; i < weights.length; i++) {
    smoothed.push(alpha * weights[i] + (1 - alpha) * smoothed[i - 1])
  }

  return {
    trendStart: smoothed[0],
    trendEnd: smoothed[smoothed.length - 1],
  }
}

// ─── OLS Weight Trend ───────────────────────────────────────────────

export interface OLSTrendResult {
  trendStart: number
  trendEnd: number
  slopeKgPerDay: number
  rSquared: number
  residualSd: number
  ssXX: number
  /** Last x value in days (= actual time span covered by measurements) */
  lastX: number
}

/**
 * OLS linear regression on time-indexed weight measurements.
 * Replaces EMA as primary weight trend estimator.
 *
 * Advantages over EMA:
 * - No initialization bias (EMA anchors to first measurement)
 * - Global minimum-residual fit
 * - Free byproducts: R², residualSd, ssXX needed for confidence intervals
 *
 * Returns null if fewer than 3 measurements or all at the same timestamp.
 */
export function calculateWeightTrendOLS(
  measurements: Array<{ weight_kg: number; recorded_at: Date }>
): OLSTrendResult | null {
  if (measurements.length < 3) return null

  const sorted = [...measurements].sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())
  const t0 = sorted[0].recorded_at.getTime()
  const xs = sorted.map(m => (m.recorded_at.getTime() - t0) / 86400000) // days since first
  const ys = sorted.map(m => m.weight_kg)
  const n = xs.length

  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n
  const ssXX = xs.reduce((s, x) => s + (x - meanX) ** 2, 0)
  const ssXY = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0)
  const ssYY = ys.reduce((s, y) => s + (y - meanY) ** 2, 0)

  if (ssXX === 0) return null

  const slope = ssXY / ssXX
  const intercept = meanY - slope * meanX
  const lastX = xs[n - 1]

  const ssRes = ys.reduce((s, y, i) => s + (y - (intercept + slope * xs[i])) ** 2, 0)
  const rSquared = ssYY > 0 ? 1 - ssRes / ssYY : 0
  const residualSd = Math.sqrt(ssRes / Math.max(1, n - 2))

  return {
    trendStart: intercept,
    trendEnd: intercept + slope * lastX,
    slopeKgPerDay: slope,
    rSquared,
    residualSd,
    ssXX,
    lastX,
  }
}

// ─── Food Log Blending ──────────────────────────────────────────────

/**
 * Continuous food log weight (0-1) instead of binary threshold.
 * Linear interpolation from 40% (no trust) to 90% (full trust).
 */
export function getFoodLogWeight(completeness: number): number {
  if (completeness < 40) return 0
  if (completeness >= 90) return 1
  return (completeness - 40) / 50
}

// ─── Selective Logging Detection ────────────────────────────────────

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

// ─── Data Quality Index ─────────────────────────────────────────────

export interface DataQualityResult {
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

/**
 * Composite data quality score (0-100).
 * Drives adaptive max-adjustment (±100/150/200 kcal based on quality).
 */
export function calculateDataQualityIndex(
  foodLogCompleteness: number,
  measurementCount: number,
  periodDays: number,
  timingStddevHours: number,
  startClusterSize: number,
  endClusterSize: number
): DataQualityResult {
  // Food log quality (40% weight) — 90% completeness = 100 score
  const logScore = Math.min(100, foodLogCompleteness * (100 / 90))

  // Measurement frequency (30% weight) — 50% of days measured = 100
  const idealFreq = 0.5
  const freqScore = Math.min(100, (measurementCount / periodDays / idealFreq) * 100)

  // Timing consistency (15% weight) — 0 stddev = 100, 4h+ = 0
  // 4h threshold: AM vs PM weighing causes ~0.5-1.5 kg variance, practically significant
  const timingScore = Math.max(0, 100 - timingStddevHours * 25)

  // Cluster adequacy (15% weight) — 6 total = 100
  const clusterScore = Math.min(100, ((startClusterSize + endClusterSize) / 6) * 100)

  const score = Math.round(
    logScore * 0.4 + freqScore * 0.3 + timingScore * 0.15 + clusterScore * 0.15
  )

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
    factors: { logScore, freqScore, timingScore, clusterScore },
  }
}

// ─── Convergence Smoothing ──────────────────────────────────────────

export interface ConvergenceResult {
  smoothedTDEE: number
  convergenceScore: number
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

function calculateConvergenceScore(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const maxDeviation = Math.max(...values.map(v => Math.abs(v - avg)))
  return Math.max(0, Math.round(100 - (maxDeviation / avg) * 1000))
}

// ─── Cluster Building ───────────────────────────────────────────────

export interface ClusterBuildResult {
  startCluster: WeightCluster
  endCluster: WeightCluster
  allMeasurements: Array<{ weight_kg: number; recorded_at: Date }>
}

/**
 * Build start and end clusters from weight measurements within a time window.
 * The window is divided into thirds; measurements in the first third form the
 * start cluster, last third form the end cluster.
 *
 * Uses median for cluster central value (more robust than mean).
 * Applies IQR outlier filtering before clustering.
 *
 * If a cluster is empty, the zone is extended to 50% of the window.
 * Returns null if either cluster remains empty after extension.
 */
export function buildClusters(
  measurements: WeightHistory[],
  periodDays: 14 | 21 | 28,
  now: Date
): ClusterBuildResult | null {
  const windowStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  // Filter and sort
  const sorted = measurements
    .map(m => ({ weight_kg: m.weight_kg, recorded_at: new Date(m.recorded_at) }))
    .filter(m => m.recorded_at >= windowStart && m.recorded_at <= now)
    .sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())

  if (sorted.length < 2) return null

  // Outlier detection
  const { cleaned } = detectWeightOutliers(sorted)
  if (cleaned.length < 2) return null

  const thirdMs = (periodDays * 24 * 60 * 60 * 1000) / 3
  const startZoneEnd = new Date(windowStart.getTime() + thirdMs)
  const endZoneStart = new Date(now.getTime() - thirdMs)

  let startItems = cleaned.filter(m => m.recorded_at <= startZoneEnd)
  let endItems = cleaned.filter(m => m.recorded_at >= endZoneStart)

  // Fallback: extend to 50% if a cluster is empty
  if (startItems.length === 0) {
    const halfEnd = new Date(windowStart.getTime() + (periodDays * 24 * 60 * 60 * 1000) / 2)
    startItems = cleaned.filter(m => m.recorded_at <= halfEnd)
  }
  if (endItems.length === 0) {
    const halfStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000) / 2)
    endItems = cleaned.filter(m => m.recorded_at >= halfStart)
  }

  if (startItems.length === 0 || endItems.length === 0) return null

  // Resolve overlap: if a measurement belongs to both, assign to nearest centroid
  const startDates = startItems.map(m => m.recorded_at)
  const endDates = endItems.map(m => m.recorded_at)
  const startCentroid = meanDate(startDates).getTime()
  const endCentroid = meanDate(endDates).getTime()

  if (startCentroid >= endCentroid) return null // clusters are not separable

  // Remove duplicates from overlap
  const startSet = new Set(startItems.map(m => m.recorded_at.getTime()))
  const endSet = new Set(endItems.map(m => m.recorded_at.getTime()))
  const overlap = [...startSet].filter(t => endSet.has(t))

  for (const t of overlap) {
    const distToStart = Math.abs(t - startCentroid)
    const distToEnd = Math.abs(t - endCentroid)
    if (distToStart <= distToEnd) {
      endItems = endItems.filter(m => m.recorded_at.getTime() !== t)
    } else {
      startItems = startItems.filter(m => m.recorded_at.getTime() !== t)
    }
  }

  if (startItems.length === 0 || endItems.length === 0) return null

  const makeCluster = (items: Array<{ weight_kg: number; recorded_at: Date }>): WeightCluster => {
    const weights = items.map(i => i.weight_kg)
    const dates = items.map(i => i.recorded_at)
    const span = items.length > 1 ? daysBetween(dates[0], dates[dates.length - 1]) : 0
    return { weights, dates, average: median(weights), count: items.length, spanDays: span }
  }

  return {
    startCluster: makeCluster(startItems),
    endCluster: makeCluster(endItems),
    allMeasurements: cleaned,
  }
}

// ─── Confidence ─────────────────────────────────────────────────────

export function calculateConfidence(
  startClusterSize: number,
  endClusterSize: number,
  foodLogCompleteness: number,
  periodDays: 14 | 21 | 28,
  actualSpanDays?: number,
  rSquared?: number | null
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

  // Degrade if OLS R² is low (non-monotonic or very noisy trend)
  if (rSquared !== null && rSquared !== undefined && rSquared < 0.3) {
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

// ─── Adaptive Clamp ─────────────────────────────────────────────────

export function getMaxAdjustment(
  confidence: CalibrationConfidence,
  isFirstCalibration: boolean,
  foodLogWeight: number,
  _dataQuality: DataQualityResult
): number {
  let maxPercent = BASE_MAX_ADJUSTMENT[confidence.periodDays as 14 | 21 | 28] ?? 0.15

  // Boost for high confidence + good food log
  if (confidence.level === 'high' && foodLogWeight >= 0.8) {
    maxPercent *= 1.25
  }

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

// ─── Validation ─────────────────────────────────────────────────────

export interface ValidationError {
  blocked: true
  message: string
}

/**
 * Validate weight data for calibration. Returns null if valid,
 * or a ValidationError if calibration should be blocked.
 */
export function validateWeightData(
  allMeasurements: Array<{ weight_kg: number; recorded_at: Date }>,
  startCluster: WeightCluster,
  endCluster: WeightCluster,
  periodDays: 14 | 21 | 28
): ValidationError | null {
  // Check total data points
  const minPoints = MIN_DATA_POINTS[periodDays]
  if (allMeasurements.length < minPoints) {
    return {
      blocked: true,
      message: `Behöver minst ${minPoints} viktmätningar under ${periodDays} dagar (har ${allMeasurements.length})`,
    }
  }

  // Check actual days span
  const startCentroid = meanDate(startCluster.dates)
  const endCentroid = meanDate(endCluster.dates)
  const actualDays = daysBetween(startCentroid, endCentroid)
  if (actualDays < 7) {
    return {
      blocked: true,
      message: 'För kort tid mellan mätningar. Behöver minst 7 dagars spridning.',
    }
  }

  // Check weight change rate
  const weightChange = endCluster.average - startCluster.average
  const weeklyChangePercent = Math.abs(
    (weightChange / startCluster.average) * 100 * (7 / actualDays)
  )
  if (weeklyChangePercent > MAX_WEEKLY_CHANGE_PERCENT) {
    return {
      blocked: true,
      message: `Viktförändring (${weeklyChangePercent.toFixed(1)}%/vecka) överskrider fysiologisk gräns. Sannolikt vätskevikt.`,
    }
  }

  // Check CV
  const allWeights = allMeasurements.map(m => m.weight_kg)
  const cv = (stddev(allWeights) / mean(allWeights)) * 100
  if (cv > CV_BLOCK_THRESHOLD) {
    return {
      blocked: true,
      message:
        'Vikten varierar för mycket för tillförlitlig kalibrering. Vänta tills vikten stabiliseras.',
    }
  }

  return null
}

// ─── Main Calibration ───────────────────────────────────────────────

export interface CalibrationInput {
  weightHistory: WeightHistory[]
  periodDays: 14 | 21 | 28
  currentTDEE: number
  targetCalories: number
  actualCaloriesAvg: number | null
  foodLogCompleteness: number
  daysWithLogData: number
  isFirstCalibration: boolean
  deficitPercent?: number
  now?: Date
}

/**
 * Run the full calibration pipeline.
 * Returns a CalibrationResult on success, or a string error message on failure.
 */
export function runCalibration(input: CalibrationInput): CalibrationResult | string {
  const now = input.now ?? new Date()

  // Step 1: Build clusters (includes outlier detection and median-based averaging)
  const clusterResult = buildClusters(input.weightHistory, input.periodDays, now)
  if (!clusterResult) {
    return 'Inte tillräckligt med viktdata i vald period för att skapa start- och slutvikt.'
  }

  const { startCluster, endCluster, allMeasurements } = clusterResult

  // Step 2: Validate
  const validationError = validateWeightData(
    allMeasurements,
    startCluster,
    endCluster,
    input.periodDays
  )
  if (validationError) {
    return validationError.message
  }

  // Step 3: Calculate weight change via OLS (primary) + EMA (secondary for divergence detection)
  const olsResult = calculateWeightTrendOLS(allMeasurements)
  const emaResult = calculateWeightTrend(allMeasurements)

  // OLS preferred; fall back to EMA if < 3 measurements, then to cluster diff
  const weightChangeKg = olsResult
    ? olsResult.trendEnd - olsResult.trendStart
    : emaResult
      ? emaResult.trendEnd - emaResult.trendStart
      : endCluster.average - startCluster.average

  // actualDays from OLS time span (removes centroid-compression bias)
  // Fall back to centroid distance if OLS unavailable
  const startCentroid = meanDate(startCluster.dates)
  const endCentroid = meanDate(endCluster.dates)
  const actualDays = olsResult
    ? Math.max(7, olsResult.lastX)
    : Math.max(7, daysBetween(startCentroid, endCentroid))

  // Step 4: Determine calorie source with continuous blending
  const foodLogWeight = getFoodLogWeight(input.foodLogCompleteness)

  // Detect selective logging and adjust trust
  let adjustedFoodLogWeight = foodLogWeight
  const selectiveLogging = detectSelectiveLogging(
    input.actualCaloriesAvg,
    input.targetCalories,
    input.foodLogCompleteness,
    weightChangeKg
  )
  if (selectiveLogging.isLikely) {
    // Severity-tiered: strong (ratio < 0.75) → 50% reduction, mild → 25% reduction
    const trustFactor = selectiveLogging.severity === 'strong' ? 0.5 : 0.75
    adjustedFoodLogWeight = Math.max(0, foodLogWeight * trustFactor)
  }

  const calorieSource: CalibrationResult['calorieSource'] =
    adjustedFoodLogWeight >= 0.95
      ? 'food_log'
      : adjustedFoodLogWeight <= 0.05
        ? 'target_calories'
        : 'blended'

  const averageCalories =
    input.actualCaloriesAvg !== null
      ? input.targetCalories * (1 - adjustedFoodLogWeight) +
        input.actualCaloriesAvg * adjustedFoodLogWeight
      : input.targetCalories

  // Step 5: Calculate TDEE with context-aware energy density
  const startWeight = olsResult ? olsResult.trendStart : startCluster.average
  const weeklyChangePct = (weightChangeKg / startWeight) * 100 * (7 / actualDays)
  const effectiveKcalPerKg = getEffectiveKcalPerKg(weeklyChangePct)
  const totalCalorieBalance = weightChangeKg * effectiveKcalPerKg
  const dailyCalorieBalance = totalCalorieBalance / actualDays
  const rawTDEE = averageCalories - dailyCalorieBalance

  // Step 6: Confidence and adaptive clamp
  const confidence = calculateConfidence(
    startCluster.count,
    endCluster.count,
    input.foodLogCompleteness,
    input.periodDays,
    actualDays,
    olsResult?.rSquared ?? null
  )

  // Calculate timing stddev for DQI
  const hours = allMeasurements.map(m => m.recorded_at.getHours() + m.recorded_at.getMinutes() / 60)
  const timingStddev = hours.length >= 3 ? stddev(hours) : 0

  const dataQuality = calculateDataQualityIndex(
    input.foodLogCompleteness,
    allMeasurements.length,
    input.periodDays,
    timingStddev,
    startCluster.count,
    endCluster.count
  )

  let maxAdjPercent = getMaxAdjustment(
    confidence,
    input.isFirstCalibration,
    adjustedFoodLogWeight,
    dataQuality
  )

  // Confidence floor: very small Δweight = low signal, halve max adjustment
  // startWeight already computed above for weeklyChangePct
  const deltaWeightPercent = Math.abs(weightChangeKg / startWeight) * 100
  const isLowSignal = deltaWeightPercent < LOW_SIGNAL_THRESHOLD_PERCENT
  const isLowConfidenceClamp = confidence.level === 'low'
  const isLargeDeficit = !!(input.deficitPercent && input.deficitPercent > 25)

  if (isLowSignal) {
    maxAdjPercent *= 0.5
  }

  // Safeguard: large deficit reduces max adjustment by 20%
  if (isLargeDeficit) {
    maxAdjPercent *= 0.8
  }

  // DQI absolute cap: override percentage-based clamp with absolute kcal limit
  const maxAbsFromDQI = dataQuality.maxAbsoluteAdjustment
  const maxFromPercent = input.currentTDEE * maxAdjPercent
  const effectiveMaxAbs = Math.min(maxFromPercent, maxAbsFromDQI)
  const dqiWasBindingCap = maxAbsFromDQI < maxFromPercent

  const maxTDEE = Math.min(TDEE_CEILING, input.currentTDEE + effectiveMaxAbs)
  const minTDEE = Math.max(TDEE_FLOOR, input.currentTDEE - effectiveMaxAbs)
  const clampedTDEE = Math.round(Math.max(minTDEE, Math.min(maxTDEE, rawTDEE)))
  const wasLimited = Math.abs(clampedTDEE - rawTDEE) > 0.5

  // Step 7: TDEE floor/ceiling absolute check
  if (rawTDEE < TDEE_FLOOR) {
    return `Kalibrerat TDEE (${Math.round(rawTDEE)} kcal) är under rekommenderad minimigräns (${TDEE_FLOOR} kcal). Kontrollera din matloggning.`
  }
  if (rawTDEE > TDEE_CEILING) {
    return `Kalibrerat TDEE (${Math.round(rawTDEE)} kcal) är orealistiskt högt. Kontrollera viktdata och matloggning.`
  }

  // Step 8: Collect warnings (actionable, non-accusatory language)
  const warnings: CalibrationWarning[] = []
  const allWeights = allMeasurements.map(m => m.weight_kg)
  const cv = (stddev(allWeights) / mean(allWeights)) * 100

  if (cv > CV_WARNING_THRESHOLD) {
    warnings.push({
      type: 'high_cv',
      message:
        'Vikten varierar mer än vanligt. Väg dig på morgonen före frukost för mer stabila mätningar.',
    })
  }

  if (hours.length >= 3 && timingStddev > 4) {
    warnings.push({
      type: 'timing_inconsistency',
      message:
        'Mätningarna varierar i tid på dygnet. Väg dig vid samma tid varje dag för bäst resultat.',
    })
  }

  if (calorieSource === 'target_calories') {
    warnings.push({
      type: 'target_calories_fallback',
      message: `Använder målkalorier (${Math.round(averageCalories)} kcal/dag) eftersom matlogg saknas. Logga mat oftare för mer exakt kalibrering.`,
    })
  }

  if (confidence.level === 'low') {
    warnings.push({
      type: 'low_confidence',
      message: 'Begränsad datamängd — väg dig minst 3 gånger per vecka för bättre precision.',
    })
  }

  if (wasLimited) {
    warnings.push({
      type: 'large_adjustment',
      message: `Justeringen begränsades till max ±${Math.round(effectiveMaxAbs)} kcal baserat på datakvalitet.`,
    })
  }

  if (isLowSignal) {
    warnings.push({
      type: 'low_signal',
      message:
        'Viktförändringen är mycket liten — systemet begränsar justeringen för att undvika överreaktion.',
    })
  }

  if (selectiveLogging.isLikely) {
    warnings.push({
      type: 'selective_logging',
      message:
        'Systemet fungerar bäst när alla dagar loggas — även de där man äter mer än planerat.',
    })
  }

  // Outlier detection warning (check against original sorted data)
  const windowStart = new Date(now.getTime() - input.periodDays * 24 * 60 * 60 * 1000)
  const allSorted = input.weightHistory
    .map(m => ({ weight_kg: m.weight_kg, recorded_at: new Date(m.recorded_at) }))
    .filter(m => m.recorded_at >= windowStart && m.recorded_at <= now)
  const { outliers } = detectWeightOutliers(allSorted)
  if (outliers.length > 0) {
    warnings.push({
      type: 'outlier_removed',
      message: `${outliers.length} avvikande mätning${outliers.length > 1 ? 'ar' : ''} filtrerades bort automatiskt.`,
    })
  }

  // Large deficit safeguard warning
  if (input.deficitPercent && input.deficitPercent > 25) {
    warnings.push({
      type: 'large_deficit',
      message:
        'Stort kaloriskt underskott kan påverka precisionen pga metabol anpassning. Justeringen har begränsats något.',
    })
  }

  // Glycogen event detection
  for (let i = 1; i < allMeasurements.length; i++) {
    const gap = daysBetween(allMeasurements[i - 1].recorded_at, allMeasurements[i].recorded_at)
    if (gap <= 3) {
      const diff = Math.abs(allMeasurements[i].weight_kg - allMeasurements[i - 1].weight_kg)
      const pct = (diff / allMeasurements[i - 1].weight_kg) * 100
      if (pct > 1.5) {
        warnings.push({
          type: 'glycogen_event',
          message:
            'Snabb viktförändring upptäckt som troligen beror på vätskevikt — trendberäkningen kompenserar för detta.',
        })
        break
      }
    }
  }

  // EMA divergence detection: flag non-monotonic trend if OLS and EMA disagree significantly
  if (olsResult && emaResult) {
    const emaChange = emaResult.trendEnd - emaResult.trendStart
    const olsChange = olsResult.trendEnd - olsResult.trendStart
    if (Math.abs(emaChange - olsChange) > 0.5) {
      warnings.push({
        type: 'glycogen_event', // reuse closest existing type; indicates unstable trend
        message:
          'Trendberäkningen visar tecken på icke-linjär viktförändring under perioden (t.ex. refeed-period). Resultatet kan vara mindre tillförlitligt.',
      })
    }
  }

  // Measurement distribution check: > 70% of measurements in first half = OLS extrapolation risk
  if (allMeasurements.length >= 4) {
    const windowStart = new Date(now.getTime() - input.periodDays * 24 * 60 * 60 * 1000)
    const midPoint = new Date(windowStart.getTime() + (input.periodDays / 2) * 86400000)
    const firstHalfCount = allMeasurements.filter(m => m.recorded_at < midPoint).length
    if (firstHalfCount / allMeasurements.length > 0.7) {
      warnings.push({
        type: 'low_confidence',
        message:
          'De flesta mätningarna är från periodens början — väg dig regelbundet under hela perioden för bättre precision.',
      })
    }
  }

  // TDEE confidence interval via OLS uncertainty propagation
  // calorieSE: 20% CV on logged intake, reduced by sqrt(n logged days)
  // weightChangeSE: OLS slope SE × actualDays
  // autocorrelation correction (~1.53 for ρ≈0.4 in daily bodyweight data), only for n≥7
  // t-distribution critical value for small samples (df = n-2)
  const tValues: Record<number, number> = { 1: 6.31, 2: 2.92, 3: 2.35, 4: 2.13, 5: 2.02 }
  const df = Math.max(1, allMeasurements.length - 2)
  const tCrit = df <= 5 ? (tValues[df] ?? 1.96) : 1.645

  let tdeeSE: number
  let tdeeLower90: number
  let tdeeUpper90: number

  if (olsResult) {
    const weightChangeSE = (olsResult.residualSd / Math.sqrt(olsResult.ssXX)) * actualDays
    const calorieSE = (averageCalories * 0.2) / Math.sqrt(Math.max(1, input.daysWithLogData))
    const balanceSE = (weightChangeSE * KCAL_PER_KG) / actualDays
    const autocorrFactor = allMeasurements.length >= 7 ? 1.53 : 1.0
    tdeeSE = Math.sqrt(calorieSE ** 2 + balanceSE ** 2) * autocorrFactor
    tdeeLower90 = Math.round(rawTDEE - tCrit * tdeeSE)
    tdeeUpper90 = Math.round(rawTDEE + tCrit * tdeeSE)
  } else {
    // Fallback: conservative fixed SE
    tdeeSE = 150
    tdeeLower90 = Math.round(rawTDEE - tCrit * tdeeSE)
    tdeeUpper90 = Math.round(rawTDEE + tCrit * tdeeSE)
  }

  const adjustmentPercent = ((clampedTDEE - input.currentTDEE) / input.currentTDEE) * 100
  const isStableMaintenance = Math.abs(weightChangeKg) < 0.1

  return {
    startCluster,
    endCluster,
    weightChangeKg,
    actualDays,
    averageCalories,
    calorieSource,
    foodLogCompleteness: input.foodLogCompleteness,
    foodLogWeight: adjustedFoodLogWeight,
    currentTDEE: input.currentTDEE,
    rawTDEE,
    clampedTDEE,
    adjustmentPercent,
    maxAllowedAdjustmentPercent: maxAdjPercent * 100,
    wasLimited,
    confidence,
    warnings,
    isStableMaintenance,
    coefficientOfVariation: cv,
    dataQuality,
    tdeeSE: Math.round(tdeeSE),
    tdeeLower90,
    tdeeUpper90,
    filteredOutliers: outliers,
    clampFactors: {
      lowSignal: isLowSignal,
      lowConfidence: isLowConfidenceClamp,
      largeDeficit: isLargeDeficit,
      dqiWasBindingCap,
    },
  }
}
