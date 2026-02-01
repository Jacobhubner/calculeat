import { useMemo } from 'react'
import type {
  WeightHistory,
  CalibrationHistory,
  CalibrationAvailability,
  Profile,
} from '@/lib/types'

const MIN_DATA_POINTS_7_DAYS = 3
const MIN_DATA_POINTS_14_DAYS = 4
const MIN_DATA_POINTS_21_DAYS = 5
const DAYS_BETWEEN_CALIBRATIONS = 7 // Recommend recalibration after 7 days

/**
 * Determine if TDEE calibration is available and recommended
 */
export function useCalibrationAvailability(
  profile: Profile | null | undefined,
  weightHistory: WeightHistory[] | undefined,
  lastCalibration: CalibrationHistory | null | undefined
): CalibrationAvailability {
  return useMemo(() => {
    const unavailable: CalibrationAvailability = {
      isAvailable: false,
      isRecommended: false,
      reason: 'Otillräckligt med data',
      minDataPoints: MIN_DATA_POINTS_7_DAYS,
      currentDataPoints: 0,
      daysSinceLastCalibration: null,
      weightTrend: 'insufficient_data',
      suggestedTimePeriod: 14,
    }

    if (!profile || !weightHistory) {
      return unavailable
    }

    // Check if TDEE is set
    if (!profile.tdee) {
      return {
        ...unavailable,
        reason: 'TDEE måste vara satt för att kalibrera',
      }
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const twentyOneDaysAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)

    // Filter weights by time periods
    const weights7Days = weightHistory.filter(w => new Date(w.recorded_at) >= sevenDaysAgo)
    const weights14Days = weightHistory.filter(w => new Date(w.recorded_at) >= fourteenDaysAgo)
    const weights21Days = weightHistory.filter(w => new Date(w.recorded_at) >= twentyOneDaysAgo)

    // Determine best available time period
    let suggestedTimePeriod: 7 | 14 | 21 = 14
    let minDataPoints = MIN_DATA_POINTS_14_DAYS
    let currentDataPoints = weights14Days.length

    if (weights21Days.length >= MIN_DATA_POINTS_21_DAYS) {
      suggestedTimePeriod = 21
      minDataPoints = MIN_DATA_POINTS_21_DAYS
      currentDataPoints = weights21Days.length
    } else if (weights14Days.length >= MIN_DATA_POINTS_14_DAYS) {
      suggestedTimePeriod = 14
      minDataPoints = MIN_DATA_POINTS_14_DAYS
      currentDataPoints = weights14Days.length
    } else if (weights7Days.length >= MIN_DATA_POINTS_7_DAYS) {
      suggestedTimePeriod = 7
      minDataPoints = MIN_DATA_POINTS_7_DAYS
      currentDataPoints = weights7Days.length
    }

    // Check if we have enough data for any period
    const isAvailable =
      weights7Days.length >= MIN_DATA_POINTS_7_DAYS ||
      weights14Days.length >= MIN_DATA_POINTS_14_DAYS ||
      weights21Days.length >= MIN_DATA_POINTS_21_DAYS

    if (!isAvailable) {
      return {
        ...unavailable,
        currentDataPoints: weightHistory.length,
        reason: `Behöver minst ${MIN_DATA_POINTS_7_DAYS} viktmätningar under 7 dagar`,
      }
    }

    // Calculate days since last calibration
    let daysSinceLastCalibration: number | null = null
    if (lastCalibration) {
      daysSinceLastCalibration = Math.floor(
        (now.getTime() - new Date(lastCalibration.calibrated_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    // Analyze weight trend
    const relevantWeights =
      suggestedTimePeriod === 21
        ? weights21Days
        : suggestedTimePeriod === 14
          ? weights14Days
          : weights7Days

    const sortedWeights = [...relevantWeights].sort(
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

      // Check for erratic fluctuations
      const weights = sortedWeights.map(w => w.weight_kg)
      const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
      const variance =
        weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = (stdDev / avgWeight) * 100

      if (coefficientOfVariation > 2) {
        weightTrend = 'erratic'
      } else if (weeklyChangePercent < -0.5) {
        weightTrend = 'losing'
      } else if (weeklyChangePercent > 0.5) {
        weightTrend = 'gaining'
      } else {
        weightTrend = 'stable'
      }
    }

    // Determine if calibration is recommended
    let isRecommended = false
    let reason = ''

    if (!lastCalibration) {
      isRecommended = true
      reason = 'Första kalibrering rekommenderas'
    } else if (
      daysSinceLastCalibration !== null &&
      daysSinceLastCalibration >= DAYS_BETWEEN_CALIBRATIONS
    ) {
      if (weightTrend === 'losing' || weightTrend === 'gaining') {
        isRecommended = true
        reason = `Vikten har ${weightTrend === 'losing' ? 'minskat' : 'ökat'} sedan senaste kalibreringen`
      } else if (weightTrend === 'stable' && daysSinceLastCalibration >= 14) {
        isRecommended = true
        reason = 'Dags att verifiera att TDEE fortfarande stämmer'
      }
    }

    if (!isRecommended && isAvailable) {
      reason = 'Kalibrering tillgänglig vid behov'
    }

    if (weightTrend === 'erratic') {
      reason = 'Oregelbunden viktdata - kalibrering kan vara opålitlig'
      isRecommended = false
    }

    return {
      isAvailable,
      isRecommended,
      reason,
      minDataPoints,
      currentDataPoints,
      daysSinceLastCalibration,
      weightTrend,
      suggestedTimePeriod,
    }
  }, [profile, weightHistory, lastCalibration])
}
