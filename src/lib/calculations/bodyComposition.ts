/**
 * Body Composition Calculators
 * Implements all 12 body fat percentage calculation methods from Excel Profile sheet
 */

import type { Gender } from '../types'

export type BodyCompositionMethod =
  | 'Jackson/Pollock 3 Caliper Method (Male)'
  | 'Jackson/Pollock 3 Caliper Method (Female)'
  | 'Jackson/Pollock 4 Caliper Method'
  | 'Jackson/Pollock 7 Caliper Method'
  | 'Durnin/Womersley Caliper Method'
  | 'Parillo Caliper Method'
  | 'Covert Bailey Measuring Tape Method'
  | 'U.S. Navy Body Fat Formula'
  | 'YMCA Measuring Tape Method'
  | 'Modified YMCA Measuring Tape Method'
  | 'Heritage BMI to Body Fat Method'
  | 'Reversed Cunningham equation'

export interface CaliperMeasurements {
  chest?: number // mm
  abdominal?: number // mm
  thigh?: number // mm
  tricep?: number // mm
  subscapular?: number // mm
  suprailiac?: number // mm
  midaxillary?: number // mm
  bicep?: number // mm
}

export interface TapeMeasurements {
  neck?: number // cm
  waist?: number // cm
  hip?: number // cm
  wrist?: number // cm
  forearm?: number // cm
}

export interface BodyCompositionParams {
  age: number
  gender: Gender
  weight: number // kg
  height: number // cm
  bmi?: number
  caliperMeasurements?: CaliperMeasurements
  tapeMeasurements?: TapeMeasurements
  bmr?: number // For reversed Cunningham
}

/**
 * Convert body density to body fat percentage using Siri equation
 * BF% = (495 / BD) - 450
 */
export function siriEquation(bodyDensity: number): number {
  return 495 / bodyDensity - 450
}

/**
 * Convert body density to body fat percentage using Brozek equation
 * BF% = (457 / BD) - 414.2
 */
export function brozekEquation(bodyDensity: number): number {
  return 457 / bodyDensity - 414.2
}

/**
 * 1. Jackson/Pollock 3 Caliper Method (Male)
 * Sites: chest, abdominal, thigh
 */
export function jacksonPollock3Male(params: BodyCompositionParams): number | null {
  const { age, caliperMeasurements } = params

  if (
    !caliperMeasurements?.chest ||
    !caliperMeasurements?.abdominal ||
    !caliperMeasurements?.thigh
  ) {
    return null
  }

  const { chest, abdominal, thigh } = caliperMeasurements
  const sum = chest + abdominal + thigh

  // Body density calculation
  const bodyDensity = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age

  return siriEquation(bodyDensity)
}

/**
 * 2. Jackson/Pollock 3 Caliper Method (Female)
 * Sites: tricep, suprailiac, thigh
 */
export function jacksonPollock3Female(params: BodyCompositionParams): number | null {
  const { age, caliperMeasurements } = params

  if (
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.suprailiac ||
    !caliperMeasurements?.thigh
  ) {
    return null
  }

  const { tricep, suprailiac, thigh } = caliperMeasurements
  const sum = tricep + suprailiac + thigh

  // Body density calculation
  const bodyDensity = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age

  return siriEquation(bodyDensity)
}

/**
 * 3. Jackson/Pollock 4 Caliper Method
 * Sites: abdominal, suprailiac, tricep, thigh
 */
export function jacksonPollock4(params: BodyCompositionParams): number | null {
  const { age, gender, caliperMeasurements } = params

  if (
    !caliperMeasurements?.abdominal ||
    !caliperMeasurements?.suprailiac ||
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.thigh
  ) {
    return null
  }

  const { abdominal, suprailiac, tricep, thigh } = caliperMeasurements
  const sum = abdominal + suprailiac + tricep + thigh

  let bodyDensity: number

  if (gender === 'male') {
    bodyDensity = 1.10726 - 0.00081 * sum + 0.00000357 * sum * sum - 0.00035 * age
  } else {
    bodyDensity = 1.096095 - 0.0006952 * sum + 0.0000011 * sum * sum - 0.0001 * age
  }

  return siriEquation(bodyDensity)
}

/**
 * 4. Jackson/Pollock 7 Caliper Method
 * Sites: chest, abdominal, thigh, tricep, subscapular, suprailiac, midaxillary
 */
export function jacksonPollock7(params: BodyCompositionParams): number | null {
  const { age, gender, caliperMeasurements } = params

  if (
    !caliperMeasurements?.chest ||
    !caliperMeasurements?.abdominal ||
    !caliperMeasurements?.thigh ||
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.subscapular ||
    !caliperMeasurements?.suprailiac ||
    !caliperMeasurements?.midaxillary
  ) {
    return null
  }

  const { chest, abdominal, thigh, tricep, subscapular, suprailiac, midaxillary } =
    caliperMeasurements
  const sum = chest + abdominal + thigh + tricep + subscapular + suprailiac + midaxillary

  let bodyDensity: number

  if (gender === 'male') {
    bodyDensity = 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age
  } else {
    bodyDensity = 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age
  }

  return siriEquation(bodyDensity)
}

