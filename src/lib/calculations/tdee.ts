/**
 * TDEE (Total Daily Energy Expenditure) Calculations
 * Implements all 6 PAL systems from Excel Profile!D18
 */

import type { Gender } from '../types'
import { MET_ACTIVITIES } from '../constants/metActivities'

export type PALSystem =
  | 'FAO/WHO/UNU based PAL values'
  | 'DAMNRIPPED PAL values'
  | 'Pro Physique PAL values'
  | 'Fitness Stuff PAL values'
  | 'Basic internet PAL values'
  | 'Beräkna din aktivitetsnivå'
  | 'Custom PAL'

export type ActivityLevel =
  | 'Sedentary'
  | 'Lightly active'
  | 'Moderately active'
  | 'Very active'
  | 'Extremely active'

export type IntensityLevel = 'None' | 'Light' | 'Moderate' | 'Difficult' | 'Intense'

export type DailySteps =
  | '3 000 – 4 999 steps/day'
  | '5 000 – 6 999 steps/day'
  | '7 000 – 8 999 steps/day'
  | '9 000 – 10 999 steps/day'
  | '11 000 – 12 999 steps/day'
  | '≥ 13 000 steps/day'

export interface TDEEParams {
  bmr: number
  palSystem: PALSystem
  activityLevel: ActivityLevel
  gender: Gender
  intensityLevel?: IntensityLevel
  trainingFrequencyPerWeek?: number
  trainingDurationMinutes?: number
  dailySteps?: DailySteps
  customPAL?: number
  // Beräkna din aktivitetsnivå fields
  trainingActivityId?: string
  trainingDaysPerWeek?: number
  trainingMinutesPerSession?: number
  walkingActivityId?: string
  stepsPerDay?: number
  hoursStandingPerDay?: number
  householdActivityId?: string
  householdHoursPerDay?: number
  spaFactor?: number
  weightKg?: number
}

/**
 * 1. FAO/WHO/UNU based PAL values (most scientifically validated)
 */
function calculateFAOWHO(bmr: number, activityLevel: ActivityLevel, gender: Gender): number {
  // Validate BMR
  if (bmr <= 0) {
    return 0
  }

  const multipliers: Record<Gender, Record<ActivityLevel, number>> = {
    male: {
      Sedentary: 1.3,
      'Lightly active': 1.6,
      'Moderately active': 1.7,
      'Very active': 2.1,
      'Extremely active': 2.4,
    },
    female: {
      Sedentary: 1.3,
      'Lightly active': 1.5,
      'Moderately active': 1.6,
      'Very active': 1.9,
      'Extremely active': 2.2,
    },
  }

  return bmr * multipliers[gender][activityLevel]
}

/**
 * 2. DAMNRIPPED PAL values (most comprehensive, includes intensity)
 */
function calculateDAMNRIPPED(
  bmr: number,
  activityLevel: ActivityLevel,
  intensityLevel: IntensityLevel = 'None'
): number {
  // Validate BMR
  if (bmr <= 0) {
    return 0
  }

  const multipliers: Record<ActivityLevel, Record<IntensityLevel, number>> = {
    Sedentary: {
      None: 1.1,
      Light: 1.2,
      Moderate: 1.35,
      Difficult: 1.45,
      Intense: 1.55,
    },
    'Lightly active': {
      None: 1.2,
      Light: 1.4,
      Moderate: 1.45,
      Difficult: 1.55,
      Intense: 1.6,
    },
    'Moderately active': {
      None: 1.4,
      Light: 1.45,
      Moderate: 1.6,
      Difficult: 1.65,
      Intense: 1.7,
    },
    'Very active': {
      None: 1.6,
      Light: 1.7,
      Moderate: 1.75,
      Difficult: 1.8,
      Intense: 1.9,
    },
    'Extremely active': {
      None: 1.8,
      Light: 1.9,
      Moderate: 2,
      Difficult: 2.1,
      Intense: 2.2,
    },
  }

  return bmr * multipliers[activityLevel][intensityLevel]
}

/**
 * 3. Pro Physique PAL values (includes training frequency and duration)
 */
function calculateProPhysique(
  bmr: number,
  activityLevel: ActivityLevel,
  intensityLevel: IntensityLevel = 'Light',
  trainingFrequencyPerWeek: number = 0,
  trainingDurationMinutes: number = 0
): number {
  // Validate BMR
  if (bmr <= 0) {
    return 0
  }

  // Validate training parameters (negative values not allowed)
  const validFrequency = Math.max(0, trainingFrequencyPerWeek)
  const validDuration = Math.max(0, trainingDurationMinutes)

  const baseMultipliers: Record<ActivityLevel, number> = {
    Sedentary: 1.15,
    'Lightly active': 1.25,
    'Moderately active': 1.35,
    'Very active': 1.4,
    'Extremely active': 1.4, // Use Very active value
  }

  const intensityCalories: Record<IntensityLevel, number> = {
    None: 0,
    Light: 5,
    Moderate: 7.5,
    Difficult: 10,
    Intense: 12,
  }

  const baseTDEE = bmr * baseMultipliers[activityLevel]
  const trainingCalories = (validFrequency / 7) * validDuration * intensityCalories[intensityLevel]

  return baseTDEE + trainingCalories
}

