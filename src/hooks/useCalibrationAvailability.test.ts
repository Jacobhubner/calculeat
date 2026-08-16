import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalibrationAvailability } from './useCalibrationAvailability'
import { MIN_LOG_DAYS_FOR_CALIBRATION } from '@/lib/calculations/calibration'
import type { Profile, WeightHistory } from '@/lib/types'

// Entitlements slås av: testerna gäller datakraven, inte plangränserna.
vi.mock('@/hooks/useEntitlements', () => ({
  useEntitlements: () => ({ limits: { free_calibration_grace: -1 } }),
  isUnlimited: (v: number) => v === -1,
}))

/**
 * Grinden måste matcha runCalibration exakt. Gör den inte det visar appen
 * "Kalibrera nu" och användaren möts av ett felmeddelande efter klicket.
 */

function weights(count: number, spanDays = 14): WeightHistory[] {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now - (spanDays - (i * spanDays) / Math.max(1, count - 1)) * 86400000)
    return {
      id: `w${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.1,
      recorded_at: d.toISOString(),
      created_at: d.toISOString(),
    }
  })
}

const profile = { tdee: 2500, lifetime_calibration_count: 0 } as unknown as Profile

describe('useCalibrationAvailability — loggkravet', () => {
  it('nekar utan loggdagar även när vikterna räcker', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(10), null, 0))
    expect(result.current.isAvailable).toBe(false)
    expect(result.current.reason).toContain('loggade dagar')
  })

  it('nekar strax under tröskeln', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(10), null, MIN_LOG_DAYS_FOR_CALIBRATION - 1)
    )
    expect(result.current.isAvailable).toBe(false)
  })

  it('tillåter när båda kraven är uppfyllda', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(10), null, MIN_LOG_DAYS_FOR_CALIBRATION)
    )
    expect(result.current.isAvailable).toBe(true)
  })

  it('antar noll loggdagar när parametern utelämnas', () => {
    // Säker default: hellre neka än att erbjuda en kalibrering som failar
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(10), null))
    expect(result.current.isAvailable).toBe(false)
  })
})

describe('useCalibrationAvailability — progress', () => {
  it('rapporterar båda kraven separat', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(2), null, 3))
    const p = result.current.progress
    expect(p.logDays.current).toBe(3)
    expect(p.logDays.required).toBe(MIN_LOG_DAYS_FOR_CALIBRATION)
    expect(p.weighIns.required).toBeGreaterThan(0)
  })

  it('daysRemaining styrs av det krav som ligger längst efter', () => {
    // 1 vägning (behöver 4) = 3 kvar; 6 loggdagar (behöver 7) = 1 kvar
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(1), null, 6))
    const p = result.current.progress
    const expected = Math.max(
      p.weighIns.required - p.weighIns.current,
      p.logDays.required - p.logDays.current
    )
    expect(p.daysRemaining).toBe(expected)
  })

  it('daysRemaining är 0 när allt är uppfyllt', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(10), null, 20))
    expect(result.current.progress.daysRemaining).toBe(0)
  })

  it('går aldrig under noll vid överskott', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(30), null, 60))
    expect(result.current.progress.daysRemaining).toBe(0)
  })
})
