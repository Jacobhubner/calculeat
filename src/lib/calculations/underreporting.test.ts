import { describe, it, expect } from 'vitest'
import { detectUnderreporting } from './calibration-quality'
import { getEffectiveKcalPerKg } from './calibration-helpers'

/**
 * Underrapportering är modellens största felkälla: ett intagsfel går rakt in
 * i TDEE 1:1, medan ett viktfel divideras med antalet dagar. Vid 28 dagar
 * dämpas 0,5 kg viktfel till 138 kcal — men 100 kcal intagsfel förblir 100.
 *
 * Litteraturen (dubbelmärkt vatten) visar 12–27 % underrapportering, vilket
 * motsvarar 300–700 kcal fel i TDEE för en typisk användare.
 */

const base = {
  previousTDEE: 3000,
  actualDays: 14,
  effectiveKcalPerKg: 7700,
}

describe('detectUnderreporting', () => {
  it('flaggar inte när loggen stämmer med vikten', () => {
    // TDEE 3000, äter 2450, går ner 1 kg på 14 dagar → balans −550/dag
    const r = detectUnderreporting({ ...base, loggedCaloriesAvg: 2450, weightChangeKg: -1.0 })
    expect(r.isLikely).toBe(false)
  })

  it('flaggar starkt när vikten står still trots stort loggat underskott', () => {
    // Loggar 2200 (−800 mot TDEE) men vikten rör sig inte: loggen saknar ~800
    const r = detectUnderreporting({ ...base, loggedCaloriesAvg: 2200, weightChangeKg: 0 })
    expect(r.severity).toBe('strong')
    expect(r.gapKcalPerDay).toBeCloseTo(800, 0)
  })

  it('flaggar milt vid måttligt gap', () => {
    // 435 kcal gap på 2400 loggat = 18 %, mitt i litteraturens spann 12–27 %
    const r = detectUnderreporting({ ...base, loggedCaloriesAvg: 2400, weightChangeKg: -0.3 })
    expect(r.severity).toBe('mild')
  })

  it('flaggar inte strax under tröskeln', () => {
    // 11,3 % — under 12 %-gränsen, ryms i normalt mätbrus
    const r = detectUnderreporting({ ...base, loggedCaloriesAvg: 2400, weightChangeKg: -0.6 })
    expect(r.severity).toBe('none')
  })

  it('flaggar INTE negativt gap (loggat över implicerat)', () => {
    // Överrapportering eller för lågt föregående TDEE — annan sak, annan åtgärd
    const r = detectUnderreporting({ ...base, loggedCaloriesAvg: 3200, weightChangeKg: -1.0 })
    expect(r.isLikely).toBe(false)
    expect(r.gapKcalPerDay).toBeLessThan(0)
  })

  it('avstår utan loggdata', () => {
    const r = detectUnderreporting({ ...base, loggedCaloriesAvg: null, weightChangeKg: -1.0 })
    expect(r.isLikely).toBe(false)
  })

  it('avstår när föregående TDEE saknas', () => {
    const r = detectUnderreporting({
      ...base,
      previousTDEE: 0,
      loggedCaloriesAvg: 2200,
      weightChangeKg: 0,
    })
    expect(r.isLikely).toBe(false)
  })

  it('gapet skalar med perioden', () => {
    // Samma viktförändring över dubbelt så lång tid = halva dagsbalansen
    const kort = detectUnderreporting({
      ...base,
      actualDays: 14,
      loggedCaloriesAvg: 2500,
      weightChangeKg: -1,
    })
    const lang = detectUnderreporting({
      ...base,
      actualDays: 28,
      loggedCaloriesAvg: 2500,
      weightChangeKg: -1,
    })
    expect(Math.abs(lang.gapKcalPerDay)).toBeGreaterThan(Math.abs(kort.gapKcalPerDay))
  })
})

describe('getEffectiveKcalPerKg — kontinuitet', () => {
  it('har inget hopp vid uppgångsgränsen', () => {
    // Före fixen: 7700 vid +0,49 och 6800 vid +0,51 — 900 kcal/kg på 0,02 %
    const a = getEffectiveKcalPerKg(0.49)
    const b = getEffectiveKcalPerKg(0.51)
    expect(Math.abs(a - b)).toBeLessThan(50)
  })

  it('är kontinuerlig över hela intervallet', () => {
    let prev = getEffectiveKcalPerKg(-2)
    let maxJump = 0
    for (let p = -2; p <= 2; p += 0.05) {
      const v = getEffectiveKcalPerKg(Math.round(p * 100) / 100)
      maxJump = Math.max(maxJump, Math.abs(v - prev))
      prev = v
    }
    // Rampens lutning ger ~60 kcal/kg per 0,05 %-steg
    expect(maxJump).toBeLessThanOrEqual(70)
  })

  it('behåller 7700 vid mycket långsam förändring', () => {
    expect(getEffectiveKcalPerKg(0)).toBe(7700)
    expect(getEffectiveKcalPerKg(0.2)).toBe(7700)
    expect(getEffectiveKcalPerKg(-0.2)).toBe(7700)
  })

  it('sänker densiteten vid snabb förändring åt båda håll', () => {
    expect(getEffectiveKcalPerKg(1.5)).toBeLessThan(7000)
    expect(getEffectiveKcalPerKg(-1.5)).toBeLessThan(7000)
  })
})
