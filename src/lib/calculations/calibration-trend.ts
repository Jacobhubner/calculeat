/**
 * Metabolic Calibration — Weight Trend Estimation
 *
 * Primary: OLS linear regression (calculateWeightTrendOLS)
 * Secondary: EMA smoothing (calculateWeightTrend) — used for divergence detection
 */

export interface OLSTrendResult {
  trendStart: number
  trendEnd: number
  slopeKgPerDay: number
  rSquared: number
  residualSd: number
  ssXX: number
  /** Last x value in days (= actual time span covered by measurements) */
  lastX: number
  /**
   * Signal-to-noise ratio as OLS t-statistic of the slope: |slope| / (residualSd / √n).
   * Period-invariant: unlike |slope×lastX|/residualSd, this does not grow with window
   * length when the underlying signal/noise ratio is constant.
   * Equivalent to asking "is the slope larger than its own standard error?"
   * SNR < 1.0 → slope smaller than its SE, noise dominates → degrade confidence.
   * More robust than R² for daily weigh-ins where natural fluctuations (0.5–2 kg)
   * suppress R² even when the underlying trend is real.
   */
  snr: number
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
  // SNR as t-statistic of the slope: slope / (residualSd / √n).
  // Period-invariant: a 28-day and 14-day window with identical daily signal/noise
  // produce the same SNR (unlike |slope×lastX|/residualSd which grows with period).
  // Threshold 1.0: t ≥ 1 means the slope is at least as large as its standard error.
  const snr = residualSd > 0 ? Math.abs(slope) / (residualSd / Math.sqrt(n)) : 0

  return {
    trendStart: intercept,
    trendEnd: intercept + slope * lastX,
    slopeKgPerDay: slope,
    rSquared,
    residualSd,
    ssXX,
    lastX,
    snr,
  }
}

// ─── Theil-Sen Robust Slope Estimator ───────────────────────────────────────

export interface TheilSenResult {
  /** Median of all pairwise slopes (kg/day) — robust to outliers */
  medianSlope: number
}

/**
 * Theil-Sen estimator: median of all pairwise slopes between measurement pairs.
 *
 * Used as a robust cross-check against OLS. Because it uses the median rather
 * than the mean of pairwise slopes, a single extreme data point cannot skew
 * the result — unlike OLS which minimises squared residuals.
 *
 * Complexity: O(n²) pairs. With n ≤ 28 this gives ≤ 378 pairs — negligible cost.
 * Returns null if fewer than 3 measurements (need at least 3 for a meaningful median).
 */
export function calculateWeightTrendTheilSen(
  measurements: Array<{ weight_kg: number; recorded_at: Date }>
): TheilSenResult | null {
  if (measurements.length < 3) return null

  const sorted = [...measurements].sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime())
  const slopes: number[] = []

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const deltaDays =
        (sorted[j].recorded_at.getTime() - sorted[i].recorded_at.getTime()) / 86400000
      if (deltaDays === 0) continue // skip same-day measurements
      slopes.push((sorted[j].weight_kg - sorted[i].weight_kg) / deltaDays)
    }
  }

  if (slopes.length === 0) return null

  slopes.sort((a, b) => a - b)
  const mid = Math.floor(slopes.length / 2)
  const medianSlope = slopes.length % 2 !== 0 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2

  return { medianSlope }
}

// ─── EMA Trend ───────────────────────────────────────────────────────────────

/**
 * Calculate weight change using exponential smoothing trend.
 * More robust than raw cluster means against water/glycogen noise.
 * Returns trend start and end values based on smoothed series.
 *
 * Used as secondary estimator for EMA/OLS divergence detection.
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
