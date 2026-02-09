/**
 * Metabolic Calibration — Pure calculation module
 *
 * Calculates TDEE from weight change data using cluster averaging.
 * The selected period is divided into thirds; start and end clusters
 * are averaged separately to dampen day-to-day water/glycogen noise.
 *
 * Key constants (physiological justification in comments):
 * - 7700 kcal/kg — consensus energy content of body weight change (Hall 2008, Thomas et al. 2014)
 * - 1.5%/week — max plausible tissue change rate (Helms et al. 2014 + margin)
 * - CV thresholds — based on normal daily fluctuation (~0.5-1% of body weight)
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

/** Minimum data points per period */
export const MIN_DATA_POINTS: Record<14 | 21 | 28, number> = {
  14: 4,
  21: 5,
  28: 6,
}

/** Minimum cluster size per period */
export const MIN_CLUSTER_SIZE: Record<14 | 21 | 28, number> = {
  14: 1,
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

/** Min food-log completeness to use actual data */
const MIN_FOOD_LOG_COMPLETENESS = 70

// ─── Helpers ────────────────────────────────────────────────────────

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
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

  const thirdMs = (periodDays * 24 * 60 * 60 * 1000) / 3
  const startZoneEnd = new Date(windowStart.getTime() + thirdMs)
  const endZoneStart = new Date(now.getTime() - thirdMs)

  let startItems = sorted.filter(m => m.recorded_at <= startZoneEnd)
  let endItems = sorted.filter(m => m.recorded_at >= endZoneStart)

  // Fallback: extend to 50% if a cluster is empty
  if (startItems.length === 0) {
    const halfEnd = new Date(windowStart.getTime() + (periodDays * 24 * 60 * 60 * 1000) / 2)
    startItems = sorted.filter(m => m.recorded_at <= halfEnd)
  }
  if (endItems.length === 0) {
    const halfStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000) / 2)
    endItems = sorted.filter(m => m.recorded_at >= halfStart)
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
    return { weights, dates, average: mean(weights), count: items.length, spanDays: span }
  }

  return {
    startCluster: makeCluster(startItems),
    endCluster: makeCluster(endItems),
    allMeasurements: sorted,
  }
}

// ─── Confidence ─────────────────────────────────────────────────────

export function calculateConfidence(
  startClusterSize: number,
  endClusterSize: number,
  foodLogCompleteness: number,
  periodDays: 14 | 21 | 28
): CalibrationConfidence {
  let level: CalibrationConfidence['level']
  if (startClusterSize >= 3 && endClusterSize >= 3) {
    level = 'high'
  } else if (startClusterSize >= 2 || endClusterSize >= 2) {
    level = 'standard'
  } else {
    level = 'low'
  }
  return { level, startClusterSize, endClusterSize, foodLogCompleteness, periodDays }
}

// ─── Adaptive Clamp ─────────────────────────────────────────────────

export function getMaxAdjustment(
  confidence: CalibrationConfidence,
  isFirstCalibration: boolean
): number {
  let maxPercent = BASE_MAX_ADJUSTMENT[confidence.periodDays] ?? 0.15

  // Boost for high confidence + good food log
  if (confidence.level === 'high' && confidence.foodLogCompleteness >= 80) {
    maxPercent *= 1.25
  }

  // Reduce for low confidence
  if (confidence.level === 'low') {
    maxPercent *= 0.6
  }

  // Reduce when using target calories
  if (confidence.foodLogCompleteness < MIN_FOOD_LOG_COMPLETENESS) {
    maxPercent *= 0.5
  }

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
  now?: Date
}

/**
 * Run the full calibration pipeline.
 * Returns a CalibrationResult on success, or a string error message on failure.
 */