/**
 * 5. Durnin/Womersley Caliper Method
 * Sites: bicep, tricep, subscapular, suprailiac
 */
export function durninWomersley(params: BodyCompositionParams): number | null {
  const { age, gender, caliperMeasurements } = params

  if (
    !caliperMeasurements?.bicep ||
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.subscapular ||
    !caliperMeasurements?.suprailiac
  ) {
    return null
  }

  const { bicep, tricep, subscapular, suprailiac } = caliperMeasurements
  const sum = bicep + tricep + subscapular + suprailiac
  const logSum = Math.log10(sum)

  let bodyDensity: number

  if (gender === 'male') {
    if (age < 17) {
      bodyDensity = 1.1533 - 0.0643 * logSum
    } else if (age < 20) {
      bodyDensity = 1.162 - 0.063 * logSum
    } else if (age < 30) {
      bodyDensity = 1.1631 - 0.0632 * logSum
    } else if (age < 40) {
      bodyDensity = 1.1422 - 0.0544 * logSum
    } else if (age < 50) {
      bodyDensity = 1.162 - 0.07 * logSum
    } else {
      bodyDensity = 1.1715 - 0.0779 * logSum
    }
  } else {
    if (age < 17) {
      bodyDensity = 1.1369 - 0.0598 * logSum
    } else if (age < 20) {
      bodyDensity = 1.1549 - 0.0678 * logSum
    } else if (age < 30) {
      bodyDensity = 1.1599 - 0.0717 * logSum
    } else if (age < 40) {
      bodyDensity = 1.1423 - 0.0632 * logSum
    } else if (age < 50) {
      bodyDensity = 1.1333 - 0.0612 * logSum
    } else {
      bodyDensity = 1.1339 - 0.0645 * logSum
    }
  }

  return siriEquation(bodyDensity)
}

/**
 * 6. Parillo Caliper Method
 * Sites: chest, abdominal, thigh, bicep, tricep, subscapular, suprailiac, midaxillary, calf
 * Note: Calf measurement not in our interface, so we'll use 7-site version
 */
export function parillo(params: BodyCompositionParams): number | null {
  const { caliperMeasurements } = params

  if (
    !caliperMeasurements?.chest ||
    !caliperMeasurements?.abdominal ||
    !caliperMeasurements?.thigh ||
    !caliperMeasurements?.bicep ||
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.subscapular ||
    !caliperMeasurements?.suprailiac
  ) {
    return null
  }

  const { chest, abdominal, thigh, bicep, tricep, subscapular, suprailiac } = caliperMeasurements
  const sum = chest + abdominal + thigh + bicep + tricep + subscapular + suprailiac

  // Parillo method: sum of skinfolds / 27 (simplified version)
  return sum / 27
}

/**
 * 7. Covert Bailey Measuring Tape Method
 * Uses hip, waist, wrist, forearm measurements
 */
export function covertBailey(params: BodyCompositionParams): number | null {
  const { gender, tapeMeasurements } = params

  if (
    !tapeMeasurements?.hip ||
    !tapeMeasurements?.waist ||
    !tapeMeasurements?.wrist ||
    !tapeMeasurements?.forearm
  ) {
    return null
  }

  const { hip, waist, wrist, forearm } = tapeMeasurements

  if (gender === 'male') {
    // Male formula
    const factor1 = waist + hip - forearm
    const factor2 = wrist
    return factor1 * 0.29288 - factor2 * 0.74041 - 15.0
  } else {
    // Female formula
    const factor1 = waist + hip - forearm
    const factor2 = wrist
    return factor1 * 0.268 - factor2 * 0.318 - 8.987
  }
}

/**
 * 8. U.S. Navy Body Fat Formula
 * Male: neck, waist, height
 * Female: neck, waist, hip, height
 */
export function usNavy(params: BodyCompositionParams): number | null {
  const { gender, height, tapeMeasurements } = params

  if (!tapeMeasurements?.neck || !tapeMeasurements?.waist) {
    return null
  }

  const { neck, waist, hip } = tapeMeasurements

  if (gender === 'male') {
    // Male: 86.010 × log10(abdomen - neck) - 70.041 × log10(height) + 36.76
    const bodyFat = 86.01 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76
    return bodyFat
  } else {
    // Female: 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
    if (!hip) return null
    const bodyFat = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387
    return bodyFat
  }
}