/**
 * 4. Fitness Stuff PAL values (includes training hours per week and daily steps)
 */
function calculateFitnessStuff(
  bmr: number,
  trainingHoursPerWeek: number,
  dailySteps?: DailySteps
): number {
  // Validate BMR
  if (bmr <= 0) {
    return 0
  }

  // Validate training hours (negative values not allowed)
  const validHours = Math.max(0, trainingHoursPerWeek)

  // Base multiplier based on training hours
  let multiplier: number
  if (validHours <= 1) {
    multiplier = 1 // 0-1h
  } else if (validHours <= 3) {
    multiplier = 1.125 // 1-3h
  } else if (validHours <= 5) {
    multiplier = 1.25 // 3-5h
  } else if (validHours <= 8) {
    multiplier = 1.375 // 6-8h
  } else {
    multiplier = 1.5 // >8h
  }

  const baseTDEE = bmr * multiplier

  // Add calories from daily steps
  const stepsCalories: Record<DailySteps, number> = {
    '3 000 – 4 999 steps/day': 150,
    '5 000 – 6 999 steps/day': 240,
    '7 000 – 8 999 steps/day': 330,
    '9 000 – 10 999 steps/day': 420,
    '11 000 – 12 999 steps/day': 510,
    '≥ 13 000 steps/day': 600,
  }

  const stepBonus = dailySteps ? stepsCalories[dailySteps] : 0

  return baseTDEE + stepBonus
}

/**
 * 5. Basic internet PAL values (most common online calculators)
 */
function calculateBasicInternet(bmr: number, activityLevel: ActivityLevel): number {
  // Validate BMR
  if (bmr <= 0) {
    return 0
  }

  const multipliers: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    'Lightly active': 1.375,
    'Moderately active': 1.55,
    'Very active': 1.725,
    'Extremely active': 1.9,
  }

  return bmr * multipliers[activityLevel]
}

/**
 * Get PAL multiplier for Basic internet PAL values
 * Exported for use in simple calculators
 */
export function getBasicInternetPAL(activityLevel: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    Sedentary: 1.2,
    'Lightly active': 1.375,
    'Moderately active': 1.55,
    'Very active': 1.725,
    'Extremely active': 1.9,
  }

  return multipliers[activityLevel]
}

/**
 * 6. Beräkna din aktivitetsnivå (detailed activity tracking)
 */
function calculateActivityLevelWizard(
  bmr: number,
  weightKg: number,
  _trainingActivityId: string | undefined,
  trainingDaysPerWeek: number = 0,
  trainingMinutesPerSession: number = 0,
  _walkingActivityId: string | undefined,
  stepsPerDay: number = 7000,
  hoursStandingPerDay: number = 0,
  _householdActivityId: string | undefined,
  householdHoursPerDay: number = 0,
  spaFactor: number = 1.0
): number {
  // Validate BMR and weight
  if (bmr <= 0 || weightKg <= 0) {
    return 0
  }

  const trainingMET = MET_ACTIVITIES.find(a => a.id === _trainingActivityId)?.met
  // Walking has a permanent default selection ('17190', 3.8 MET) — fall back if not yet registered
  const walkingMET = MET_ACTIVITIES.find(a => a.id === _walkingActivityId)?.met ?? 3.8
  const householdMET = MET_ACTIVITIES.find(a => a.id === _householdActivityId)?.met

  // Training activity must be explicitly selected
  if (!trainingMET) return 0
  // Household activity required only if household hours > 0
  if (householdHoursPerDay > 0 && !householdMET) return 0

  // EAT (Exercise Activity Thermogenesis): netto träningskalorier per dag (MET−1 undviker dubbelräkning med BMR)
  const eat =
    (trainingDaysPerWeek / 7) * (trainingMinutesPerSession / 60) * (trainingMET - 1) * weightKg

  // NEAT_steps: netto gångkalorier från steg, skalade mot referensgången (3.8 MET)
  const tempoFactor = (walkingMET - 1) / (3.8 - 1)
  const neatSteps = stepsPerDay * (0.04 / 70) * weightKg * tempoFactor

  // NEAT_standing: netto stående-kalorier (1.3 MET − 1 = 0.3 extra över vila)
  const neatStanding = (1.3 - 1) * weightKg * hoursStandingPerDay

  // NEAT_household: netto hushållskalorier (MET−1)
  const neatHousehold = ((householdMET ?? 0) - 1) * weightKg * householdHoursPerDay

  // NEAT_total: SPA multipliceras på NEAT-komponenterna (Levine 1999, 2002, 2004)
  // SPA representerar den spontana variationen i NEAT-beteende (fidgeting, positionsbyten etc.)
  // spaFactor ∈ [0.95, 1.15]: 1.00 = normal, <1.00 = låg, >1.00 = hög spontan aktivitet
  const neatTotal = (neatSteps + neatStanding + neatHousehold) * spaFactor

  // TEF (Thermic Effect of Food) ≈ 10% av TDEE
  // TDEE = BMR + NEAT×SPA + EAT + TEF
  // TEF = 0.10 × TDEE  →  TDEE = (BMR + NEAT×SPA + EAT) / 0.9
  const tdee = (bmr + neatTotal + eat) / 0.9

  return tdee
}

