/**
 * Metabolic Calibration — Outlier Detection
 */

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