/**
 * 9. YMCA Measuring Tape Method
 * Uses weight and waist measurement
 */
export function ymca(params: BodyCompositionParams): number | null {
  const { gender, weight, tapeMeasurements } = params

  if (!tapeMeasurements?.waist) {
    return null
  }

  const { waist } = tapeMeasurements
  const weightLbs = weight * 2.20462 // Convert kg to lbs
  const waistInches = waist / 2.54 // Convert cm to inches

  if (gender === 'male') {
    // Male YMCA formula
    return -98.42 + 4.15 * waistInches - 0.082 * weightLbs
  } else {
    // Female YMCA formula
    return -76.76 + 4.15 * waistInches - 0.082 * weightLbs
  }
}

/**
 * 10. Modified YMCA Measuring Tape Method
 * Enhanced version with additional measurements
 */
export function modifiedYmca(params: BodyCompositionParams): number | null {
  const { gender, weight, height, tapeMeasurements } = params

  if (!tapeMeasurements?.waist || !tapeMeasurements?.neck) {
    return null
  }

  const { waist, neck, hip } = tapeMeasurements
  const weightLbs = weight * 2.20462
  const heightInches = height / 2.54
  const waistInches = waist / 2.54
  const neckInches = neck / 2.54

  if (gender === 'male') {
    // Modified male formula
    return -98.42 + 4.15 * waistInches - 0.082 * weightLbs - 2.2 * neckInches + 0.5 * heightInches
  } else {
    // Modified female formula
    if (!hip) return null
    const hipInches = hip / 2.54
    return -76.76 + 4.15 * waistInches - 0.082 * weightLbs - 2.2 * neckInches + 0.3 * hipInches
  }
}

/**
 * 11. Heritage BMI to Body Fat Method
 * Estimates body fat from BMI, age, and gender
 */
export function heritageBMI(params: BodyCompositionParams): number | null {
  const { age, gender, bmi } = params

  if (!bmi) return null

  if (gender === 'male') {
    // Male Heritage formula
    return 1.2 * bmi + 0.23 * age - 16.2
  } else {
    // Female Heritage formula
    return 1.2 * bmi + 0.23 * age - 5.4
  }
}

/**
 * 12. Reversed Cunningham Equation
 * Calculate body fat from BMR and weight
 * BMR = 370 + (21.6 × lean_mass)
 * Rearranged: lean_mass = (BMR - 370) / 21.6
 * Body fat % = (1 - lean_mass / weight) × 100
 */
export function reversedCunningham(params: BodyCompositionParams): number | null {
  const { weight, bmr } = params

  if (!bmr) return null

  const leanMass = (bmr - 370) / 21.6
  const bodyFatPercentage = (1 - leanMass / weight) * 100

  // Sanity check
  if (bodyFatPercentage < 0 || bodyFatPercentage > 60) {
    return null
  }

  return bodyFatPercentage
}

/**
 * Calculate body fat percentage using specified method
 */
export function calculateBodyFat(
  method: BodyCompositionMethod,
  params: BodyCompositionParams
): number | null {
  switch (method) {
    case 'Jackson/Pollock 3 Caliper Method (Male)':
      return jacksonPollock3Male(params)

    case 'Jackson/Pollock 3 Caliper Method (Female)':
      return jacksonPollock3Female(params)

    case 'Jackson/Pollock 4 Caliper Method':
      return jacksonPollock4(params)

    case 'Jackson/Pollock 7 Caliper Method':
      return jacksonPollock7(params)

    case 'Durnin/Womersley Caliper Method':
      return durninWomersley(params)

    case 'Parillo Caliper Method':
      return parillo(params)

    case 'Covert Bailey Measuring Tape Method':
      return covertBailey(params)

    case 'U.S. Navy Body Fat Formula':
      return usNavy(params)

    case 'YMCA Measuring Tape Method':
      return ymca(params)

    case 'Modified YMCA Measuring Tape Method':
      return modifiedYmca(params)

    case 'Heritage BMI to Body Fat Method':
      return heritageBMI(params)

    case 'Reversed Cunningham equation':
      return reversedCunningham(params)

    default:
      return null
  }
}

/**
 * Calculate lean body mass from body fat percentage
 */
export function calculateLeanMass(weight: number, bodyFatPercentage: number): number {
  return weight * (1 - bodyFatPercentage / 100)
}

/**
 * Calculate fat mass from body fat percentage
 */
export function calculateFatMass(weight: number, bodyFatPercentage: number): number {
  return weight * (bodyFatPercentage / 100)
}

/**
 * Get body fat category based on age and gender
 * Uses ACE (American Council on Exercise) standards
 */
