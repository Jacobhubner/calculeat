/**
 * Metabolic Calibration — Internal Helpers
 *
 * Pure utility functions shared across calibration modules.
 * Not re-exported from the barrel — internal use only.
 */

import { KCAL_PER_KG } from './calibration-constants'

export function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function stddev(values: number[]): number {
  const avg = mean(values)
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

export function meanDate(dates: Date[]): Date {
  const avg = dates.reduce((s, d) => s + d.getTime(), 0) / dates.length
  return new Date(avg)
}

/**
 * Context-aware energy density of weight change.
 * Base: 7700 kcal/kg (Hall 2008, mixed tissue).
 * Rapid loss: glycogen-heavy → lower effective density (~6500).
 * Rapid gain: glycogen refill → lower effective density (~6800).
 * Uses smooth linear interpolation to avoid step-function discontinuities.
 */
export function getEffectiveKcalPerKg(weeklyChangePct: number): number {
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
