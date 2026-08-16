import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  suggestPhaseTargets,
  currentPhaseCalories,
  weeksSince,
  phaseProgress,
  suggestedNextPhase,
  macroModeForPhase,
  phaseNeedsBodyFat,
  calorieGoalForPhase,
  goalConflictsWithPhase,
  phaseTypeForCalorieGoal,
} from './dietPhases'
import type { DietPhase } from '@/lib/types'

/** Minimal fas — testerna sätter bara fälten de bryr sig om. */
function makePhase(overrides: Partial<DietPhase> = {}): DietPhase {
  return {
    id: 'p1',
    user_id: 'u1',
    phase_type: 'cut',
    focus: 'strength',
    started_at: '2026-01-01',
    ended_at: null,
    planned_weeks: null,
    target_calories: null,
    protein_g_per_kg: null,
    start_weight_kg: null,
    weekly_calorie_step: null,
    notes: null,
    is_preview: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('suggestPhaseTargets', () => {
  it('lägger cut i underskott och bulk i överskott', () => {
    const cut = suggestPhaseTargets('cut', 2500, 80)
    const bulk = suggestPhaseTargets('bulk', 2500, 80)

    expect(cut.targetCalories).toBeLessThan(2500)
    expect(bulk.targetCalories).toBeGreaterThan(2500)
  })

  it('sätter maintenance på TDEE', () => {
    expect(suggestPhaseTargets('maintenance', 2500, 80).targetCalories).toBe(2500)
  })

  it('ger högre protein under cut än under bulk i styrkespåret', () => {
    // Med kroppsfett angivet används Deff-läget (2,3–3,1 g/kg FFM) mot
    // Bulk-lägets 1,6–2,2 g/kg kroppsvikt.
    const cut = suggestPhaseTargets('cut', 2500, 80, 'strength', undefined, 15)
    const bulk = suggestPhaseTargets('bulk', 2500, 80, 'strength', undefined, 15)

    expect(cut.proteinMaxGPerKg).toBeGreaterThan(bulk.proteinMaxGPerKg)
  })

  it('hämtar proteinintervallet från kostläget, inte från egna konstanter', () => {
    // Deff-läget räknar mot fettfri massa
    const strengthCut = suggestPhaseTargets('cut', 2500, 80, 'strength', undefined, 15)
    expect(strengthCut.proteinBasis).toBe('ffm')
    expect(strengthCut.proteinMinGPerKg).toBe(2.3)
    expect(strengthCut.proteinMaxGPerKg).toBe(3.1)

    // Viktminskningsläget räknar mot kroppsvikt
    const healthCut = suggestPhaseTargets('cut', 2500, 80, 'health')
    expect(healthCut.proteinBasis).toBe('bodyweight')
    expect(healthCut.proteinMinGPerKg).toBe(1.2)
    expect(healthCut.proteinMaxGPerKg).toBe(1.6)
    expect(healthCut.proteinGramsMin).toBe(Math.round(1.2 * 80))
  })

  it('anger NNR-lägets protein i energiprocent, inte g/kg', () => {
    // NNR:s riktlinje är 10–20 E% — samma som kostlägeskortet visar.
    // Att översätta till g/kg vore en påhittad omräkning.
    const s = suggestPhaseTargets('maintenance', 2770, 80, 'health')
    expect(s.macroMode).toBe('nnr')
    expect(s.proteinBasis).toBe('energyPercent')
    expect(s.proteinMinGPerKg).toBe(10)
    expect(s.proteinMaxGPerKg).toBe(20)

    // Gram räknas ur kalorierna: 10 % av 2770 kcal / 4 kcal per g ≈ 69 g
    expect(s.proteinGramsMin).toBe(Math.round((2770 * 0.1) / 4))
    expect(s.proteinGramsMax).toBe(Math.round((2770 * 0.2) / 4))
  })

  it('flaggar när kroppsfett saknas för ett FFM-baserat läge', () => {
    const utan = suggestPhaseTargets('cut', 2500, 80, 'strength')
    expect(utan.needsBodyFat).toBe(true)
    // Faller tillbaka på kroppsvikt så att dialogen ändå visar siffror
    expect(utan.proteinBasis).toBe('bodyweight')

    const med = suggestPhaseTargets('cut', 2500, 80, 'strength', undefined, 15)
    expect(med.needsBodyFat).toBe(false)
  })

  it('speglar kostlägets kalorispann EXAKT, utan avrundning till tiotal', () => {
    // Energimål-tabellen och kostlägeskortet visar exakta tal. Vid TDEE 2770
    // ger Deff-läget (TDEE × 0,75–0,80) 2078–2216 kcal — avrundning till
    // tiotal gav 2080–2220 och såg ut som ett annat mål.
    const cut = suggestPhaseTargets('cut', 2770, 80, 'strength', undefined, 15)
    expect(cut.targetCaloriesMin).toBe(2078)
    expect(cut.targetCaloriesMax).toBe(2216)

    // Bulk-läget: TDEE × 1,10–1,20
    const bulk = suggestPhaseTargets('bulk', 2770, 80, 'strength', undefined, 15)
    expect(bulk.targetCaloriesMin).toBe(3047)
    expect(bulk.targetCaloriesMax).toBe(3324)
  })

  it('visar kalorimålets avvikelse från TDEE som etikett', () => {
    // Härleds ur kostlägets multiplikatorer — måste matcha etiketterna i
    // profilens kostlägeskort (Viktuppgång 10-20 %, Viktminskning 20-25 %).
    const bf = 15
    expect(suggestPhaseTargets('maintenance', 2770, 80, 'health').calorieDeviationLabel).toBe(
      '±3 %'
    )
    expect(
      suggestPhaseTargets('bulk', 2770, 80, 'strength', undefined, bf).calorieDeviationLabel
    ).toBe('+10–20 %')
    expect(
      suggestPhaseTargets('cut', 2770, 80, 'strength', undefined, bf).calorieDeviationLabel
    ).toBe('−20–25 %')
    expect(suggestPhaseTargets('cut', 2770, 80, 'health').calorieDeviationLabel).toBe('−20–25 %')

    // Hälsospårets viktuppgång använder NNR:s MAKRON men bulk-fasens
    // KALORIER. NNR är ett underhållsläge (±3 %) — utan override skulle
    // "Viktuppgång" föreslå att man äter på underhåll.
    expect(suggestPhaseTargets('bulk', 2770, 80, 'health').calorieDeviationLabel).toBe('+10–20 %')
    expect(suggestPhaseTargets('maintenance', 2770, 80, 'health').calorieDeviationLabel).toBe(
      '±3 %'
    )
  })

  it('ger ingen procentsats för upptrappning', () => {
    // Målet höjs varje vecka och rör sig från underskott mot underhåll — en
    // fast procentsats vore sann bara vecka 1.
    expect(
      suggestPhaseTargets('reverse', 2770, 80, 'strength', 2100, 15).calorieDeviationLabel
    ).toBeNull()
    expect(
      suggestPhaseTargets('reverse', 2770, 80, 'health', 2100).calorieDeviationLabel
    ).toBeNull()
  })

  it('ger hälsospårets viktuppgång samma energinivå som bulk i styrkespåret', () => {
    const health = suggestPhaseTargets('bulk', 2770, 80, 'health')
    const strength = suggestPhaseTargets('bulk', 2770, 80, 'strength', undefined, 15)

    expect(health.targetCaloriesMin).toBe(strength.targetCaloriesMin)
    expect(health.targetCaloriesMax).toBe(strength.targetCaloriesMax)
    // …men olika makrofördelning
    expect(health.macroMode).toBe('nnr')
    expect(strength.macroMode).toBe('offseason')
  })

  it('matchar profilens egen kaloriehärledning', () => {
    // Perioden skriver nu calories_min/max till profilen. Det är bara
    // ofarligt så länge talen är IDENTISKA med hur profilen annars räknar
    // dem (MetabolicCalibration och TDEE-verktyget härleder ur calorie_goal
    // + deficit_level). Glider de isär får användaren olika mål beroende på
    // vad som senast rörde profilen.
    const tdee = 2000
    const cut = suggestPhaseTargets('cut', tdee, 80, 'health')
    // deficit_level '20-25%' → TDEE × (1 − 0,225 ∓ 0,025)
    expect(cut.targetCaloriesMin).toBe(Math.round(tdee * (1 - 0.225 - 0.025)))
    expect(cut.targetCaloriesMax).toBe(Math.round(tdee * (1 - 0.225 + 0.025)))

    // Viktuppgång: profilen använder TDEE × 1,1–1,2
    const bulk = suggestPhaseTargets('bulk', tdee, 80, 'health')
    expect(bulk.targetCaloriesMin).toBe(Math.round(tdee * 1.1))
    expect(bulk.targetCaloriesMax).toBe(Math.round(tdee * 1.2))

    // Underhåll: TDEE ±3 %
    const maint = suggestPhaseTargets('maintenance', tdee, 80, 'health')
    expect(maint.targetCaloriesMin).toBe(Math.round(tdee * 0.97))
    expect(maint.targetCaloriesMax).toBe(Math.round(tdee * 1.03))
  })

  it('lägger mittpunkten mitt i spannet', () => {
    const s = suggestPhaseTargets('cut', 2770, 80, 'health')
    expect(s.targetCalories).toBe(Math.round((s.targetCaloriesMin + s.targetCaloriesMax) / 2))
  })

  it('trappar upp reverse diet från nuvarande intag mot TDEE', () => {
    const r = suggestPhaseTargets('reverse', 2500, 80, 'strength', 1800)

    expect(r.targetCalories).toBe(1800)
    expect(r.weeklyCalorieStep).toBeGreaterThan(0)
  })

  it('håller upptrappningen inom 50–150 kcal/vecka', () => {
    // Litet gap: steget får inte bli mikroskopiskt
    const small = suggestPhaseTargets('reverse', 2000, 80, 'strength', 1950)
    expect(small.weeklyCalorieStep).toBeGreaterThanOrEqual(50)

    // Stort gap: steget får inte skena — evidensen ger inget stöd för
    // aggressiv upptrappning
    const large = suggestPhaseTargets('reverse', 3500, 80, 'strength', 1400)
    expect(large.weeklyCalorieStep).toBeLessThanOrEqual(150)
  })

  it('ger inget negativt steg när intaget redan ligger över TDEE', () => {
    const r = suggestPhaseTargets('reverse', 2000, 80, 'strength', 2400)
    expect(r.weeklyCalorieStep).toBeGreaterThanOrEqual(0)
  })

  it('startar aldrig en upptrappning över TDEE', () => {
    // Byter man från en bulk (mål 3186) till "Trappa upp" får det nuvarande
    // överskottet INTE bli startpunkt — en upptrappning börjar i ett
    // underskott och går mot TDEE, aldrig förbi det.
    const tdee = 2770
    const r = suggestPhaseTargets('reverse', tdee, 80, 'strength', 3186, 15)

    expect(r.targetCalories).toBeLessThan(tdee)
    expect(r.targetCaloriesMax).toBeLessThanOrEqual(tdee)
  })
})

describe('currentPhaseCalories', () => {
  it('håller icke-reverse-faser statiska', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01'))

    const phase = makePhase({ phase_type: 'cut', target_calories: 2000, started_at: '2026-01-01' })
    expect(currentPhaseCalories(phase)).toBe(2000)
  })

  it('höjer reverse diet-målet med antalet passerade veckor', () => {
    vi.useFakeTimers()
    // Exakt 3 veckor efter start
    vi.setSystemTime(new Date('2026-01-22T12:00:00'))

    const phase = makePhase({
      phase_type: 'reverse',
      target_calories: 1800,
      weekly_calorie_step: 50,
      started_at: '2026-01-01',
    })

    expect(currentPhaseCalories(phase, 2500)).toBe(1950)
  })

  it('trappar aldrig upp förbi TDEE', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01'))

    const phase = makePhase({
      phase_type: 'reverse',
      target_calories: 1800,
      weekly_calorie_step: 100,
      started_at: '2026-01-01',
    })

    expect(currentPhaseCalories(phase, 2400)).toBe(2400)
  })

  it('returnerar null när fasen saknar kalorimål', () => {
    expect(currentPhaseCalories(makePhase({ target_calories: null }))).toBeNull()
  })
})