export function getBodyFatCategory(params: {
  bodyFatPercentage: number
  age: number
  gender: Gender
}): {
  category: string
  description: string
  color: 'green' | 'yellow' | 'orange' | 'red'
} {
  const { bodyFatPercentage, gender } = params

  if (gender === 'male') {
    if (bodyFatPercentage < 6) {
      return {
        category: 'Essential Fat',
        description: 'För lågt - risk för hälsoproblem',
        color: 'red',
      }
    } else if (bodyFatPercentage < 14) {
      return {
        category: 'Athletes',
        description: 'Idrottsnivå',
        color: 'green',
      }
    } else if (bodyFatPercentage < 18) {
      return {
        category: 'Fitness',
        description: 'Fitness-nivå',
        color: 'green',
      }
    } else if (bodyFatPercentage < 25) {
      return {
        category: 'Average',
        description: 'Genomsnitt',
        color: 'yellow',
      }
    } else {
      return {
        category: 'Obese',
        description: 'Övervikt',
        color: 'orange',
      }
    }
  } else {
    if (bodyFatPercentage < 14) {
      return {
        category: 'Essential Fat',
        description: 'För lågt - risk för hälsoproblem',
        color: 'red',
      }
    } else if (bodyFatPercentage < 21) {
      return {
        category: 'Athletes',
        description: 'Idrottsnivå',
        color: 'green',
      }
    } else if (bodyFatPercentage < 25) {
      return {
        category: 'Fitness',
        description: 'Fitness-nivå',
        color: 'green',
      }
    } else if (bodyFatPercentage < 32) {
      return {
        category: 'Average',
        description: 'Genomsnitt',
        color: 'yellow',
      }
    } else {
      return {
        category: 'Obese',
        description: 'Övervikt',
        color: 'orange',
      }
    }
  }
}

/**
 * Get available methods based on available measurements
 */
export function getAvailableMethods(params: BodyCompositionParams): BodyCompositionMethod[] {
  const methods: BodyCompositionMethod[] = []
  const { gender, caliperMeasurements, tapeMeasurements, bmi, bmr } = params

  // Jackson/Pollock 3 (Male)
  if (
    gender === 'male' &&
    caliperMeasurements?.chest &&
    caliperMeasurements?.abdominal &&
    caliperMeasurements?.thigh
  ) {
    methods.push('Jackson/Pollock 3 Caliper Method (Male)')
  }

  // Jackson/Pollock 3 (Female)
  if (
    gender === 'female' &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.suprailiac &&
    caliperMeasurements?.thigh
  ) {
    methods.push('Jackson/Pollock 3 Caliper Method (Female)')
  }

  // Jackson/Pollock 4
  if (
    caliperMeasurements?.abdominal &&
    caliperMeasurements?.suprailiac &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.thigh
  ) {
    methods.push('Jackson/Pollock 4 Caliper Method')
  }

  // Jackson/Pollock 7
  if (
    caliperMeasurements?.chest &&
    caliperMeasurements?.abdominal &&
    caliperMeasurements?.thigh &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.subscapular &&
    caliperMeasurements?.suprailiac &&
    caliperMeasurements?.midaxillary
  ) {
    methods.push('Jackson/Pollock 7 Caliper Method')
  }

  // Durnin/Womersley
  if (
    caliperMeasurements?.bicep &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.subscapular &&
    caliperMeasurements?.suprailiac
  ) {
    methods.push('Durnin/Womersley Caliper Method')
  }

  // Parillo
  if (
    caliperMeasurements?.chest &&
    caliperMeasurements?.abdominal &&
    caliperMeasurements?.thigh &&
    caliperMeasurements?.bicep &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.subscapular &&
    caliperMeasurements?.suprailiac
  ) {
    methods.push('Parillo Caliper Method')
  }

  // Covert Bailey
  if (
    tapeMeasurements?.hip &&
    tapeMeasurements?.waist &&
    tapeMeasurements?.wrist &&
    tapeMeasurements?.forearm
  ) {
    methods.push('Covert Bailey Measuring Tape Method')
  }

  // U.S. Navy
  if (tapeMeasurements?.neck && tapeMeasurements?.waist) {
    if (gender === 'male' || tapeMeasurements?.hip) {
      methods.push('U.S. Navy Body Fat Formula')
    }
  }

  // YMCA
  if (tapeMeasurements?.waist) {
    methods.push('YMCA Measuring Tape Method')
  }

  // Modified YMCA
  if (tapeMeasurements?.waist && tapeMeasurements?.neck) {
    if (gender === 'male' || tapeMeasurements?.hip) {
      methods.push('Modified YMCA Measuring Tape Method')
    }
  }

  // Heritage BMI
  if (bmi) {
    methods.push('Heritage BMI to Body Fat Method')
  }

  // Reversed Cunningham
  if (bmr) {
    methods.push('Reversed Cunningham equation')
  }

  return methods
}