export function runCalibration(input: CalibrationInput): CalibrationResult | string {
  const now = input.now ?? new Date()

  // Step 1: Build clusters
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

  // Step 3: Calculate weight change
  const weightChangeKg = endCluster.average - startCluster.average
  const startCentroid = meanDate(startCluster.dates)
  const endCentroid = meanDate(endCluster.dates)
  const actualDays = Math.max(7, daysBetween(startCentroid, endCentroid))

  // Step 4: Determine calorie source
  const useFoodLog = input.foodLogCompleteness >= MIN_FOOD_LOG_COMPLETENESS
  const calorieSource: 'food_log' | 'target_calories' = useFoodLog ? 'food_log' : 'target_calories'
  const averageCalories =
    useFoodLog && input.actualCaloriesAvg !== null ? input.actualCaloriesAvg : input.targetCalories

  // Step 5: Calculate TDEE
  const totalCalorieBalance = weightChangeKg * KCAL_PER_KG
  const dailyCalorieBalance = totalCalorieBalance / actualDays
  const rawTDEE = averageCalories - dailyCalorieBalance

  // Step 6: Confidence and adaptive clamp
  const confidence = calculateConfidence(
    startCluster.count,
    endCluster.count,
    input.foodLogCompleteness,
    input.periodDays
  )
  const maxAdjPercent = getMaxAdjustment(confidence, input.isFirstCalibration)
  const maxTDEE = Math.min(TDEE_CEILING, input.currentTDEE * (1 + maxAdjPercent))
  const minTDEE = Math.max(TDEE_FLOOR, input.currentTDEE * (1 - maxAdjPercent))
  const clampedTDEE = Math.max(minTDEE, Math.min(maxTDEE, rawTDEE))
  const wasLimited = Math.abs(clampedTDEE - rawTDEE) > 0.5

  // Step 7: TDEE floor/ceiling absolute check
  if (rawTDEE < TDEE_FLOOR) {
    return `Kalibrerat TDEE (${Math.round(rawTDEE)} kcal) är under rekommenderad minimigräns (${TDEE_FLOOR} kcal). Kontrollera din matloggning.`
  }
  if (rawTDEE > TDEE_CEILING) {
    return `Kalibrerat TDEE (${Math.round(rawTDEE)} kcal) är orealistiskt högt. Kontrollera viktdata och matloggning.`
  }

  // Step 8: Collect warnings
  const warnings: CalibrationWarning[] = []
  const allWeights = allMeasurements.map(m => m.weight_kg)
  const cv = (stddev(allWeights) / mean(allWeights)) * 100

  if (cv > CV_WARNING_THRESHOLD) {
    warnings.push({
      type: 'high_cv',
      message: 'Vikten varierar mer än vanligt. Resultatet kan vara mindre tillförlitligt.',
    })
  }

  // Timing inconsistency check
  const hours = allMeasurements.map(m => m.recorded_at.getHours() + m.recorded_at.getMinutes() / 60)
  if (hours.length >= 3 && stddev(hours) > 4) {
    warnings.push({
      type: 'timing_inconsistency',
      message:
        'Dina mätningar är från olika tider på dygnet. Väg dig samma tid varje dag för bäst resultat.',
    })
  }

  if (calorieSource === 'target_calories') {
    warnings.push({
      type: 'target_calories_fallback',
      message: `Använder målkalorier (${Math.round(averageCalories)} kcal/dag) eftersom matlogg saknas. Om du äter mer/mindre än målet blir kalibreringen missvisande.`,
    })
  }

  if (confidence.level === 'low') {
    warnings.push({
      type: 'low_confidence',
      message: 'Låg tillförlitlighet — väg dig minst 3 gånger per vecka för bättre precision.',
    })
  }

  if (wasLimited) {
    warnings.push({
      type: 'large_adjustment',
      message: `Justerad till max ±${Math.round(maxAdjPercent * 100)}% av nuvarande TDEE.`,
    })
  }

  // Glycogen event detection: consecutive measurements within 3 days differing >1.5% body weight
  for (let i = 1; i < allMeasurements.length; i++) {
    const gap = daysBetween(allMeasurements[i - 1].recorded_at, allMeasurements[i].recorded_at)
    if (gap <= 3) {
      const diff = Math.abs(allMeasurements[i].weight_kg - allMeasurements[i - 1].weight_kg)
      const pct = (diff / allMeasurements[i - 1].weight_kg) * 100
      if (pct > 1.5) {
        warnings.push({
          type: 'glycogen_event',
          message: 'Stor viktförändring på kort tid kan bero på vätskevikt, inte fettförändring.',
        })
        break
      }
    }
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
  }
}
