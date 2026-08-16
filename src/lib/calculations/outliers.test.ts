import { describe, it, expect } from 'vitest'
import { detectWeightOutliers } from './calibration-outliers'

/**
 * Outlier-detektionen mäter avvikelse mot VIKTTRENDEN, inte mot viktnivån.
 *
 * Tidigare tillämpades Tukeys IQR direkt på viktvärdena, vilket bara
 * fungerar när vikten är stabil. Vid en pågående viktförändring — alltså
 * exakt när kalibrering är aktuell — sprids vikterna ut av trenden och
 * filtret slutade fånga något. Ju snabbare nedgång, desto blindare.
 */

const DAY = 86400000
const T0 = new Date('2026-07-01T07:00:00Z').getTime()

/** Vägningar var annan dag längs en trend, med valfria avvikelser */
function series(
  days: number,
  startKg: number,
  kgPerDay: number,
  spikes: Record<number, number> = {}
) {
  const out: Array<{ weight_kg: number; recorded_at: Date }> = []
  for (let d = 0; d <= days; d += 2) {
    out.push({
      weight_kg: startKg - kgPerDay * d + (spikes[d] ?? 0),
      recorded_at: new Date(T0 + d * DAY),
    })
  }
  return out
}

describe('detectWeightOutliers — trendrelativ detektion', () => {
  it('fångar en avvikande SISTA vägning under pågående nedgång', () => {
    // Det verkliga fallet: OLS ger ändpunkterna störst hävstång, så en
    // brusig sista vägning drar hela trenden. Gamla filtret missade den
    // eftersom värdet låg mitt i det råa viktspannet.
    const data = series(28, 85, 0.05, { 28: 0.8 })
    const { outliers } = detectWeightOutliers(data)
    expect(outliers).toHaveLength(1)
    expect(outliers[0].recorded_at.getTime()).toBe(T0 + 28 * DAY)
  })

  it('fångar avvikelse mitt i perioden', () => {
    const data = series(28, 85, 0.05, { 14: 1.2 })
    const { outliers } = detectWeightOutliers(data)
    expect(outliers).toHaveLength(1)
  })

  it('fångar lika bra vid snabb som vid långsam nedgång', () => {
    // Gamla filtret krävde +0,90 kg vid 0,05 kg/dag men +1,80 kg vid
    // 0,10 kg/dag — känsligheten försämrades med brantare trend.
    const langsam = detectWeightOutliers(series(28, 85, 0.02, { 28: 0.8 }))
    const snabb = detectWeightOutliers(series(28, 85, 0.1, { 28: 0.8 }))
    expect(langsam.outliers).toHaveLength(1)
    expect(snabb.outliers).toHaveLength(1)
  })

  it('flaggar inte normal spridning kring trenden', () => {
    // ±0,3 kg dagsvariation är normalt och ska passera
    const data = series(28, 85, 0.05, { 4: 0.3, 10: -0.25, 18: 0.28, 24: -0.3 })
    const { outliers } = detectWeightOutliers(data)
    expect(outliers).toHaveLength(0)
  })

  it('flaggar inget när datan följer trenden exakt', () => {
    const { outliers, cleaned } = detectWeightOutliers(series(28, 85, 0.05))
    expect(outliers).toHaveLength(0)
    expect(cleaned).toHaveLength(15)
  })

  it('behåller stabil vikt utan trend', () => {
    const data = series(28, 85, 0)
    const { outliers } = detectWeightOutliers(data)
    expect(outliers).toHaveLength(0)
  })

  it('fångar avvikare även vid helt stabil vikt', () => {
    const data = series(28, 85, 0, { 12: 1.5 })
    const { outliers } = detectWeightOutliers(data)
    expect(outliers).toHaveLength(1)
  })
})

describe('detectWeightOutliers — skyddsräcken', () => {
  it('rör inte för små dataset', () => {
    const data = series(6, 85, 0.05)
    const { outliers, cleaned } = detectWeightOutliers(data)
    expect(outliers).toHaveLength(0)
    expect(cleaned).toHaveLength(data.length)
  })

  it('hanterar mätningar samma dag utan att krascha', () => {
    const same = Array.from({ length: 6 }, (_, i) => ({
      weight_kg: 85 + i * 0.1,
      recorded_at: new Date(T0),
    }))
    const { outliers, cleaned } = detectWeightOutliers(same)
    expect(outliers).toHaveLength(0)
    expect(cleaned).toHaveLength(6)
  })

  it('summan av cleaned och outliers bevarar all data', () => {
    const data = series(28, 85, 0.05, { 28: 0.8 })
    const { cleaned, outliers } = detectWeightOutliers(data)
    expect(cleaned.length + outliers.length).toBe(data.length)
  })

  it('kastar inte bort halva datan vid extremt brus', () => {
    // MAD är robust: även med flera avvikare ska majoriteten behållas
    const data = series(28, 85, 0.05, { 4: 1.5, 12: -1.4, 20: 1.6 })
    const { cleaned } = detectWeightOutliers(data)
    expect(cleaned.length).toBeGreaterThan(data.length / 2)
  })
})
