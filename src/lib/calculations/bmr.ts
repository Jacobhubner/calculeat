/**
 * BMR (Basal Metabolic Rate) Calculations
 * Implements all 10 BMR formulas from Excel Profile!D17
 */

import type { Gender } from '../types'

export type BMRFormula =
  | 'Mifflin-St Jeor equation'
  | 'Cunningham equation'
  | 'Oxford/Henry equation'
  | 'Schofield equation'
  | 'Revised Harris-Benedict equation'
  | 'Original Harris-Benedict equation'
  | 'MacroFactor standard equation'
  | 'MacroFactor FFM equation'
  | 'MacroFactor athlete equation'
  | 'Fitness Stuff Podcast equation'

export interface BMRParams {
  weight: number // kg
  height: number // cm
  age: number // years
  gender: Gender
  bodyFatPercentage?: number // % (0-100)
}

/**
 * Calculate lean body mass (fat-free mass)
 */
function calculateLeanMass(weight: number, bodyFatPercentage: number): number {
  return weight * (1 - bodyFatPercentage / 100)
}

/**
 * 1. Mifflin-St Jeor equation (most accurate for general population)
 * Men: (9.99 × weight) + (6.25 × height) - (4.92 × age) + 5
 * Women: (9.99 × weight) + (6.25 × height) - (4.92 × age) - 161
 */
export function mifflinStJeor(params: BMRParams): number {
  const { weight, height, age, gender } = params
  const base = 9.99 * weight + 6.25 * height - 4.92 * age

  if (gender === 'male') {
    return base + 5
  } else {
    return base - 161
  }
}

/**
 * 2. Cunningham equation (requires body fat percentage)
 * BMR = 370 + (21.6 × lean_mass)
 */
export function cunningham(params: BMRParams): number | null {
  const { weight, bodyFatPercentage } = params

  if (!bodyFatPercentage || bodyFatPercentage <= 0) {
    return null
  }

  const leanMass = calculateLeanMass(weight, bodyFatPercentage)
  return 370 + 21.6 * leanMass
}

/**
 * 3. Oxford/Henry equation (age-specific)
 */
export function oxfordHenry(params: BMRParams): number {
  const { gender, age, weight, height } = params

  if (gender === 'male') {
    if (age < 3) return 28.2 * weight + 859 * (height * 0.01) - 371
    if (age < 10) return 15.1 * weight + 74.2 * (height * 0.01) + 306
    if (age < 18) return 15.6 * weight + 266 * (height * 0.01) + 299
    if (age < 30) return 14.4 * weight + 313 * (height * 0.01) + 113
    if (age < 60) return 11.4 * weight + 541 * (height * 0.01) - 137
    return 11.4 * weight + 541 * (height * 0.01) - 256
  } else {
    if (age < 3) return 30.4 * weight + 703 * (height * 0.01) - 287
    if (age < 10) return 15.9 * weight + 210 * (height * 0.01) + 349
    if (age < 18) return 9.4 * weight + 249 * (height * 0.01) + 462
    if (age < 30) return 10.4 * weight + 615 * (height * 0.01) - 282
    if (age < 60) return 8.18 * weight + 502 * (height * 0.01) - 11.6
    return 8.52 * weight + 421 * (height * 0.01) + 10.7
  }
}

/**
 * 4. Schofield equation (WHO recommended, age-specific)
 */
export function schofield(params: BMRParams): number {
  const { gender, age, weight } = params

  if (gender === 'male') {
    if (age < 3) return 60.9 * weight - 54
    if (age < 10) return 22.7 * weight + 495
    if (age < 18) return 17.5 * weight + 651
    if (age < 30) return 15.3 * weight + 679
    if (age < 60) return 11.6 * weight + 879
    return 13.5 * weight + 487
  } else {
    if (age < 3) return 61 * weight - 51
    if (age < 10) return 22.5 * weight + 499
    if (age < 18) return 12.2 * weight + 746
    if (age < 30) return 14.7 * weight + 496
    if (age < 60) return 8.7 * weight + 829
    return 10.5 * weight + 596
  }
}

/**
 * 5. Revised Harris-Benedict equation
 * Men: (13.397 × weight) + (4.799 × height) - (5.677 × age) + 88.362
 * Women: (9.247 × weight) + (3.098 × height) - (4.33 × age) + 447.593
 */
export function revisedHarrisBenedict(params: BMRParams): number {
  const { gender, age, weight, height } = params

  if (gender === 'male') {
    return 13.397 * weight + 4.799 * height - 5.677 * age + 88.362
  } else {
    return 9.247 * weight + 3.098 * height - 4.33 * age + 447.593
  }
}

