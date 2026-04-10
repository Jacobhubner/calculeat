/**
 * Metabolic Calibration — Core Pipeline
 *
 * Orchestrates the full calibration pipeline: validation → clustering →
 * trend estimation → TDEE calculation → confidence → clamp → warnings → CI.
 */

import type { WeightHistory, CalibrationResult, CalibrationWarning } from '@/lib/types'
import {
  KCAL_PER_KG,
  MIN_DATA_POINTS,
  TDEE_FLOOR,
  TDEE_CEILING,
  MAX_WEEKLY_CHANGE_PERCENT,
  CV_WARNING_THRESHOLD,
  CV_BLOCK_THRESHOLD,
  LOW_SIGNAL_THRESHOLD_PERCENT,
} from './calibration-constants'
import { mean, stddev, daysBetween, meanDate, getEffectiveKcalPerKg } from './calibration-helpers'
import { detectWeightOutliers } from './calibration-outliers'
import { calculateWeightTrendOLS, calculateWeightTrend } from './calibration-trend'
import { buildClusters } from './calibration-clustering'
import {
  getCalorieEstimate,
  detectSelectiveLogging,
  calculateDataQualityIndex,
  calculateConfidence,
  getMaxAdjustment,
} from './calibration-quality'

// ─── Validation ──────────────────────────────────────────────────────────────

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
  startCluster: import('@/lib/types').WeightCluster,
  endCluster: import('@/lib/types').WeightCluster,
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

// ─── Main Calibration ────────────────────────────────────────────────────────

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

  // Step 4: Determine calorie source with soft prior model
  const selectiveLogging = detectSelectiveLogging(
    input.actualCaloriesAvg,
    input.targetCalories,
    input.foodLogCompleteness,
    weightChangeKg
  )

  let { averageCalories, priorWeight } = getCalorieEstimate(
    input.actualCaloriesAvg,
    input.targetCalories,
    input.daysWithLogData,
    input.periodDays
  )

  // Selective logging: reduce prior pull further so logged data dominates even more
  if (selectiveLogging.isLikely) {
    const trustFactor = selectiveLogging.severity === 'strong' ? 0.5 : 0.75
    priorWeight = priorWeight * trustFactor
    averageCalories =
      input.actualCaloriesAvg! * (1 - priorWeight) + input.targetCalories * priorWeight
  }

  // adjustedFoodLogWeight kept for return object / UI compatibility
  const adjustedFoodLogWeight = input.actualCaloriesAvg !== null ? 1 - priorWeight : 0

  const calorieSource: CalibrationResult['calorieSource'] =
    priorWeight <= 0.05
      ? 'food_log'
      : input.actualCaloriesAvg === null
        ? 'target_calories'
        : 'blended'

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
    olsResult?.snr
  )

  const dataQuality = calculateDataQualityIndex(
    input.foodLogCompleteness,
    allMeasurements.length,
    input.periodDays,
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

  // Non-linearity detection: hybrid rule + curvature check
  {
    // --- Hybrid EMA/OLS divergence rule ---
    let divergenceFlag = false
    if (olsResult && emaResult) {
      const emaChange = emaResult.trendEnd - emaResult.trendStart
      const olsChange = olsResult.trendEnd - olsResult.trendStart
      const diff = Math.abs(emaChange - olsChange)
      // Trigger only when the difference is both absolutely noticeable AND
      // large relative to the trend magnitude (avoids false positives in short periods)
      if (diff > 0.5 && diff / Math.max(Math.abs(olsChange), 0.5) > 0.4) {
        divergenceFlag = true
      }
    }

    // --- Curvature check: compare OLS slope of first half vs second half ---
    let curvatureFlag = false
    if (allMeasurements.length >= 6) {
      const mid = Math.floor(allMeasurements.length / 2)
      const firstHalf = allMeasurements.slice(0, mid)
      const secondHalf = allMeasurements.slice(mid)
      const firstOls = calculateWeightTrendOLS(firstHalf)
      const secondOls = calculateWeightTrendOLS(secondHalf)
      if (firstOls && secondOls) {
        const firstChange = firstOls.trendEnd - firstOls.trendStart
        const secondChange = secondOls.trendEnd - secondOls.trendStart
        const curvature = Math.abs(secondChange - firstChange)
        // Flag if the two halves move in opposite directions with at least 0.6 kg swing each
        const oppositeDirections = firstChange * secondChange < 0
        if (oppositeDirections && curvature > 1.0) {
          curvatureFlag = true
        }
      }
    }

    if (divergenceFlag || curvatureFlag) {
      warnings.push({
        type: 'nonlinear_trend',
        message:
          'Trendberäkningen visar tecken på icke-linjär viktförändring under perioden (t.ex. refeed-period). Resultatet kan vara mindre tillförlitligt.',
      })
    }
  }

  // Measurement distribution check: > 70% of measurements in first half = OLS extrapolation risk
  if (allMeasurements.length >= 4) {
    const windowStartForDist = new Date(now.getTime() - input.periodDays * 24 * 60 * 60 * 1000)
    const midPoint = new Date(windowStartForDist.getTime() + (input.periodDays / 2) * 86400000)
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
    loggedCaloriesAvg: input.actualCaloriesAvg,
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
