import { describe, it, expect } from 'vitest'
import { MIN_LOG_DAYS_FOR_CALIBRATION } from '@/lib/calculations/calibration-constants'

/**
 * Modalen påstår konkreta tal för att motivera fyra veckors mätning.
 * Stämmer de inte med koden är hela argumentet falskt — och det är ett
 * argument som ber användaren skjuta upp det hon vill göra.
 */
describe('MeasureFirstInfo — talen i texten', () => {
  it('sju loggdagar stämmer med kravet i koden', () => {
    expect(MIN_LOG_DAYS_FOR_CALIBRATION).toBe(7)
  })

  it('exemplet med aktivitetsnivån räknar rätt', () => {
    // Kvinna 95 kg, 165 cm, 40 år (Mifflin)
    const bmr = 10 * 95 + 6.25 * 165 - 5 * 40 - 161
    const valt = bmr * 1.375 // "lätt aktiv"
    const verkligt = bmr * 1.2 // stillasittande
    const intag = valt * 0.775 // 22,5 % underskott

    expect(Math.round(valt)).toBe(2228)
    expect(Math.round(verkligt)).toBe(1944)
    expect(Math.round(intag)).toBe(1727)

    // Ett steg fel på reglaget är ~13 %
    expect(Math.round(((valt - verkligt) / valt) * 100)).toBe(13)

    // Lovad takt mot faktisk
    const lovat = ((valt - intag) * 7) / 7700
    const faktiskt = ((verkligt - intag) * 7) / 7700
    expect(lovat.toFixed(2)).toBe('0.46')
    expect(faktiskt.toFixed(2)).toBe('0.20')
  })

  it('mätosäkerheten motiverar fyra veckor framför två', () => {
    // ±177 kcal vid 14 dagar, ±62 vid 28 (calibration-quality.ts)
    const typisktUnderskott = 500
    expect(Math.round((177 / typisktUnderskott) * 100)).toBe(35) // en tredjedel
    expect(Math.round((62 / typisktUnderskott) * 100)).toBe(12) // en tiondel
  })
})
