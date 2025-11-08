/**
 * BMR (Basal Metabolic Rate) Calculations
 * Beräknar basalmetabolism - energin kroppen behöver i vila
 */

import type { Gender } from '../types'

export interface BMRParams {
  weight: number // kg
  height: number // cm
  age: number // år
  gender: Gender
  bodyFatPercentage?: number // % (för Cunningham-formeln)
}

/**
 * Mifflin-St Jeor formel (rekommenderad)
 * Mest använd och korrekt för moderna populationer
 *
 * Män: BMR = (10 × vikt) + (6.25 × längd) - (5 × ålder) + 5
 * Kvinnor: BMR = (10 × vikt) + (6.25 × längd) - (5 × ålder) - 161
 */
export function calculateMifflinStJeor(params: BMRParams): number {
  const { weight, height, age, gender } = params

  // Validering
  if (weight <= 0 || height <= 0 || age <= 0) {
    throw new Error('Vikt, längd och ålder måste vara positiva värden')
  }

  const base = 10 * weight + 6.25 * height - 5 * age

  if (gender === 'male') {
    return Math.round(base + 5)
  } else if (gender === 'female') {
    return Math.round(base - 161)
  } else {
    // För andra kön, använd medelvärde
    return Math.round(base - 78)
  }
}

/**
 * Harris-Benedict formel (reviderad 1984)
 * Äldre men fortfarande används
 *
 * Män: BMR = 88.362 + (13.397 × vikt) + (4.799 × längd) - (5.677 × ålder)
 * Kvinnor: BMR = 447.593 + (9.247 × vikt) + (3.098 × längd) - (4.330 × ålder)
 */
export function calculateHarrisBenedict(params: BMRParams): number {
  const { weight, height, age, gender } = params

  if (weight <= 0 || height <= 0 || age <= 0) {
    throw new Error('Vikt, längd och ålder måste vara positiva värden')
  }

  if (gender === 'male') {
    return Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age)
  } else if (gender === 'female') {
    return Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.33 * age)
  } else {
    // Medelvärde för andra kön
    const male = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
    const female = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age
    return Math.round((male + female) / 2)
  }
}

/**
 * Cunningham formel
 * Baserad på fettfri massa - mest korrekt för atletiska personer
 *
 * BMR = 500 + 22 × fettfri massa (kg)
 * Fettfri massa = vikt × (1 - kroppsfett%)
 */
export function calculateCunningham(params: BMRParams): number {
  const { weight, bodyFatPercentage } = params

  if (weight <= 0) {
    throw new Error('Vikt måste vara ett positivt värde')
  }

  if (bodyFatPercentage === undefined || bodyFatPercentage === null) {
    throw new Error('Kroppsfett% krävs för Cunningham-formeln')
  }

  if (bodyFatPercentage < 0 || bodyFatPercentage > 100) {
    throw new Error('Kroppsfett% måste vara mellan 0 och 100')
  }

  const bodyFatDecimal = bodyFatPercentage / 100
  const leanBodyMass = weight * (1 - bodyFatDecimal)

  return Math.round(500 + 22 * leanBodyMass)
}

/**
 * Huvudfunktion för BMR-beräkning
 * Väljer formel baserat på användarens inställning
 */
export function calculateBMR(
  params: BMRParams,
  formula: 'mifflin_st_jeor' | 'harris_benedict' | 'cunningham' = 'mifflin_st_jeor'
): number {
  switch (formula) {
    case 'mifflin_st_jeor':
      return calculateMifflinStJeor(params)
    case 'harris_benedict':
      return calculateHarrisBenedict(params)
    case 'cunningham':
      return calculateCunningham(params)
    default:
      throw new Error(`Okänd BMR-formel: ${formula}`)
  }
}
