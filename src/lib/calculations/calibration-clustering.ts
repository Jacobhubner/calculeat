/**
 * Metabolic Calibration — Cluster Building
 */

import type { WeightHistory, WeightCluster } from '@/lib/types'
import { daysBetween, meanDate, median } from './calibration-helpers'
import { detectWeightOutliers } from './calibration-outliers'

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
