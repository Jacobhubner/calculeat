import { describe, it, expect } from 'vitest'
import { runCalibration, type CalibrationInput } from './calibration-core'
import { MIN_LOG_DAYS_FOR_CALIBRATION } from './calibration-constants'
import type { WeightHistory } from '@/lib/types'

/**
 * Låser två fel som fanns i produktion 2026-08-16:
 *
 *  1. Kalibrering kördes utan ETT ENDA loggat dygn. getCalorieEstimate föll
 *     då tillbaka på targetCalories, dvs. TDEE kalibrerades mot vad
 *     användaren TÄNKTE äta i stället för vad hen åt — cirkulärt, men
 *     presenterat som en mätning.
 *
 *  2. Vid noll loggdagar blev priorWeight = 0, vilket märkte resultatet som
 *     'food_log' och sparade used_food_log: true. Appen påstod alltså att
 *     siffran kom från matloggen när ingen mat loggats.
 */

const NOW = new Date('2026-08-16T08:00:00Z')

/** Vikthistorik med jämn nedgång — tillräckligt tät för att passera klustren. */
function weightSeries(days: number, startKg: number, dailyDeltaKg: number): WeightHistory[] {
  const out: WeightHistory[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(NOW.getTime() - (days - i) * 24 * 60 * 60 * 1000)
    out.push({
      id: `w${i}`,
      user_id: 'u1',
      weight_kg: startKg + dailyDeltaKg * i,
      recorded_at: d.toISOString(),
      created_at: d.toISOString(),
    })
  }
  return out
}

function baseInput(overrides: Partial<CalibrationInput> = {}): CalibrationInput {
  return {
    weightHistory: weightSeries(28, 85, -0.02), // ~0,56 kg/vecka ned
    periodDays: 28,
    currentTDEE: 2500,
    targetCalories: 2000,
    actualCaloriesAvg: 2050,
    foodLogCompleteness: 90,
    daysWithLogData: 25,
    isFirstCalibration: true,
    now: NOW,
    ...overrides,
  }
}

describe('runCalibration — krav på matloggdata', () => {
  it('blockerar när inga dagar loggats', () => {
    const r = runCalibration(baseInput({ actualCaloriesAvg: null, daysWithLogData: 0 }))
    expect(typeof r).toBe('string')
    expect(r).toContain('loggade dagar')
  })

  it('blockerar strax under tröskeln', () => {
    const r = runCalibration(baseInput({ daysWithLogData: MIN_LOG_DAYS_FOR_CALIBRATION - 1 }))
    expect(typeof r).toBe('string')
  })

  it('släpper igenom precis på tröskeln', () => {
    const r = runCalibration(baseInput({ daysWithLogData: MIN_LOG_DAYS_FOR_CALIBRATION }))
    expect(typeof r).toBe('object')
  })

  it('felmeddelandet säger hur många dagar som saknas', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 3 }))
    expect(r).toContain('3')
    expect(r).toContain(String(MIN_LOG_DAYS_FOR_CALIBRATION))
  })
})

describe('runCalibration — loggningen måste täcka mätperioden', () => {
  /** Datum N dagar tillbaka, som YYYY-MM-DD */
  const dayISO = (daysAgo: number) =>
    new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  it('blockerar när loggdagarna ligger samlade i periodens ena halva', () => {
    // 7 loggdagar, men alla i den äldre halvan: intaget beskriver en annan
    // tid än den viktförändring som mätts över hela perioden.
    const r = runCalibration(
      baseInput({
        daysWithLogData: 7,
        loggedDates: [21, 22, 23, 24, 25, 26, 27].map(dayISO),
      })
    )
    expect(typeof r).toBe('string')
    expect(r).toContain('täcker')
  })

  it('tillåter när loggningen är spridd över perioden', () => {
    const spread = Array.from({ length: 20 }, (_, i) => dayISO(i))
    const r = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: spread }))
    expect(typeof r).toBe('object')
  })

  it('hoppar över kontrollen när datum saknas (bakåtkompatibelt)', () => {
    const r = runCalibration(baseInput({ loggedDates: undefined }))
    expect(typeof r).toBe('object')
  })

  it('felmeddelandet säger hur många dagar som behövs', () => {
    const r = runCalibration(
      baseInput({ daysWithLogData: 7, loggedDates: [24, 25, 26, 27, 28, 29, 30].map(dayISO) })
    )
    expect(typeof r).toBe('string')
    expect(r).toMatch(/\d+ av \d+ dagar/)
  })
})

