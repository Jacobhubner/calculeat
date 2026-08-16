import { describe, it, expect } from 'vitest'
import { detectWeekdayBias } from './calibration-quality'

/**
 * Veckodagsbias: den som loggar vardagar och hoppar helgen får ett för lågt
 * skattat intag och därmed ett för lågt TDEE. Den befintliga
 * detectSelectiveLogging missar fallet helt eftersom den kräver att loggat
 * intag ligger UNDER målet.
 *
 * Måndag 2026-08-03 … söndag 2026-08-09 används som referensvecka.
 */

const MON = '2026-08-03'
const week = (offset = 0) => {
  const base = new Date(`${MON}T12:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base.getTime() + (i + offset * 7) * 86400000)
    return d.toISOString().slice(0, 10)
  })
}
/** Bara vardagarna (mån–fre) i vecka `n` */
const weekdaysOf = (n = 0) => week(n).slice(0, 5)
/** Bara helgen (lör–sön) i vecka `n` */
const weekendOf = (n = 0) => week(n).slice(5)

describe('detectWeekdayBias', () => {
  it('flaggar inte ett representativt urval', () => {
    const r = detectWeekdayBias([...week(0), ...week(1)])
    expect(r.isLikely).toBe(false)
    expect(r.loggedWeekends).toBe(4)
    expect(r.loggedWeekdays).toBe(10)
  })

  it('flaggar starkt när helgen aldrig loggas', () => {
    // Det verkliga fallet: 10 vardagar, 0 helgdagar
    const r = detectWeekdayBias([...weekdaysOf(0), ...weekdaysOf(1)])
    expect(r.severity).toBe('strong')
    expect(r.loggedWeekends).toBe(0)
    expect(r.weekendShare).toBe(0)
  })

  it('flaggar starkt även åt andra hållet', () => {
    // Bara helger — ovanligare, men lika snedvridet
    const r = detectWeekdayBias([
      ...weekendOf(0),
      ...weekendOf(1),
      ...weekendOf(2),
      ...weekendOf(3),
    ])
    expect(r.severity).toBe('strong')
    expect(r.weekendShare).toBe(1)
  })

  it('flaggar milt vid delvis snedvridning', () => {
    // 10 vardagar + 1 helgdag: helgandel 1/11 ≈ 0.09 mot förväntat 0.29
    const r = detectWeekdayBias([...weekdaysOf(0), ...weekdaysOf(1), weekendOf(0)[0]])
    expect(r.severity).toBe('mild')
    expect(r.isLikely).toBe(true)
  })

  it('avstår när urvalet är för litet för att skilja mönster från slump', () => {
    const r = detectWeekdayBias(weekdaysOf(0)) // 5 dagar
    expect(r.isLikely).toBe(false)
    expect(r.severity).toBe('none')
  })

  it('hanterar tom lista', () => {
    const r = detectWeekdayBias([])
    expect(r.isLikely).toBe(false)
  })

  it('skew är 0 för perfekt representativt urval', () => {
    const r = detectWeekdayBias([...week(0), ...week(1)])
    expect(r.skew).toBeCloseTo(0, 5)
  })

  it('påverkas inte av tidszon (datum tolkas vid middagstid)', () => {
    // Lördag 2026-08-08 ska räknas som helg oavsett lokal tidszon
    const r = detectWeekdayBias([...weekdaysOf(0), '2026-08-08', '2026-08-09'])
    expect(r.loggedWeekends).toBe(2)
  })
})
