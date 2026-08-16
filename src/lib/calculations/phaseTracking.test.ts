import { describe, it, expect } from 'vitest'
import { phaseTracking } from './dietPhases'
import type { DietPhase } from '@/lib/types'

/**
 * Uppföljning av en pågående period: går det som planerat?
 *
 * Periodkortet visade tidigare bara MÅLET (kalorier, vecka, protein) men
 * aldrig UTFALLET. Det viktigaste designbeslutet här är toleransen: för snäv
 * och en följsam användare får höra att hen ligger efter, vilket är sämre än
 * ingen återkoppling alls.
 */

const START = '2026-07-01'
const TDEE = 2500

function phase(overrides: Partial<DietPhase> = {}): DietPhase {
  return {
    id: 'p1',
    user_id: 'u1',
    phase_type: 'cut',
    focus: 'health',
    started_at: START,
    ended_at: null,
    start_weight_kg: 85,
    target_calories: 2000, // 500 kcal underskott => ~0,45 kg/vecka ned
    planned_weeks: 12,
    protein_g_per_kg: 1.6,
    weekly_calorie_step: null,
    created_at: START,
    ...overrides,
  } as DietPhase
}

/** Vägning `dayOffset` dagar efter periodstart */
const w = (dayOffset: number, kg: number) => ({
  weight_kg: kg,
  recorded_at: new Date(
    new Date(`${START}T00:00:00`).getTime() + dayOffset * 86400000
  ).toISOString(),
})

describe('phaseTracking — underlag', () => {
  it('returnerar null med färre än två vägningar', () => {
    expect(phaseTracking(phase(), [w(0, 85)], TDEE)).toBeNull()
  })

  it('returnerar null utan vägningar', () => {
    expect(phaseTracking(phase(), [], TDEE)).toBeNull()
  })

  it('ignorerar vägningar från före periodstart', () => {
    const before = { weight_kg: 90, recorded_at: '2026-06-01T00:00:00.000Z' }
    const r = phaseTracking(phase(), [before, w(0, 85), w(14, 84)], TDEE)
    // Startvikten kommer från perioden (85), inte från junivägningen
    expect(r?.actualChangeKg).toBeCloseTo(-1, 5)
  })
})

describe('phaseTracking — för tidigt att bedöma', () => {
  it('säger too_early under 10 dagar', () => {
    // Vätske- och glykogensvängningar dominerar tidigt; en avläsning här
    // skulle säga "du ligger efter" åt någon som gör allt rätt.
    const r = phaseTracking(phase(), [w(0, 85), w(5, 84.8)], TDEE)
    expect(r?.status).toBe('too_early')
  })

  it('bedömer från och med dag 10', () => {
    const r = phaseTracking(phase(), [w(0, 85), w(10, 84.35)], TDEE)
    expect(r?.status).not.toBe('too_early')
  })
})

describe('phaseTracking — status mot förväntad takt', () => {
  it('on_track när takten följer underskottet', () => {
    // 500 kcal/dag => 0,4545 kg/vecka. Efter 14 dagar ≈ 0,91 kg ned.
    const r = phaseTracking(phase(), [w(0, 85), w(14, 84.09)], TDEE)
    expect(r?.status).toBe('on_track')
  })

  it('ahead när nedgången går snabbare än planerat', () => {
    const r = phaseTracking(phase(), [w(0, 85), w(14, 83.0)], TDEE)
    expect(r?.status).toBe('ahead')
  })

  it('behind när vikten knappt rör sig', () => {
    const r = phaseTracking(phase(), [w(0, 85), w(14, 84.9)], TDEE)
    expect(r?.status).toBe('behind')
  })

  it('tolererar normalt brus utan att flagga', () => {
    // 25 % långsammare än planerat ligger inom ±40 %
    const expected = 0.4545 * 2 // två veckor
    const r = phaseTracking(phase(), [w(0, 85), w(14, 85 - expected * 0.75)], TDEE)
    expect(r?.status).toBe('on_track')
  })

  it('räknar förväntad takt ur periodens kaloriunderskott', () => {
    const r = phaseTracking(phase(), [w(0, 85), w(14, 84)], TDEE)
    // (2000 - 2500) * 7 / 7700 = -0,4545 kg/vecka
    expect(r?.expectedPerWeek).toBeCloseTo(-0.4545, 3)
  })
})

describe('phaseTracking — underhållsperiod', () => {
  const maintenance = phase({ phase_type: 'maintenance', target_calories: 2500 })

  it('on_track när vikten är stabil', () => {
    const r = phaseTracking(maintenance, [w(0, 85), w(14, 85.1)], TDEE)
    expect(r?.status).toBe('on_track')
  })

  it('flaggar tydlig uppgång under underhåll', () => {
    const r = phaseTracking(maintenance, [w(0, 85), w(14, 86.5)], TDEE)
    expect(r?.status).toBe('ahead')
  })

  it('flaggar tydlig nedgång under underhåll', () => {
    const r = phaseTracking(maintenance, [w(0, 85), w(14, 83.5)], TDEE)
    expect(r?.status).toBe('behind')
  })
})

describe('phaseTracking — bulk', () => {
  it('on_track när vikten ökar enligt överskottet', () => {
    // 2750 kcal = +250 => +0,227 kg/vecka, 14 dagar ≈ +0,45 kg
    const bulk = phase({ phase_type: 'bulk', target_calories: 2750 })
    const r = phaseTracking(bulk, [w(0, 85), w(14, 85.45)], TDEE)
    expect(r?.status).toBe('on_track')
  })

  it('behind när vikten står still under bulk', () => {
    const bulk = phase({ phase_type: 'bulk', target_calories: 2750 })
    const r = phaseTracking(bulk, [w(0, 85), w(14, 85.0)], TDEE)
    expect(r?.status).toBe('behind')
  })
})
