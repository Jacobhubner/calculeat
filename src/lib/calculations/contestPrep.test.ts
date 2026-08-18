/**
 * Tester för tävlingsräknaren.
 *
 * Det viktigaste testet är det första: räknaren jämförs mot Helms 2014:s EGET
 * räkneexempel. Stämmer vår uträkning med källans, är formeln rätt tolkad —
 * inte bara internt konsistent.
 */

import { describe, it, expect } from 'vitest'
import {
  estimatePrepDuration,
  requiredRateForWeeks,
  classifyPrepRate,
  PREP_RATE_PERCENT,
  OBSERVED_PREP_WEEKS,
  POST_CONTEST_WEEKS,
  MINOR_ADJUSTMENT_WEIGHT_FRACTION,
  MIN_TARGET_BODY_FAT,
  REALISTIC_LEAN_LOSS_FRACTION,
  ratePercentForDeficitLevel,
} from './contestPrep'

describe('estimatePrepDuration — mot källans eget exempel', () => {
  /**
   * Helms 2014 [1], ordagrant: "a 70 kg athlete at 13% body fat would need to
   * be no more than 6 kg to 7 kg over their contest weight".
   *
   * Tolkning: en 70 kg-atlet på 13 % ska nå tävlingsform. Källan säger att
   * avståndet till tävlingsvikt då är högst 6–7 kg. Vår uträkning ska landa i
   * samma storleksordning för ett rimligt tävlingsmål (5–6 % kroppsfett).
   */
  it('reproducerar Helms 70 kg / 13 % — avstånd till tävlingsvikt 6–7 kg', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 70,
      currentBodyFatPct: 13,
      targetBodyFatPct: 5,
    })
    expect(r).not.toBeNull()
    // 70 kg vid 13 % → 60,9 kg fettfritt → vid 5 % blir vikten 64,1 kg.
    // Avstånd: ca 5,9 kg. Ligger precis under källans 6–7 kg, vilket stämmer
    // eftersom 5 % är en aggressiv tävlingsnivå.
    expect(r!.fatToLoseKg).toBeGreaterThan(5)
    expect(r!.fatToLoseKg).toBeLessThan(7)
    expect(r!.projectedWeightKg).toBeCloseTo(64.1, 0)
  })

  it('vid 6 % mål hamnar avståndet inom källans 6–7 kg', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 70,
      currentBodyFatPct: 14,
      targetBodyFatPct: 6,
    })
    expect(r!.fatToLoseKg).toBeGreaterThanOrEqual(6)
    expect(r!.fatToLoseKg).toBeLessThanOrEqual(7)
  })
})

describe('estimatePrepDuration — takt och tid', () => {
  it('använder 0,5 %/v som förval enligt Roberts 2020', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 15,
      targetBodyFatPct: 8,
    })
    expect(r!.ratePercentUsed).toBe(PREP_RATE_PERCENT.recommended)
  })

  it('lägre takt ger längre tid', () => {
    const input = { currentWeightKg: 80, currentBodyFatPct: 15, targetBodyFatPct: 8 }
    const slow = estimatePrepDuration({ ...input, weeklyRatePercent: 0.25 })
    const fast = estimatePrepDuration({ ...input, weeklyRatePercent: 1.0 })
    expect(slow!.weeks).toBeGreaterThan(fast!.weeks)
  })

  it('högre startfett ger längre prep vid samma mål och takt', () => {
    const lean = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 12,
      targetBodyFatPct: 6,
    })
    const fatter = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 22,
      targetBodyFatPct: 6,
    })
    // Detta är kärnan i Helms: "those leaner dieting for shorter periods".
    expect(fatter!.weeks).toBeGreaterThan(lean!.weeks)
  })

  it('tar hänsyn till att vikten sjunker — inte fast veckotapp', () => {
    // Ett fast tapp räknat på startvikten skulle underskatta tiden.
    // Kontroll: veckor × första veckans tapp > faktisk viktnedgång.
    const r = estimatePrepDuration({
      currentWeightKg: 100,
      currentBodyFatPct: 25,
      targetBodyFatPct: 10,
      weeklyRatePercent: 1.0,
    })
    const naivt = r!.weeks * r!.weeklyLossKg
    expect(naivt).toBeGreaterThan(r!.fatToLoseKg)
  })

  it('markerar när en RIKTIG förberedelse ligger utanför 14–32 veckor', () => {
    // Kort MEN med tillräckligt mycket fett för att räknas som förberedelse:
    // en hög takt på ett rejält avstånd.
    const kort = estimatePrepDuration({
      currentWeightKg: 90,
      currentBodyFatPct: 18,
      targetBodyFatPct: 12,
      weeklyRatePercent: 1.0,
    })
    expect(kort!.isMinorAdjustment).toBe(false)
    expect(kort!.weeks).toBeLessThan(OBSERVED_PREP_WEEKS.min)
    expect(kort!.outsideObservedRange).toBe(true)

    const lagom = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 15,
      targetBodyFatPct: 8,
    })
    expect(lagom!.outsideObservedRange).toBe(false)
  })

  it('ETT KORT AVSTÅND markeras INTE som utanför spannet — det är en finjustering', () => {
    // 80 kg vid 9 % mot 8 % är under ett kilo. Att jämföra det med
    // fallstudier som startade på 15–20 % säger ingenting.
    const r = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 9,
      targetBodyFatPct: 8,
    })
    expect(r!.isMinorAdjustment).toBe(true)
    expect(r!.outsideObservedRange).toBe(false)
  })
})

