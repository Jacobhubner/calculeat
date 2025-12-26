/**
 * Adaptive Thermogenesis (AT) Calculations
 *
 * Implementation according to ADAPTIVE_THERMOGENESIS_SPEC.md
 *
 * Core Principles:
 * - AT is ALWAYS calculated on baseline_bmr (NEVER on current/expected BMR)
 * - AT is a fixed reference point that is NOT automatically updated
 * - BMR_effective = BMR_expected + accumulated_at
 * - NO double-counting of weight effects
 */

import type { ATCalculationInput, ATCalculationResult } from '@/lib/types'

// AT Constants (from specification)
const AT_DEFICIT_RATE = -0.015 // -1.5% of baseline per week at deficit
const AT_SURPLUS_RATE = 0.0075 // +0.75% of baseline per week at surplus
const AT_MIN_LIMIT = -0.12 // Max -12% of baseline_bmr
const AT_MAX_LIMIT = 0.06 // Max +6% of baseline_bmr

/**
 * Calculate weekly Adaptive Thermogenesis (AT) change and effective BMR
 *
 * @param input - AT calculation input data
 * @returns AT calculation result with weekly change, accumulated AT, and effective BMR
 *
 * @example
 * ```typescript
 * const result = calculateWeeklyAT({
 *   baseline_bmr: 1750,
 *   current_bmr_expected: 1650, // After weight loss
 *   calorie_balance_7d: -3500, // 500 kcal/day deficit
 *   current_accumulated_at: -52.5 // Previous accumulated AT
 * })
 * // Result: {
 * //   at_weekly: -26.25,
 * //   accumulated_at: -78.75,
 * //   bmr_effective: 1571.25,
 * //   is_at_max_limit: false,
 * //   is_at_min_limit: false
 * // }
 * ```
 */
export function calculateWeeklyAT(input: ATCalculationInput): ATCalculationResult {
  const { baseline_bmr, current_bmr_expected, calorie_balance_7d, current_accumulated_at } = input

  // 1. Calculate weekly AT ONLY based on baseline_bmr
  let at_weekly = 0
  if (calorie_balance_7d < 0) {
    // Deficit -> metabolic downregulation
    at_weekly = AT_DEFICIT_RATE * baseline_bmr
  } else if (calorie_balance_7d > 0) {
    // Surplus -> metabolic upregulation
    at_weekly = AT_SURPLUS_RATE * baseline_bmr
  }
  // If calorie_balance = 0 → no change

  // 2. Calculate new accumulated AT
  let new_accumulated_at = current_accumulated_at + at_weekly

  // 3. Apply limits
  const min_limit = AT_MIN_LIMIT * baseline_bmr // -12%
  const max_limit = AT_MAX_LIMIT * baseline_bmr // +6%

  const is_at_min_limit = new_accumulated_at <= min_limit
  const is_at_max_limit = new_accumulated_at >= max_limit

  // Clamp to limits
  new_accumulated_at = Math.max(min_limit, Math.min(max_limit, new_accumulated_at))

  // 4. Calculate effective BMR
  // BMR_expected already contains weight/age/gender adjustments
  // accumulated_at is added as metabolic adaptation
  const bmr_effective = current_bmr_expected + new_accumulated_at

  return {
    at_weekly,
    accumulated_at: new_accumulated_at,
    bmr_effective,
    is_at_max_limit,
    is_at_min_limit,
  }
}

/**
 * Calculate AT percentage relative to baseline BMR
 *
 * @param accumulated_at - Current accumulated AT in kcal/day
 * @param baseline_bmr - Baseline BMR in kcal/day
 * @returns AT as percentage of baseline
 *
 * @example
 * ```typescript
 * const atPercent = calculateATPercent(-105, 1750)
 * // Returns: -6.0 (meaning -6% of baseline)
 * ```
 */
export function calculateATPercent(accumulated_at: number, baseline_bmr: number): number {
  if (baseline_bmr === 0) return 0
  return (accumulated_at / baseline_bmr) * 100
}

/**
 * Check if baseline BMR should be reset (manual check, not automatic)
 *
 * @param weeks_since_last_reset - Number of weeks since last baseline reset
 * @param weight_stable - Whether weight has been stable (±1kg) for the period
 * @param energy_balance_stable - Whether energy balance has been stable
 * @returns Whether baseline reset is recommended
 */
export function shouldRecommendBaselineReset(
  weeks_since_last_reset: number,
  weight_stable: boolean,
  energy_balance_stable: boolean
): boolean {
  // Recommend reset after 8-12 weeks of stable weight and energy balance
  return weeks_since_last_reset >= 8 && weight_stable && energy_balance_stable
}