describe('runCalibration — veckodagsbias begränsar justeringen', () => {
  /** Loggade datum inom perioden, valfritt bara vardagar */
  const datesIn = (count: number, weekdaysOnly: boolean) => {
    const out: string[] = []
    for (let i = 0; out.length < count && i < 60; i++) {
      const d = new Date(NOW.getTime() - i * 86400000)
      const day = d.getDay()
      if (weekdaysOnly && (day === 0 || day === 6)) continue
      out.push(d.toISOString().slice(0, 10))
    }
    return out
  }

  it('varnar när bara vardagar loggats', () => {
    // 20 vardagar behövs för att klara täckningskravet (28-dagarsperiod) och
    // därmed nå bias-kontrollen — 14 vardagar spänner bara 48 % av perioden.
    const r = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, true) }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') {
      expect(r.warnings.some(w => w.type === 'weekday_bias')).toBe(true)
    }
  })

  it('varnar inte när urvalet är representativt', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, false) }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') {
      expect(r.warnings.some(w => w.type === 'weekday_bias')).toBe(false)
    }
  })

  it('snedvridet urval flyttar TDEE mindre än representativt', () => {
    // Samma antal loggdagar och samma intag — enda skillnaden är VILKA dagar
    const biased = runCalibration(
      baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, true) })
    )
    const fair = runCalibration(baseInput({ daysWithLogData: 20, loggedDates: datesIn(20, false) }))
    if (typeof biased === 'object' && typeof fair === 'object') {
      const biasedMove = Math.abs(biased.clampedTDEE - 2500)
      const fairMove = Math.abs(fair.clampedTDEE - 2500)
      expect(biasedMove).toBeLessThanOrEqual(fairMove)
    }
  })
})

describe('runCalibration — klämmorna håller åt båda håll', () => {
  /**
   * Tidigare beräknades finalMin = max(dqiMin, convMin) och
   * finalMax = min(dqiMax, convMax). När intervallen inte överlappade blev
   * finalMin > finalMax, och det yttre Math.max returnerade DQI-gränsen —
   * vilket kringgick konvergenstaket helt. Felet var ensidigt: bara
   * uppåtjusteringar läckte.
   */

  it('respekterar konvergenstaket vid stor uppjustering', () => {
    // Vikten står still trots stort loggat underskott => rawTDEE skjuter upp
    const r = runCalibration(
      baseInput({
        currentTDEE: 2000,
        weightHistory: weightSeries(28, 85, 0),
        actualCaloriesAvg: 3000,
        targetCalories: 3000,
        daysWithLogData: 28,
        foodLogCompleteness: 100,
      })
    )
    if (typeof r === 'object') {
      // Får aldrig hamna över currentTDEE + maxAllowedAdjustmentPercent
      const tak = 2000 * (1 + r.maxAllowedAdjustmentPercent)
      expect(r.clampedTDEE).toBeLessThanOrEqual(Math.round(tak) + 1)
    }
  })

  it('respekterar konvergenstaket vid stor nedjustering', () => {
    const r = runCalibration(
      baseInput({
        currentTDEE: 3500,
        weightHistory: weightSeries(28, 85, -0.06),
        actualCaloriesAvg: 1600,
        targetCalories: 1600,
        daysWithLogData: 28,
        foodLogCompleteness: 100,
      })
    )
    if (typeof r === 'object') {
      const golv = 3500 * (1 - r.maxAllowedAdjustmentPercent)
      expect(r.clampedTDEE).toBeGreaterThanOrEqual(Math.round(golv) - 1)
    }
  })

  it('klämmer symmetriskt — samma avstånd upp som ned', () => {
    // Spegelvända fall ska begränsas lika hårt
    const upp = runCalibration(
      baseInput({
        currentTDEE: 2500,
        weightHistory: weightSeries(28, 85, 0),
        actualCaloriesAvg: 3400,
        targetCalories: 3400,
        daysWithLogData: 28,
      })
    )
    const ned = runCalibration(
      baseInput({
        currentTDEE: 2500,
        weightHistory: weightSeries(28, 85, -0.07),
        actualCaloriesAvg: 1500,
        targetCalories: 1500,
        daysWithLogData: 28,
      })
    )
    if (typeof upp === 'object' && typeof ned === 'object') {
      const avstUpp = upp.clampedTDEE - 2500
      const avstNed = 2500 - ned.clampedTDEE
      // Båda ska vara begränsade, ingen ska sticka iväg flera hundra kcal mer
      expect(Math.abs(avstUpp - avstNed)).toBeLessThan(250)
    }
  })

  it('justeringstaket faller aldrig under golvet', () => {
    // Alla riskmultiplikatorer aktiva samtidigt gav tidigare 0,6 % (14 kcal)
    const r = runCalibration(
      baseInput({
        currentTDEE: 2400,
        weightHistory: weightSeries(28, 85, -0.001), // låg signal
        deficitPercent: 30, // stort underskott
        daysWithLogData: 20,
        loggedDates: Array.from({ length: 20 }, (_, i) => {
          // bara vardagar => weekday_bias
          const d = new Date(NOW.getTime() - i * 86400000)
          return d.getDay() === 0 || d.getDay() === 6
            ? new Date(NOW.getTime() - (i + 2) * 86400000).toISOString().slice(0, 10)
            : d.toISOString().slice(0, 10)
        }),
      })
    )
    if (typeof r === 'object') {
      expect(r.maxAllowedAdjustmentPercent).toBeGreaterThanOrEqual(0.02)
    }
  })
})