describe('estimatePrepDuration — ogiltiga indata ger null, inte gissning', () => {
  const bas = { currentWeightKg: 80, currentBodyFatPct: 15, targetBodyFatPct: 8 }

  it('målet är redan uppnått', () => {
    expect(estimatePrepDuration({ ...bas, targetBodyFatPct: 15 })).toBeNull()
    expect(estimatePrepDuration({ ...bas, targetBodyFatPct: 20 })).toBeNull()
  })

  it('orimlig vikt eller fettprocent', () => {
    expect(estimatePrepDuration({ ...bas, currentWeightKg: 0 })).toBeNull()
    expect(estimatePrepDuration({ ...bas, currentWeightKg: -80 })).toBeNull()
    expect(estimatePrepDuration({ ...bas, currentBodyFatPct: 0 })).toBeNull()
    expect(estimatePrepDuration({ ...bas, currentBodyFatPct: 100 })).toBeNull()
  })

  it('NaN någonstans', () => {
    expect(estimatePrepDuration({ ...bas, currentWeightKg: NaN })).toBeNull()
    expect(estimatePrepDuration({ ...bas, currentBodyFatPct: NaN })).toBeNull()
    expect(estimatePrepDuration({ ...bas, targetBodyFatPct: NaN })).toBeNull()
  })

  it('orimlig takt faller tillbaka på förvalet i stället för att spåra ur', () => {
    const noll = estimatePrepDuration({ ...bas, weeklyRatePercent: 0 })
    expect(noll!.ratePercentUsed).toBe(PREP_RATE_PERCENT.recommended)

    const negativ = estimatePrepDuration({ ...bas, weeklyRatePercent: -1 })
    expect(negativ!.ratePercentUsed).toBe(PREP_RATE_PERCENT.recommended)

    // Extremt hög takt klampas så formeln inte får (1 − r) ≤ 0
    const extrem = estimatePrepDuration({ ...bas, weeklyRatePercent: 500 })
    expect(extrem).not.toBeNull()
    expect(Number.isFinite(extrem!.weeks)).toBe(true)
    expect(extrem!.weeks).toBeGreaterThan(0)
  })
})

describe('requiredRateForWeeks — omvänd fråga', () => {
  it('är invers till estimatePrepDuration', () => {
    const input = { currentWeightKg: 85, currentBodyFatPct: 18, targetBodyFatPct: 7 }
    const est = estimatePrepDuration({ ...input, weeklyRatePercent: 0.5 })
    const rate = requiredRateForWeeks(input, est!.weeks)
    // Avrundning uppåt av veckor gör att takten blir marginellt lägre.
    expect(rate).toBeGreaterThan(0.45)
    expect(rate).toBeLessThanOrEqual(0.5)
  })

  it('kortare tid kräver högre takt', () => {
    const input = { currentWeightKg: 85, currentBodyFatPct: 18, targetBodyFatPct: 7 }
    const snabb = requiredRateForWeeks(input, 10)!
    const langsam = requiredRateForWeeks(input, 30)!
    expect(snabb).toBeGreaterThan(langsam)
  })

  it('klampar INTE — en orimlig plan ska synas som orimlig', () => {
    const input = { currentWeightKg: 85, currentBodyFatPct: 25, targetBodyFatPct: 6 }
    const rate = requiredRateForWeeks(input, 4)!
    expect(rate).toBeGreaterThan(PREP_RATE_PERCENT.max)
    expect(classifyPrepRate(rate)).toBe('aggressive')
  })

  it('ogiltiga indata ger null', () => {
    const input = { currentWeightKg: 85, currentBodyFatPct: 18, targetBodyFatPct: 7 }
    expect(requiredRateForWeeks(input, 0)).toBeNull()
    expect(requiredRateForWeeks(input, -5)).toBeNull()
    expect(requiredRateForWeeks({ ...input, targetBodyFatPct: 20 }, 12)).toBeNull()
  })
})

