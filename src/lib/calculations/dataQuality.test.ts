import { describe, it, expect } from 'vitest'
import { calculateDataQualityIndex } from './calibration-quality'

/**
 * DQI mätte tidigare bara TÄTHET, aldrig LÄNGD. En 14-dagarsperiod med full
 * loggning fick därför samma betyg som 28 dagar — och därmed det största
 * justeringstaket, trots att den är minst tillförlitlig.
 *
 * Två oberoende skäl: tidig viktnedgång är till övervägande del vatten
 * (Hall 2016, ~87 % icke-fett dag 1–15), och vägbruset dämpas av periodens
 * längd (±177 kcal/dag vid 14 dagar mot ±62 vid 28).
 */

/** Perfekt data för en given period: full logg, vägning varannan dag, kluster 3+3 */
const perfect = (periodDays: number) =>
  calculateDataQualityIndex(100, Math.floor(periodDays / 2), periodDays, 3, 3)

describe('calculateDataQualityIndex — periodlängd', () => {
  it('ger högst betyg åt den längsta perioden', () => {
    expect(perfect(28).score).toBeGreaterThan(perfect(21).score)
    expect(perfect(21).score).toBeGreaterThan(perfect(14).score)
  })

  it('14 dagar med perfekt data når inte 100', () => {
    // Kärnan i buggen: tidigare fick den DQI 100 och ±200 kcal
    expect(perfect(14).score).toBeLessThan(100)
  })

  it('28 dagar är referens och kan nå 100', () => {
    expect(perfect(28).score).toBe(100)
  })

  it('kortare period ger lägre justeringstak', () => {
    expect(perfect(14).maxAbsoluteAdjustment).toBeLessThan(perfect(28).maxAbsoluteAdjustment)
  })

  it('dämpningen är multiplikativ, inte en fjärde komponent', () => {
    // Skillnaden mellan 14 och 28 dagar ska vara proportionell mot
    // grundpoängen — inte ett fast avdrag. Vid halverad grundpoäng ska
    // alltså även avdraget halveras.
    const braData14 = perfect(14).score
    const braData28 = perfect(28).score
    const svagData14 = calculateDataQualityIndex(45, 7, 14, 2, 2).score
    const svagData28 = calculateDataQualityIndex(45, 14, 28, 2, 2).score

    const avdragBra = braData28 - braData14
    const avdragSvag = svagData28 - svagData14
    expect(avdragSvag).toBeLessThan(avdragBra)
  })

  it('okänd periodlängd dämpas inte', () => {
    // Skyddsräcke: en period utanför 14/21/28 ska inte råka få 0
    const udda = calculateDataQualityIndex(100, 5, 10, 3, 3)
    expect(udda.score).toBeGreaterThan(0)
  })
})

describe('calculateDataQualityIndex — grundfaktorer', () => {
  it('gles matlogg sänker betyget mest', () => {
    // Loggen väger 45 %, tyngst av alla faktorer
    const utanLogg = calculateDataQualityIndex(0, 14, 28, 3, 3)
    const utanKluster = calculateDataQualityIndex(100, 14, 28, 1, 1)
    expect(utanLogg.score).toBeLessThan(utanKluster.score)
  })

  it('etiketten följer poängen', () => {
    expect(perfect(28).label).toBe('Utmärkt data')
    expect(calculateDataQualityIndex(0, 1, 28, 1, 1).label).toBe('Begränsad data')
  })

  it('taket ligger alltid inom 75–200 kcal', () => {
    for (const p of [14, 21, 28]) {
      for (const logg of [0, 50, 100]) {
        const r = calculateDataQualityIndex(logg, Math.floor(p / 2), p, 2, 2)
        expect(r.maxAbsoluteAdjustment).toBeGreaterThanOrEqual(75)
        expect(r.maxAbsoluteAdjustment).toBeLessThanOrEqual(200)
      }
    }
  })
})
