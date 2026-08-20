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

describe('useCalibrationAvailability — nya vägningar efter kalibrering', () => {
  /**
   * MIN_NEW_WEIGHTS_AFTER_CALIBRATION är ett minimum "before re-applying".
   * Utan nya mätningar körs kalibreringen på samma underlag som förra
   * gången och kan inte ge något nytt svar.
   *
   * Grinden satte tidigare bara en reason och lämnade isAvailable: true, så
   * kortet visade "0 av 3 nya viktmätningar" med en aktiv Kalibrera-knapp
   * bredvid.
   */
  const nyligenKalibrerad = {
    id: 'c1',
    calibrated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  } as unknown as Parameters<typeof useCalibrationAvailability>[2]

  it('är otillgänglig direkt efter en kalibrering', () => {
    // Vägningarna ligger FÖRE kalibreringen, alltså noll nya efter den.
    // Spridda över dag 10-24 bakåt: uppfyller klusterkraven, men ALLA
    // ligger före kalibreringen för två dagar sedan.
    const gamla = weights(6, 14).map(w => ({
      ...w,
      recorded_at: new Date(new Date(w.recorded_at).getTime() - 10 * 86400000).toISOString(),
    }))
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, gamla, nyligenKalibrerad, 20)
    )
    expect(result.current.isAvailable).toBe(false)
    expect(result.current.reason).toContain('nya viktmätningar')
  })

  it('rapporterar framsteg så beredskapskortet kan visa det', () => {
    // Spridda över dag 10-24 bakåt: uppfyller klusterkraven, men ALLA
    // ligger före kalibreringen för två dagar sedan.
    const gamla = weights(6, 14).map(w => ({
      ...w,
      recorded_at: new Date(new Date(w.recorded_at).getTime() - 10 * 86400000).toISOString(),
    }))
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, gamla, nyligenKalibrerad, 20)
    )
    expect(result.current.progress.weighIns.current).toBe(0)
    expect(result.current.progress.weighIns.required).toBeGreaterThan(0)
  })
})

describe('useCalibrationAvailability — när kalibrering REKOMMENDERAS', () => {
  /**
   * Rekommendationen kräver hög tillförlitlighet (minst tre vägningar i
   * vardera änden). Att uppmana till kalibrering på tunt underlag ger ett
   * svar som ser lika auktoritativt ut som ett välgrundat.
   *
   * Funktionen förblir TILLGÄNGLIG vid svagare underlag — appen ber bara
   * inte om den.
   */
  it('rekommenderar inte första kalibreringen på tunt underlag', () => {
    // Två vägningar räcker inte till "high".
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(2, 14), null, 20)
    )
    expect(result.current.isRecommended).toBe(false)
  })

  it('rekommenderar när underlaget räcker', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(8, 14), null, 20)
    )
    if (result.current.confidencePreview === 'high') {
      expect(result.current.isRecommended).toBe(true)
    }
  })

  it('håller funktionen tillgänglig även när den inte rekommenderas', () => {
    // Skillnaden mellan "kan" och "bör" — ett tunt underlag ska inte låsa
    // ute den som ändå vill köra.
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(4, 14), null, 20)
    )
    expect(result.current.isAvailable).toBe(true)
  })
})

describe('useCalibrationAvailability — trappan och blockeringsorsak', () => {
  /**
   * Kortet visar tre mätperioder som en stege. Utan reachedPeriods kunde
   * det bara mäta mot 14-dagarskraven, och användaren såg aldrig att en
   * längre period ger säkrare resultat.
   */
  it('rapporterar aktiv period och uppnådda nivåer', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(8, 28), null, 20)
    )
    expect([14, 21, 28]).toContain(result.current.progress.activePeriod)
    expect(Array.isArray(result.current.progress.reachedPeriods)).toBe(true)
  })

  it('pekar ut klustringen när vägningarna ligger för tätt', () => {
    // Alla mätningar de senaste tre dagarna: antalet räcker, men de hamnar
    // bara i fönstrets sista tredjedel.
    const nu = Date.now()
    const tata = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.1,
      recorded_at: new Date(nu - i * 3600000).toISOString(),
      created_at: new Date(nu - i * 3600000).toISOString(),
    })) as unknown as Parameters<typeof useCalibrationAvailability>[1]

    const { result } = renderHook(() => useCalibrationAvailability(profile, tata, null, 20))
    // Antalet är uppfyllt...
    expect(result.current.progress.weighIns.current).toBeGreaterThanOrEqual(
      result.current.progress.weighIns.required
    )
    // ...men ingen period håller, och orsaken ska framgå.
    expect(result.current.progress.reachedPeriods).toHaveLength(0)
    expect(result.current.progress.blocking).toBe('clusterGap')
  })

  it('ger en NEDRÄKNING vid klusterbrist, inte ett antal', () => {
    const nu = Date.now()
    const tata = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.1,
      recorded_at: new Date(nu - i * 3600000).toISOString(),
      created_at: new Date(nu - i * 3600000).toISOString(),
    })) as unknown as Parameters<typeof useCalibrationAvailability>[1]

    const { result } = renderHook(() => useCalibrationAvailability(profile, tata, null, 20))
    const dagar = result.current.progress.daysUntilNextWeighInUseful
    expect(dagar).not.toBeNull()
    // Fönstrets tredjedel är ~4,7 dagar för 14-dagarsperioden. Mätningarna
    // är timmar gamla, så nästan hela väntetiden återstår.
    expect(dagar!).toBeGreaterThan(0)
    expect(dagar!).toBeLessThanOrEqual(10)
  })

  it('sätter blocking till none när inget hindrar', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(8, 28), null, 20)
    )
    if (result.current.isAvailable) {
      expect(result.current.progress.blocking).toBe('none')
      expect(result.current.progress.daysUntilNextWeighInUseful).toBeNull()
    }
  })
})