describe('classifyPrepRate — mot källornas gränser', () => {
  it('≤0,5 %/v är rekommenderat (Roberts 2020)', () => {
    expect(classifyPrepRate(0.25)).toBe('recommended')
    expect(classifyPrepRate(0.46)).toBe('recommended') // Chappell: placerade
    expect(classifyPrepRate(0.5)).toBe('recommended')
  })

  it('0,5–1,0 %/v är godtagbart men inte förstahandsval (Helms 2014)', () => {
    expect(classifyPrepRate(0.7)).toBe('acceptable') // Garthe: ökad FFM
    expect(classifyPrepRate(1.0)).toBe('acceptable')
  })

  it('över 1,0 %/v stöds inte av någon källa', () => {
    expect(classifyPrepRate(1.4)).toBe('aggressive') // Garthe: ingen FFM-ökning
    expect(classifyPrepRate(2.0)).toBe('aggressive')
  })
})

describe('konstanter speglar källorna', () => {
  it('observerat prep-spann är 14–32 veckor (sju fallstudier, Roberts 2020)', () => {
    expect(OBSERVED_PREP_WEEKS.min).toBe(14)
    expect(OBSERVED_PREP_WEEKS.max).toBe(32)
  })

  it('post-contest speglar 1–2 + 1–2 månader och 3–4 / 5–6 månader', () => {
    expect(POST_CONTEST_WEEKS.weightRestoration).toEqual({ min: 4, max: 8 })
    expect(POST_CONTEST_WEEKS.fatRestoration).toEqual({ min: 4, max: 8 })
    expect(POST_CONTEST_WEEKS.hormonalPartial).toEqual({ min: 12, max: 16 })
    expect(POST_CONTEST_WEEKS.hormonalFull).toEqual({ min: 20, max: 26 })
  })

  it('förvalstakten är 0,5 %/v — Roberts 2020, inte Helms övre 1,0 %', () => {
    expect(PREP_RATE_PERCENT.recommended).toBe(0.5)
    expect(PREP_RATE_PERCENT.max).toBe(1.0)
  })
})

describe('finjustering kontra riktig förberedelse', () => {
  /**
   * Verkligt fall från testning 2026-08-18: 90,8 kg vid 10,2 % mot 9 %.
   * Räknaren visade då både "utanför 14–32 veckor" och en taktvarning —
   * båda meningslösa när det handlar om drygt ett kilo. Varningarna gäller
   * risker som byggs upp över tid i ett underskott.
   */
  it('markerar 1,2 kg som finjustering och tystar spannvarningen', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 90.8,
      currentBodyFatPct: 10.2,
      targetBodyFatPct: 9,
      weeklyRatePercent: 1,
    })
    expect(r!.fatToLoseKg).toBeLessThan(90.8 * MINOR_ADJUSTMENT_WEIGHT_FRACTION)
    expect(r!.isMinorAdjustment).toBe(true)
    // Det avgörande: ingen jämförelse med fallstudier som startade på 15–20 %
    expect(r!.outsideObservedRange).toBe(false)
  })

  it('en riktig förberedelse markeras INTE som finjustering', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 20,
      targetBodyFatPct: 6,
    })
    expect(r!.fatToLoseKg).toBeGreaterThan(80 * MINOR_ADJUSTMENT_WEIGHT_FRACTION)
    expect(r!.isMinorAdjustment).toBe(false)
  })

  it('spannvarningen fungerar fortfarande för riktiga förberedelser', () => {
    // 20 % -> 6 % vid 0,5 %/v tar över 32 veckor
    const langsam = estimatePrepDuration({
      currentWeightKg: 80,
      currentBodyFatPct: 20,
      targetBodyFatPct: 6,
      weeklyRatePercent: 0.5,
    })
    expect(langsam!.isMinorAdjustment).toBe(false)
    expect(langsam!.weeks).toBeGreaterThan(OBSERVED_PREP_WEEKS.max)
    expect(langsam!.outsideObservedRange).toBe(true)
  })

  it('gränsen går på fett att tappa, inte på antal veckor', () => {
    // Kort tid MEN mycket fett: hög takt på ett stort avstånd.
    // Ska INTE räknas som finjustering trots få veckor.
    const r = estimatePrepDuration({
      currentWeightKg: 110,
      currentBodyFatPct: 30,
      targetBodyFatPct: 20,
      weeklyRatePercent: 5,
    })
    expect(r!.fatToLoseKg).toBeGreaterThan(110 * MINOR_ADJUSTMENT_WEIGHT_FRACTION)
    expect(r!.isMinorAdjustment).toBe(false)
  })
})