/**
 * 7. Custom PAL (user-defined multiplier)
 */
function calculateCustomPAL(bmr: number, customPAL: number): number {
  // Validate BMR
  if (bmr <= 0) {
    return 0
  }

  // Validate custom PAL (should be between 1.0 and 3.0 for realistic values)
  if (customPAL < 1.0 || customPAL > 3.0) {
    console.warn(`Custom PAL value ${customPAL} is outside realistic range (1.0-3.0)`)
    // Clamp to reasonable bounds
    const validPAL = Math.max(1.0, Math.min(3.0, customPAL))
    return bmr * validPAL
  }

  return bmr * customPAL
}

/**
 * Calculate TDEE using specified PAL system
 */
export function calculateTDEE(params: TDEEParams): number {
  const {
    bmr,
    palSystem,
    activityLevel,
    gender = 'male',
    intensityLevel = 'None',
    trainingFrequencyPerWeek = 0,
    trainingDurationMinutes = 0,
    dailySteps,
    customPAL = 1.2,
  } = params

  // Validate BMR at the entry point
  if (bmr <= 0) {
    console.error('Invalid BMR value:', bmr)
    return 0
  }

  let tdee: number

  switch (palSystem) {
    case 'FAO/WHO/UNU based PAL values':
      tdee = calculateFAOWHO(bmr, activityLevel, gender)
      break

    case 'DAMNRIPPED PAL values':
      tdee = calculateDAMNRIPPED(bmr, activityLevel, intensityLevel)
      break

    case 'Pro Physique PAL values':
      tdee = calculateProPhysique(
        bmr,
        activityLevel,
        intensityLevel,
        trainingFrequencyPerWeek,
        trainingDurationMinutes
      )
      break

    case 'Fitness Stuff PAL values': {
      const trainingHoursPerWeek = (trainingFrequencyPerWeek * trainingDurationMinutes) / 60
      tdee = calculateFitnessStuff(bmr, trainingHoursPerWeek, dailySteps)
      break
    }

    case 'Basic internet PAL values':
      tdee = calculateBasicInternet(bmr, activityLevel)
      break

    case 'Beräkna din aktivitetsnivå':
      tdee = calculateActivityLevelWizard(
        bmr,
        params.weightKg || 70, // Default weight if not provided
        params.trainingActivityId,
        params.trainingDaysPerWeek || 0,
        params.trainingMinutesPerSession || 0,
        params.walkingActivityId,
        params.stepsPerDay || 7000,
        params.hoursStandingPerDay || 0,
        params.householdActivityId,
        params.householdHoursPerDay || 0,
        params.spaFactor ?? 1.0
      )
      break

    case 'Custom PAL':
      tdee = calculateCustomPAL(bmr, customPAL)
      break

    default:
      tdee = calculateBasicInternet(bmr, activityLevel)
  }

  return tdee // NO ROUNDING - keep exact decimals for precision
}

/**
 * Get activity level descriptions
 */
export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  Sedentary:
    'Lite till ingen träning. Passar för personer med minimal fysisk aktivitet (t.ex. kontorsjobb, ingen regelbunden träning).',
  'Lightly active':
    'Lätt träning eller sport 1-3 dagar/vecka. Lämplig för de som tränar lätt ibland (t.ex. promenader, lättare jogging, yoga).',
  'Moderately active':
    'Måttlig träning eller sport 3-5 dagar/vecka. Ideal för personer med regelbundna måttliga träningsrutiner (t.ex. gymträning, simning, cykling).',
  'Very active':
    'Hård träning eller sport 6-7 dagar/vecka. Passar för personer som tränar intensivt nästan dagligen (t.ex. idrottare, intensiv träning).',
  'Extremely active':
    'Mycket hård träning, fysiskt arbete eller träning två gånger om dagen. För de med exceptionellt hög energiförbrukning (t.ex. professionella idrottare, tungt kroppsarbete).',
}

/**
 * Get intensity level descriptions
 */
export const INTENSITY_DESCRIPTIONS: Record<IntensityLevel, string> = {
  None: 'Ingen extra träning',
  Light: 'Lätt träning (yoga, promenader)',
  Moderate: 'Måttlig träning (jogging, cykling)',
  Difficult: 'Intensiv träning (tung styrketräning, intervaller)',
  Intense: 'Maximal träning (tävlingsnivå)',
}