/**
 * 6. Original Harris-Benedict equation (1919)
 * Men: (13.7516 × weight) + (5.0033 × height) - (6.755 × age) + 66.473
 * Women: (9.5634 × weight) + (1.8496 × height) - (4.6756 × age) + 655.0955
 */
export function originalHarrisBenedict(params: BMRParams): number {
  const { gender, age, weight, height } = params

  if (gender === 'male') {
    return 13.7516 * weight + 5.0033 * height - 6.755 * age + 66.473
  } else {
    return 9.5634 * weight + 1.8496 * height - 4.6756 * age + 655.0955
  }
}

/**
 * 7. MacroFactor standard equation
 * 129.6 × weight^0.55 + 0.011 × height^2 - age_factor × age - 213.8 × sex_factor
 */
export function macroFactorStandard(params: BMRParams): number {
  const { gender, age, weight, height } = params

  const ageFactor = age < 61 ? 1.96 : 4.9
  const sexFactor = gender === 'male' ? 0 : 1

  return (
    129.6 * Math.pow(weight, 0.55) +
    0.011 * Math.pow(height, 2) -
    ageFactor * age -
    213.8 * sexFactor
  )
}

/**
 * 8. MacroFactor FFM equation (requires body fat percentage)
 * 50.2 × FFM^0.7 + 40.5 × (FFM^0.7 × (weight - FFM)^0.066) - age_factor × age
 */
export function macroFactorFFM(params: BMRParams): number | null {
  const { age, weight, bodyFatPercentage } = params

  if (!bodyFatPercentage || bodyFatPercentage <= 0) {
    return null
  }

  const leanMass = calculateLeanMass(weight, bodyFatPercentage)
  const ageFactor = age < 61 ? 1.1 : 2.75

  return (
    50.2 * Math.pow(leanMass, 0.7) +
    40.5 * (Math.pow(leanMass, 0.7) * Math.pow(weight - leanMass, 0.066)) -
    ageFactor * age
  )
}

/**
 * 9. MacroFactor athlete equation (requires body fat percentage)
 * 40.4 × FFM^0.932
 */
export function macroFactorAthlete(params: BMRParams): number | null {
  const { weight, bodyFatPercentage } = params

  if (!bodyFatPercentage || bodyFatPercentage <= 0) {
    return null
  }

  const leanMass = calculateLeanMass(weight, bodyFatPercentage)
  return 40.4 * Math.pow(leanMass, 0.932)
}

/**
 * 10. Fitness Stuff Podcast equation (requires body fat percentage)
 * ((370 + (21.6 × FFM)) + sex_factor) × age_factor
 */
export function fitnessStuffPodcast(params: BMRParams): number | null {
  const { gender, age, weight, bodyFatPercentage } = params

  if (!bodyFatPercentage || bodyFatPercentage <= 0) {
    return null
  }

  const leanMass = calculateLeanMass(weight, bodyFatPercentage)
  const sexFactor = gender === 'male' ? 5 : -161
  const ageFactor = age <= 60 ? 1 : 0.9

  return (370 + 21.6 * leanMass + sexFactor) * ageFactor
}

/**
 * Calculate BMR using specified formula
 */
export function calculateBMR(formula: BMRFormula, params: BMRParams): number | null {
  switch (formula) {
    case 'Mifflin-St Jeor equation':
      return mifflinStJeor(params)
    case 'Cunningham equation':
      return cunningham(params)
    case 'Oxford/Henry equation':
      return oxfordHenry(params)
    case 'Schofield equation':
      return schofield(params)
    case 'Revised Harris-Benedict equation':
      return revisedHarrisBenedict(params)
    case 'Original Harris-Benedict equation':
      return originalHarrisBenedict(params)
    case 'MacroFactor standard equation':
      return macroFactorStandard(params)
    case 'MacroFactor FFM equation':
      return macroFactorFFM(params)
    case 'MacroFactor athlete equation':
      return macroFactorAthlete(params)
    case 'Fitness Stuff Podcast equation':
      return fitnessStuffPodcast(params)
    default:
      return null
  }
}

// Legacy compatibility
export const calculateMifflinStJeor = mifflinStJeor
export const calculateHarrisBenedict = revisedHarrisBenedict
export const calculateCunningham = cunningham

/**
 * Check if a BMR formula requires body fat percentage
 */
export function requiresBodyFat(formula: BMRFormula): boolean {
  return [
    'Cunningham equation',
    'MacroFactor FFM equation',
    'MacroFactor athlete equation',
    'Fitness Stuff Podcast equation',
  ].includes(formula)
}