describe('veckor visas med decimal, aldrig avrundat uppåt', () => {
  it('kort insats ger decimaltal, inte uppåtavrundning', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 90.8,
      currentBodyFatPct: 10.2,
      targetBodyFatPct: 9,
      weeklyRatePercent: 1,
    })
    // Exakt värde är ~1,32. Tidigare visades 2, vilket tog användaren UNDER målet.
    expect(r!.weeks).toBeGreaterThan(1)
    expect(r!.weeks).toBeLessThan(2)
  })

  it('en decimal, inte fler', () => {
    const r = estimatePrepDuration({
      currentWeightKg: 83.7,
      currentBodyFatPct: 17.3,
      targetBodyFatPct: 8.5,
    })
    expect(r!.weeks).toBe(Math.round(r!.weeks * 10) / 10)
  })
})

describe('RÄTTNINGAR efter granskning 2026-08-18', () => {
  describe('FFM-spannet pekar åt rätt håll', () => {
    /**
     * Docblocket påstod tidigare att muskelförlust gör tiden KORTARE. Fel:
     * förloras fettfri massa måste MER vikt tappas för samma fettprocent.
     * weeks är därför ett golv, weeksRealistic den övre gränsen.
     */
    it('weeksRealistic är alltid minst weeks', () => {
      const fall = [
        [80, 18, 10],
        [80, 15, 10],
        [90, 25, 15],
        [65, 28, 20],
        [70, 13, 5],
      ] as const
      for (const [w, bf, mal] of fall) {
        const r = estimatePrepDuration({
          currentWeightKg: w,
          currentBodyFatPct: bf,
          targetBodyFatPct: mal,
        })!
        expect(r.weeksRealistic).toBeGreaterThanOrEqual(r.weeks)
      }
    })

    it('skillnaden är av storleksordningen 10–35 %, inte försumbar', () => {
      const r = estimatePrepDuration({
        currentWeightKg: 80,
        currentBodyFatPct: 18,
        targetBodyFatPct: 10,
      })!
      const okning = (r.weeksRealistic - r.weeks) / r.weeks
      expect(okning).toBeGreaterThan(0.1)
      expect(okning).toBeLessThan(0.35)
    })

    it('vid FFM-andel 0 skulle spannet kollapsa — konstanten är satt över noll', () => {
      expect(REALISTIC_LEAN_LOSS_FRACTION).toBeGreaterThan(0)
    })
  })

  describe('små men giltiga avstånd ger svar, inte null', () => {
    /**
     * BUGG: weeks avrundades till en decimal INNAN kontrollen weeks <= 0.
     * 0,04 veckor blev 0 → null → användaren fick läsa att målet måste vara
     * lägre än nuvarande nivå, trots att det var det.
     */
    it('80 kg, 10 % mot 9,98 % ger ett resultat', () => {
      const r = estimatePrepDuration({
        currentWeightKg: 80,
        currentBodyFatPct: 10,
        targetBodyFatPct: 9.98,
      })
      expect(r).not.toBeNull()
      expect(r!.weeks).toBeGreaterThanOrEqual(0)
    })

    it('även vid hög takt där avrundningen slår tidigare', () => {
      const r = estimatePrepDuration({
        currentWeightKg: 80,
        currentBodyFatPct: 10,
        targetBodyFatPct: 9.8,
        weeklyRatePercent: 5,
      })
      expect(r).not.toBeNull()
    })
  })

  describe('mål under essentiellt kroppsfett flaggas', () => {
    it('0 % flaggas för båda könen', () => {
      const man = estimatePrepDuration({
        currentWeightKg: 80,
        currentBodyFatPct: 15,
        targetBodyFatPct: 0,
        gender: 'male',
      })!
      expect(man.belowEssentialFat).toBe(true)

      const kvinna = estimatePrepDuration({
        currentWeightKg: 65,
        currentBodyFatPct: 25,
        targetBodyFatPct: 0,
        gender: 'female',
      })!
      expect(kvinna.belowEssentialFat).toBe(true)
    })

    it('6 % är rimligt för män men under essentiell nivå för kvinnor', () => {
      const man = estimatePrepDuration({
        currentWeightKg: 80,
        currentBodyFatPct: 15,
        targetBodyFatPct: 6,
        gender: 'male',
      })!
      expect(man.belowEssentialFat).toBe(false)

      const kvinna = estimatePrepDuration({
        currentWeightKg: 65,
        currentBodyFatPct: 25,
        targetBodyFatPct: 6,
        gender: 'female',
      })!
      expect(kvinna.belowEssentialFat).toBe(true)
      expect(kvinna.essentialFatLimit).toBe(MIN_TARGET_BODY_FAT.female)
    })

    it('okänt kön använder den försiktigare gränsen', () => {
      const r = estimatePrepDuration({
        currentWeightKg: 70,
        currentBodyFatPct: 20,
        targetBodyFatPct: 8,
      })!
      expect(r.essentialFatLimit).toBe(MIN_TARGET_BODY_FAT.female)
      expect(r.belowEssentialFat).toBe(true)
    })
  })

  describe('finjusteringströskeln är relativ till kroppsvikten', () => {
    /**
     * Med fast 3 kg motsvarade tröskeln 6 procentenheter för en person på
     * 50 kg — en verklig period avfärdades som finjustering och alla
     * taktvarningar tystades, just där de behövdes mest.
     */
    it('50 kg: 16 % mot 10 % är en RIKTIG period, inte finjustering', () => {
      const r = estimatePrepDuration({
        currentWeightKg: 50,
        currentBodyFatPct: 16,
        targetBodyFatPct: 10,
      })!
      expect(r.isMinorAdjustment).toBe(false)
    })

    it('120 kg: ett par kilo är fortfarande en finjustering', () => {
      const r = estimatePrepDuration({
        currentWeightKg: 120,
        currentBodyFatPct: 16,
        targetBodyFatPct: 14.5,
      })!
      expect(r.fatToLoseKg).toBeLessThan(120 * MINOR_ADJUSTMENT_WEIGHT_FRACTION)
      expect(r.isMinorAdjustment).toBe(true)
    })

    it('samma procentuella avstånd bedöms lika oavsett kroppsvikt', () => {
      const liten = estimatePrepDuration({
        currentWeightKg: 50,
        currentBodyFatPct: 20,
        targetBodyFatPct: 12,
      })!
      const stor = estimatePrepDuration({
        currentWeightKg: 120,
        currentBodyFatPct: 20,
        targetBodyFatPct: 12,
      })!
      expect(liten.isMinorAdjustment).toBe(stor.isMinorAdjustment)
    })
  })
})