describe('weeksSince', () => {
  it('räknar hela veckor och aldrig negativt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00'))

    expect(weeksSince('2026-01-01')).toBe(2)
    // Framtida datum ska ge 0, inte ett negativt tal
    expect(weeksSince('2026-06-01')).toBe(0)
  })
})

describe('phaseProgress', () => {
  it('är null utan planerad längd', () => {
    expect(phaseProgress(makePhase({ planned_weeks: null }))).toBeNull()
  })

  it('taket är 1 även när fasen dragit över tiden', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01'))

    expect(phaseProgress(makePhase({ started_at: '2026-01-01', planned_weeks: 12 }))).toBe(1)
  })
})

describe('macroModeForPhase / phaseNeedsBodyFat', () => {
  it('pekar styrkespåret mot atletlägena', () => {
    expect(macroModeForPhase('cut', 'strength')).toBe('onseason')
    expect(macroModeForPhase('bulk', 'strength')).toBe('offseason')
    expect(macroModeForPhase('maintenance', 'strength')).toBe('active')
  })

  it('pekar hälsospåret mot NNR och viktminskning', () => {
    expect(macroModeForPhase('cut', 'health')).toBe('weightloss')
    expect(macroModeForPhase('bulk', 'health')).toBe('nnr')
    expect(macroModeForPhase('maintenance', 'health')).toBe('nnr')
  })

  it('låter reverse ärva utgångsfasens läge i båda spåren', () => {
    // Att byta makrofördelning samtidigt som kalorierna höjs ändrar två
    // variabler på en gång — därför behålls cut-lägets fördelning.
    expect(macroModeForPhase('reverse', 'strength')).toBe(macroModeForPhase('cut', 'strength'))
    expect(macroModeForPhase('reverse', 'health')).toBe(macroModeForPhase('cut', 'health'))
  })

  it('kräver kroppsfett bara där lägets protein räknas mot fettfri massa', () => {
    // Deff-läget (onseason) använder g/kg FFM och kan inte appliceras utan
    // kroppsfettprocent; hälsospårets viktminskningsläge använder kroppsvikt.
    expect(phaseNeedsBodyFat('cut', 'strength')).toBe(true)
    expect(phaseNeedsBodyFat('cut', 'health')).toBe(false)
    expect(phaseNeedsBodyFat('bulk', 'strength')).toBe(false)
  })
})

