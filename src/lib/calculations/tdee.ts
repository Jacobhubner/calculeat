/**
 * TDEE (Total Daily Energy Expenditure) Calculations
 * Implements all 6 PAL systems from Excel Profile!D18
 */

import type { Gender } from '../types'

export type PALSystem =
  | 'FAO/WHO/UNU based PAL values'
  | 'DAMNRIPPED PAL values'
  | 'Pro Physique PAL values'
  | 'Fitness Stuff PAL values'
  | 'Basic internet PAL values'
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
}

/**
 * 1. FAO/WHO/UNU based PAL values (most scientifically validated)
 */
function calculateFAOWHO(bmr: number, activityLevel: ActivityLevel, gender: Gender): number {
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
  const trainingCalories =
    (trainingFrequencyPerWeek / 7) * trainingDurationMinutes * intensityCalories[intensityLevel]

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
  // Base multiplier based on training hours
  let multiplier: number
  if (trainingHoursPerWeek < 1) {
    multiplier = 1
  } else if (trainingHoursPerWeek < 3) {
    multiplier = 1.123
  } else if (trainingHoursPerWeek < 5.5) {
    multiplier = 1.25
  } else if (trainingHoursPerWeek < 8) {
    multiplier = 1.375
  } else {
    multiplier = 1.5
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
 * 6. Custom PAL (user-defined multiplier)
 */
function calculateCustomPAL(bmr: number, customPAL: number): number {
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

    case 'Custom PAL':
      tdee = calculateCustomPAL(bmr, customPAL)
      break

    default:
      tdee = calculateBasicInternet(bmr, activityLevel)
  }

  return Math.round(tdee)
}

/**
 * Get activity level descriptions
 */
export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  Sedentary: 'Stillasittande - lite eller ingen träning',
  'Lightly active': 'Lätt aktiv - lätt träning/sport 1-3 dagar per vecka',
  'Moderately active': 'Måttligt aktiv - måttlig träning/sport 3-5 dagar per vecka',
  'Very active': 'Mycket aktiv - hård träning/sport 6-7 dagar per vecka',
  'Extremely active': 'Extra aktiv - mycket hård träning/sport & fysiskt arbete',
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