describe('underskottsnivåerna matchar Energimål', () => {
  /**
   * Räknaren hade tidigare ett fritt taktfält med schablonen 0,5 %/vecka,
   * medan kostläget −20/−25 % innebar 0,64–0,80 %/vecka. Två svar på samma
   * fråga i samma dialog. Nivåerna delar nu omräkning med Energimål.
   */
  it('ger samma kg/vecka som referenstabellen visar', () => {
    // TDEE 3190, 90,8 kg — samma som i referenstabellen
    const params = { tdee: 3190, weightKg: 90.8 }
    const vantat = {
      cautious: [0.29, 0.44],
      normal: [0.58, 0.73],
      aggressive: [0.73, 0.87],
    } as const

    for (const id of ['cautious', 'normal', 'aggressive'] as const) {
      const r = ratePercentForDeficitLevel({ level: id, ...params })!
      expect(r.kgMin).toBeCloseTo(vantat[id][0], 1)
      expect(r.kgMax).toBeCloseTo(vantat[id][1], 1)
    }
  })

  it('snabbare nivå ger kortare tid', () => {
    const params = { tdee: 3190, weightKg: 90.8 }
    const bas = { currentWeightKg: 90.8, currentBodyFatPct: 12, targetBodyFatPct: 7 }
    const langsam = estimatePrepDuration({
      ...bas,
      weeklyRatePercent: ratePercentForDeficitLevel({ level: 'cautious', ...params })!.percentMid,
    })!
    const snabb = estimatePrepDuration({
      ...bas,
      weeklyRatePercent: ratePercentForDeficitLevel({ level: 'aggressive', ...params })!.percentMid,
    })!
    expect(snabb.weeks).toBeLessThan(langsam.weeks)
  })

  it('ogiltig TDEE eller vikt ger null i stället för en gissning', () => {
    expect(ratePercentForDeficitLevel({ level: 'normal', tdee: 0, weightKg: 80 })).toBeNull()
    expect(ratePercentForDeficitLevel({ level: 'normal', tdee: 2500, weightKg: 0 })).toBeNull()
    expect(ratePercentForDeficitLevel({ level: 'normal', tdee: NaN, weightKg: 80 })).toBeNull()
  })
})