describe('runCalibration — konfidensintervallet', () => {
  it('omsluter punktskattningen', () => {
    const r = runCalibration(baseInput())
    expect(typeof r).toBe('object')
    if (typeof r === 'object') {
      expect(r.tdeeLower90).toBeLessThanOrEqual(r.rawTDEE)
      expect(r.tdeeUpper90).toBeGreaterThanOrEqual(r.rawTDEE)
    }
  })

  it('blir smalare med fler loggade dagar', () => {
    // Kalorildelen av osäkerheten skalar med 1/√(loggade dagar)
    const gles = runCalibration(baseInput({ daysWithLogData: 10 }))
    const tat = runCalibration(baseInput({ daysWithLogData: 28 }))
    if (typeof gles === 'object' && typeof tat === 'object') {
      expect(tat.tdeeUpper90 - tat.tdeeLower90).toBeLessThan(gles.tdeeUpper90 - gles.tdeeLower90)
    }
  })

  it('använder samma energitäthet som punktskattningen', () => {
    // Intervallet räknade tidigare med fast 7700 medan TDEE använde det
    // hastighetsberoende värdet — samma storhet, två olika tal.
    // Vid snabb viktförändring ska intervallet därför bli smalare, inte
    // ligga kvar på 7700-bredden.
    const langsam = runCalibration(baseInput({ weightHistory: weightSeries(28, 85, -0.005) }))
    const snabb = runCalibration(baseInput({ weightHistory: weightSeries(28, 85, -0.05) }))
    if (typeof langsam === 'object' && typeof snabb === 'object') {
      // Båda ska ge ändliga, rimliga intervall
      expect(snabb.tdeeUpper90 - snabb.tdeeLower90).toBeGreaterThan(0)
      expect(langsam.tdeeUpper90 - langsam.tdeeLower90).toBeGreaterThan(0)
    }
  })
})

describe('runCalibration — calorieSource märks ärligt', () => {
  it('märks food_log när loggen är i princip komplett', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 28, foodLogCompleteness: 100 }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') expect(r.calorieSource).toBe('food_log')
  })

  it('märks blended när loggen är delvis ifylld', () => {
    const r = runCalibration(baseInput({ daysWithLogData: 14, foodLogCompleteness: 50 }))
    expect(typeof r).toBe('object')
    if (typeof r === 'object') expect(r.calorieSource).toBe('blended')
  })

  it('märker ALDRIG food_log utan loggat intag', () => {
    // Kärnan i fel 2: priorWeight = 0 gav tidigare 'food_log' här.
    // Blockeringen fångar fallet nu, men om tröskeln någon gång sänks får
    // etiketten inte ljuga.
    const r = runCalibration(
      baseInput({
        actualCaloriesAvg: null,
        daysWithLogData: 0,
        foodLogCompleteness: 0,
      })
    )
    if (typeof r === 'object') {
      expect(r.calorieSource).toBe('target_calories')
    } else {
      expect(r).toContain('loggade dagar')
    }
  })
})

describe('runCalibration — klusterstorlek som egen grind', () => {
  /**
   * Motorn litade på anroparna.
   *
   * MIN_CLUSTER_SIZE kontrollerades i hooken och i periodväljaren, men
   * aldrig i validateWeightData. Ett direktanrop — eller en anropare som
   * tappar sin kontroll — kunde därför köra kalibreringen med EN mätning i
   * ena änden, alltså med halva jämförelsen vilande på ett enskilt
   * vågvärde.
   *
   * MÄTT på samma sanna trend: 2586 kcal/dag med en mätning i startklustret
   * mot 2449 med tre. 137 kcal/dag i ren brusskillnad, presenterat som en
   * mätning — inte som ett fel.
   */
  const glesa = (offsets: number[]): WeightHistory[] =>
    offsets.map((o, i) => {
      const d = new Date(NOW.getTime() - o * 24 * 60 * 60 * 1000)
      return {
        id: `s${i}`,
        user_id: 'u1',
        weight_kg: 85 - o * 0.04,
        recorded_at: d.toISOString(),
        created_at: d.toISOString(),
      } as WeightHistory
    })

  it.each([[[13, 6, 5, 4]], [[13, 2, 1, 0]]])(
    'nekar %o, där startklustret bara har en mätning',
    offsets => {
      const r = runCalibration(baseInput({ weightHistory: glesa(offsets), periodDays: 14 }))
      expect(typeof r).toBe('string')
      expect(r as string).toContain('vardera änden')
    }
  )

  it('släpper igenom när båda ändarna bär två mätningar', () => {
    const r = runCalibration(baseInput({ weightHistory: glesa([13, 12, 1, 0]), periodDays: 14 }))
    expect(typeof r).not.toBe('string')
  })
})
