import { useMemo } from 'react'
import type {
  WeightHistory,
  CalibrationHistory,
  CalibrationAvailability,
  Profile,
} from '@/lib/types'
import {
  MIN_DATA_POINTS,
  MIN_CLUSTER_SIZE,
  MIN_NEW_WEIGHTS_AFTER_CALIBRATION,
  buildClusters,
} from '@/lib/calculations/calibration'
import { useEntitlements, isUnlimited } from '@/hooks/useEntitlements'

/**
 * Fallback om entitlements-svaret saknar de nya nycklarna (äldre RPC-version).
 * Skarpa värden kommer från get_plan_limits(), se docs/PREMIUM_SPEC.md.
 */
const DEFAULT_FREE_CALIBRATION_GRACE = 2
const DEFAULT_FREE_CALIBRATION_INTERVAL_DAYS = 180

/**
 * Determine if TDEE calibration is available and recommended.
 *
 * Uses the same thresholds and cluster logic as the actual calibration
 * calculation to avoid any mismatch between gate and execution.
 */
export function useCalibrationAvailability(
  profile: Profile | null | undefined,
  weightHistory: WeightHistory[] | undefined,
  lastCalibration: CalibrationHistory | null | undefined
): CalibrationAvailability {
  const { limits } = useEntitlements()
  const graceCount = limits.free_calibration_grace ?? DEFAULT_FREE_CALIBRATION_GRACE
  const intervalDays = limits.calibration_interval_days ?? DEFAULT_FREE_CALIBRATION_INTERVAL_DAYS
  /** premium/founder har grace = -1 (obegränsat) och passerar utan gräns */
  const planLimited = !isUnlimited(graceCount)

  return useMemo(() => {
    const unavailable: CalibrationAvailability = {
      isAvailable: false,
      isRecommended: false,
      reason: 'Otillräckligt med data',
      minDataPoints: MIN_DATA_POINTS[14],
      currentDataPoints: 0,
      daysSinceLastCalibration: null,
      daysUntilNextRecommended: null,
      weightTrend: 'insufficient_data',
      suggestedTimePeriod: 21,
      confidencePreview: 'unknown',
    }

    if (!profile || !weightHistory) {
      return unavailable
    }

    if (!profile.tdee) {
      return {
        ...unavailable,
        reason: 'TDEE måste vara satt för att kalibrera',
      }
    }

    const now = new Date()
    const periods: Array<14 | 21 | 28> = [28, 21, 14]

    // Find the best available period (longest first)
    let bestPeriod: 14 | 21 | 28 | null = null
    let bestClusterResult: ReturnType<typeof buildClusters> = null
    let bestWeightsInPeriod: WeightHistory[] = []

    for (const period of periods) {
      const cutoff = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
      const weightsInPeriod = weightHistory.filter(w => new Date(w.recorded_at) >= cutoff)

      if (weightsInPeriod.length < MIN_DATA_POINTS[period]) continue

      const clusters = buildClusters(weightHistory, period, now)
      if (!clusters) continue

      // Check minimum cluster sizes
      const minCluster = MIN_CLUSTER_SIZE[period]
      if (clusters.startCluster.count < minCluster || clusters.endCluster.count < minCluster)
        continue

      bestPeriod = period
      bestClusterResult = clusters
      bestWeightsInPeriod = weightsInPeriod
      break
    }

    if (!bestPeriod || !bestClusterResult) {
      return {
        ...unavailable,
        currentDataPoints: weightHistory.length,
        reason: `Behöver minst ${MIN_DATA_POINTS[14]} viktmätningar under 14 dagar`,
      }
    }

    // Calculate days since last calibration
    let daysSinceLastCalibration: number | null = null
    if (lastCalibration) {
      daysSinceLastCalibration = Math.floor(
        (now.getTime() - new Date(lastCalibration.calibrated_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    // Plan-gräns: gratisnivån får två fria kalibreringar, därefter 1×/6 mån.
    // De två fria finns för att användaren ska hinna uppleva loopen
    // (kalibrera → se TDEE justeras) innan intervallet börjar gälla.
    // premium/founder är obegränsat och passerar rakt igenom.
    if (planLimited && daysSinceLastCalibration !== null) {
      const usedCalibrations = profile.lifetime_calibration_count ?? 0
      const withinGrace = usedCalibrations < graceCount

      if (!withinGrace && daysSinceLastCalibration < intervalDays) {
        const daysLeft = intervalDays - daysSinceLastCalibration
        const months = Math.round(intervalDays / 30)
        return {
          ...unavailable,
          currentDataPoints: weightHistory.length,
          daysSinceLastCalibration,
          daysUntilNextRecommended: daysLeft,
          reason: `Nästa kalibrering om ${daysLeft} dagar — gratisnivån kalibrerar 1 gång var ${months}:e månad`,
        }
      }
    }

    // Analyze weight trend using sorted weights in the best period
    const sortedWeights = [...bestWeightsInPeriod].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )

    let weightTrend: CalibrationAvailability['weightTrend'] = 'stable'

    if (sortedWeights.length >= 2) {
      const firstWeight = sortedWeights[0].weight_kg
      const lastWeight = sortedWeights[sortedWeights.length - 1].weight_kg
      const changePercent = ((lastWeight - firstWeight) / firstWeight) * 100
      const daysDiff =
        (new Date(sortedWeights[sortedWeights.length - 1].recorded_at).getTime() -
          new Date(sortedWeights[0].recorded_at).getTime()) /
        (1000 * 60 * 60 * 24)
      const weeklyChangePercent = daysDiff > 0 ? (changePercent / daysDiff) * 7 : 0

      // CV-based erratic detection
      const weights = sortedWeights.map(w => w.weight_kg)
      const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
      const variance =
        weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length
      const coefficientOfVariation = (Math.sqrt(variance) / avgWeight) * 100

      if (coefficientOfVariation > 3) {
        weightTrend = 'erratic'
      } else if (weeklyChangePercent < -0.5) {
        weightTrend = 'losing'
      } else if (weeklyChangePercent > 0.5) {
        weightTrend = 'gaining'
      } else {
        weightTrend = 'stable'
      }
    }

    // Confidence preview
    let confidencePreview: CalibrationAvailability['confidencePreview'] = 'unknown'
    if (bestClusterResult) {
      const sc = bestClusterResult.startCluster.count
      const ec = bestClusterResult.endCluster.count
      if (sc >= 3 && ec >= 3) confidencePreview = 'high'
      else if (sc >= 2 || ec >= 2) confidencePreview = 'standard'
      else confidencePreview = 'low'
    }

    // B+ availability: no period overlap + at least MIN_NEW_WEIGHTS_AFTER_CALIBRATION new weights
    const RECOMMENDED_MIN_DAYS = 21
    let isRecommended = false
    let reason = ''

    if (!lastCalibration) {
      isRecommended = true
      reason = 'Första kalibrering rekommenderas'
    } else {
      const lastEndDate = new Date(lastCalibration.calibrated_at)
      lastEndDate.setHours(0, 0, 0, 0)

      const newWeightsAfterLast = (weightHistory ?? []).filter(
        w => new Date(w.recorded_at) > lastEndDate
      ).length
      const hasEnoughNewWeights = newWeightsAfterLast >= MIN_NEW_WEIGHTS_AFTER_CALIBRATION

      if (!hasEnoughNewWeights) {
        reason = `${newWeightsAfterLast} av ${MIN_NEW_WEIGHTS_AFTER_CALIBRATION} nya viktmätningar sedan senaste kalibreringen`
      } else if (
        daysSinceLastCalibration !== null &&
        daysSinceLastCalibration >= RECOMMENDED_MIN_DAYS
      ) {
        if (weightTrend === 'losing' || weightTrend === 'gaining') {
          isRecommended = true
          reason = `Vikten har ${weightTrend === 'losing' ? 'minskat' : 'ökat'} sedan senaste kalibreringen`
        } else if (weightTrend === 'stable' && daysSinceLastCalibration >= 28) {
          isRecommended = true
          reason = 'Dags att verifiera att TDEE fortfarande stämmer'
        } else {
          reason = 'Kalibrering tillgänglig vid behov'
        }
      } else {
        reason = 'Kalibrering tillgänglig vid behov'
      }
    }

    if (weightTrend === 'erratic') {
      reason = 'Oregelbunden viktdata — väg dig på morgonen före frukost för bäst resultat'
      isRecommended = false
    }

    const daysUntilNextRecommended = isRecommended
      ? 0
      : daysSinceLastCalibration !== null
        ? Math.max(0, RECOMMENDED_MIN_DAYS - daysSinceLastCalibration)
        : null

    return {
      isAvailable: true,
      isRecommended,
      reason,
      minDataPoints: MIN_DATA_POINTS[bestPeriod],
      currentDataPoints: bestWeightsInPeriod.length,
      daysSinceLastCalibration,
      daysUntilNextRecommended,
      weightTrend,
      suggestedTimePeriod: bestPeriod,
      confidencePreview,
    }
  }, [profile, weightHistory, lastCalibration, planLimited, graceCount, intervalDays])
}