describe('phaseTypeForCalorieGoal', () => {
  it('härleder periodtyp ur profilens riktning', () => {
    // Appen frågar om riktning innan TDEE finns; förvalet gör att frågan inte
    // ställs två gånger med olika ord.
    expect(phaseTypeForCalorieGoal('Weight loss')).toBe('cut')
    expect(phaseTypeForCalorieGoal('Weight gain')).toBe('bulk')
    expect(phaseTypeForCalorieGoal('Maintain weight')).toBe('maintenance')
  })

  it('gissar inte när riktningen saknas eller är egen', () => {
    expect(phaseTypeForCalorieGoal('Custom TDEE')).toBeUndefined()
    expect(phaseTypeForCalorieGoal(null)).toBeUndefined()
    expect(phaseTypeForCalorieGoal(undefined)).toBeUndefined()
  })

  it('är omvändningen av calorieGoalForPhase', () => {
    // De två måste följas åt — annars förväljs en periodtyp som sedan
    // rapporteras som en krock mot samma mål.
    for (const type of ['cut', 'bulk', 'maintenance'] as const) {
      expect(phaseTypeForCalorieGoal(calorieGoalForPhase(type))).toBe(type)
    }
  })
})

describe('goalConflictsWithPhase', () => {
  it('speglar databastriggerns mappning', () => {
    // Måste stämma med sync_calorie_goal_from_phase — annars upptäcks
    // krockar felaktigt eller inte alls.
    expect(calorieGoalForPhase('cut')).toBe('Weight loss')
    expect(calorieGoalForPhase('bulk')).toBe('Weight gain')
    expect(calorieGoalForPhase('maintenance')).toBe('Maintain weight')
    expect(calorieGoalForPhase('reverse')).toBe('Maintain weight')
  })

  it('flaggar mål som pekar åt ett annat håll än perioden', () => {
    const bulk = makePhase({ phase_type: 'bulk' })
    expect(goalConflictsWithPhase('Weight loss', bulk)).toBe(true)
    expect(goalConflictsWithPhase('Maintain weight', bulk)).toBe(true)
    expect(goalConflictsWithPhase('Weight gain', bulk)).toBe(false)
  })

  it('flaggar inte när ingen period är aktiv', () => {
    expect(goalConflictsWithPhase('Weight loss', null)).toBe(false)
    // Avslutad period kan inte krocka
    const ended = makePhase({ phase_type: 'bulk', ended_at: '2026-02-01' })
    expect(goalConflictsWithPhase('Weight loss', ended)).toBe(false)
  })

  it('behandlar Custom TDEE som neutralt', () => {
    // "Eget värde" är ingen riktning och kan inte motsäga en period
    expect(goalConflictsWithPhase('Custom TDEE', makePhase({ phase_type: 'cut' }))).toBe(false)
  })

  it('flaggar inte när målet saknas', () => {
    const cut = makePhase({ phase_type: 'cut' })
    expect(goalConflictsWithPhase(undefined, cut)).toBe(false)
    expect(goalConflictsWithPhase(null, cut)).toBe(false)
  })

  it('låter upptrappning samexistera med underhållsmål', () => {
    // Reverse går MOT underhåll — 'Maintain weight' är inte en krock
    const reverse = makePhase({ phase_type: 'reverse' })
    expect(goalConflictsWithPhase('Maintain weight', reverse)).toBe(false)
    expect(goalConflictsWithPhase('Weight gain', reverse)).toBe(true)
  })
})

describe('suggestedNextPhase', () => {
  it('föreslår reverse efter cut istället för direkt maintenance', () => {
    expect(suggestedNextPhase('cut')).toBe('reverse')
  })

  it('leder reverse vidare till maintenance', () => {
    expect(suggestedNextPhase('reverse')).toBe('maintenance')
  })

  it('lämnar maintenance öppet', () => {
    expect(suggestedNextPhase('maintenance')).toBeNull()
  })
})
