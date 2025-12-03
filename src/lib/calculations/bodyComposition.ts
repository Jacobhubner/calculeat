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

export type MethodVariation =
  | 'S, S², ålder'
  | 'S, S², C'
  | 'S, S², ålder, C'
  | 'Kläder på'
  | 'S, S²'

export interface CaliperMeasurements {
  chest?: number // mm - B53 Bröst (pectoral)
  abdominal?: number // mm - B55 Midja (abdominal)
  thigh?: number // mm - B57 Lår (thigh)
  tricep?: number // mm - B59 Triceps
  subscapular?: number // mm - B61 Subscapular
  suprailiac?: number // mm - B63 Suprailiac
  midaxillary?: number // mm - B65 Midaxillary
  bicep?: number // mm - B67 Biceps
  lowerBack?: number // mm - B69 Nedre rygg (lower back)
  calf?: number // mm - B71 Vad (calf)
}

export interface TapeMeasurements {
  neck?: number // cm - C53 Hals (neck)
  waist?: number // cm - C55 Midja (waist)
  hip?: number // cm - C57 Höft (hip)
  wrist?: number // cm - C61 Handled (wrist)
  forearm?: number // cm - C59 Underarm (forearm)
  thighCirc?: number // cm - C63 Lår omkrets (thigh circumference)
  calfCirc?: number // cm - C65 Vad omkrets (calf circumference)
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
 * Sites: pectoral(chest), abdominal, thigh
 * Google Sheets variations:
 * 1. "S, S², ålder": 1.10938 - 0.0008267×sum + 0.0000016×sum² - 0.0002574×age
 * 2. "S, S², ålder, C": 1.099075 - 0.0008209×sum + 0.0000026×sum² - 0.0002017×age - 0.005675×(waist_m) + 0.018586×(forearm_m)
 * 3. "Kläder på": 1.1125025 - 0.0013125×sum + 0.0000055×sum² - 0.000244×age (uses pectoral, triceps, subscapular)
 */
export function jacksonPollock3Male(
  params: BodyCompositionParams,
  variation: MethodVariation = 'S, S², ålder'
): number | null {
  const { age, caliperMeasurements, tapeMeasurements } = params

  if (variation === 'S, S², ålder') {
    // Standard variation: pectoral, abdominal, thigh
    if (
      !caliperMeasurements?.chest ||
      !caliperMeasurements?.abdominal ||
      !caliperMeasurements?.thigh
    ) {
      return null
    }

    const { chest, abdominal, thigh } = caliperMeasurements
    const sum = chest + abdominal + thigh
    const bodyDensity = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
    return bodyDensity
  } else if (variation === 'S, S², ålder, C') {
    // With circumference: pectoral, abdominal, thigh + waist, forearm
    if (
      !caliperMeasurements?.chest ||
      !caliperMeasurements?.abdominal ||
      !caliperMeasurements?.thigh ||
      !tapeMeasurements?.waist ||
      !tapeMeasurements?.forearm
    ) {
      return null
    }

    const { chest, abdominal, thigh } = caliperMeasurements
    const sum = chest + abdominal + thigh
    const waistM = tapeMeasurements.waist * 0.01 // cm to meters
    const forearmM = tapeMeasurements.forearm * 0.01 // cm to meters
    const bodyDensity =
      1.099075 -
      0.0008209 * sum +
      0.0000026 * sum * sum -
      0.0002017 * age -
      0.005675 * waistM +
      0.018586 * forearmM
    return bodyDensity
  } else if (variation === 'Kläder på') {
    // Clothed variation: pectoral, triceps, subscapular
    if (
      !caliperMeasurements?.chest ||
      !caliperMeasurements?.tricep ||
      !caliperMeasurements?.subscapular
    ) {
      return null
    }

    const { chest, tricep, subscapular } = caliperMeasurements
    const sum = chest + tricep + subscapular
    const bodyDensity = 1.1125025 - 0.0013125 * sum + 0.0000055 * sum * sum - 0.000244 * age
    return bodyDensity
  }

  return null
}

/**
 * 2. Jackson/Pollock 3 Caliper Method (Female)
 * Sites: triceps, suprailiac, thigh
 * Google Sheets variations:
 * 1. "S, S², ålder": 1.0994921 - 0.0009929×sum + 0.0000023×sum² - 0.0001392×age
 * 2. "S, S², C": 1.1466399 - 0.00093×sum + 0.0000028×sum² - 0.0006171×hips_m
 * 3. "S, S², ålder, C": 1.1470292 - 0.0009376×sum + 0.000003×sum² - 0.0001156×age - 0.0005839×hips_m
 * 4. "Kläder på": 1.089733 - 0.0009245×sum + 0.0000025×sum² - 0.0000979×age (uses triceps, suprailiac, abdominal)
 */
export function jacksonPollock3Female(
  params: BodyCompositionParams,
  variation: MethodVariation = 'S, S², ålder'
): number | null {
  const { age, caliperMeasurements, tapeMeasurements } = params

  if (variation === 'S, S², ålder') {
    // Standard variation: triceps, suprailiac, thigh
    if (
      !caliperMeasurements?.tricep ||
      !caliperMeasurements?.suprailiac ||
      !caliperMeasurements?.thigh
    ) {
      return null
    }

    const { tricep, suprailiac, thigh } = caliperMeasurements
    const sum = tricep + suprailiac + thigh
    const bodyDensity = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age
    return bodyDensity
  } else if (variation === 'S, S², C') {
    // With circumference (no age): triceps, suprailiac, thigh + hips
    if (
      !caliperMeasurements?.tricep ||
      !caliperMeasurements?.suprailiac ||
      !caliperMeasurements?.thigh ||
      !tapeMeasurements?.hip
    ) {
      return null
    }

    const { tricep, suprailiac, thigh } = caliperMeasurements
    const sum = tricep + suprailiac + thigh
    const hipsCm = tapeMeasurements.hip // Keep in cm as per formula
    const bodyDensity = 1.1466399 - 0.00093 * sum + 0.0000028 * sum * sum - 0.0006171 * hipsCm
    return bodyDensity
  } else if (variation === 'S, S², ålder, C') {
    // With age and circumference: triceps, suprailiac, thigh + hips
    if (
      !caliperMeasurements?.tricep ||
      !caliperMeasurements?.suprailiac ||
      !caliperMeasurements?.thigh ||
      !tapeMeasurements?.hip
    ) {
      return null
    }

    const { tricep, suprailiac, thigh } = caliperMeasurements
    const sum = tricep + suprailiac + thigh
    const hipsCm = tapeMeasurements.hip // Keep in cm as per formula
    const bodyDensity =
      1.1470292 - 0.0009376 * sum + 0.000003 * sum * sum - 0.0001156 * age - 0.0005839 * hipsCm
    return bodyDensity
  } else if (variation === 'Kläder på') {
    // Clothed variation: triceps, suprailiac, abdominal
    if (
      !caliperMeasurements?.tricep ||
      !caliperMeasurements?.suprailiac ||
      !caliperMeasurements?.abdominal
    ) {
      return null
    }

    const { tricep, suprailiac, abdominal } = caliperMeasurements
    const sum = tricep + suprailiac + abdominal
    const bodyDensity = 1.089733 - 0.0009245 * sum + 0.0000025 * sum * sum - 0.0000979 * age
    return bodyDensity
  }

  return null
}

/**
 * 3. Jackson/Pollock 4 Caliper Method
 * Sites: triceps, suprailiac, abdominal, thigh
 * Google Sheets variations:
 * 1. "S, S², ålder": 1.096095 - 0.0006952×sum + 0.0000011×sum² - 0.0000714×age (FEMALE ONLY)
 * 2. "S, S², C": 1.1443913 - 0.0006523×sum + 0.0000014×sum² - 0.0006053×hips_m (FEMALE ONLY)
 * 3. "S, S², ålder, C": 1.1454464 - 0.0006558×sum + 0.0000015×sum² - 0.0000604×age - 0.0005981×hips_m (FEMALE ONLY)
 * 4. "S, S²": Returns %BF DIRECTLY (not density!) - Available for BOTH genders:
 *    Male: 0.29288×sum - 0.0005×sum² + 0.15845×age - 5.76377
 *    Female: 0.29669×sum - 0.00043×sum² + 0.02963×age + 1.4072
 */
export function jacksonPollock4(
  params: BodyCompositionParams,
  variation: MethodVariation = 'S, S², ålder'
): number | null {
  const { age, gender, caliperMeasurements, tapeMeasurements } = params

  if (
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.suprailiac ||
    !caliperMeasurements?.abdominal ||
    !caliperMeasurements?.thigh
  ) {
    return null
  }

  const { tricep, suprailiac, abdominal, thigh } = caliperMeasurements
  const sum = tricep + suprailiac + abdominal + thigh

  // Density-based variations are FEMALE ONLY
  if (variation !== 'S, S²' && gender !== 'female') {
    return null
  }

  if (variation === 'S, S², ålder') {
    // Standard variation with age (FEMALE ONLY)
    const bodyDensity = 1.096095 - 0.0006952 * sum + 0.0000011 * sum * sum - 0.0000714 * age
    return bodyDensity
  } else if (variation === 'S, S², C') {
    // With circumference (no age) (FEMALE ONLY)
    if (!tapeMeasurements?.hip) {
      return null
    }

    const hipsCm = tapeMeasurements.hip // Keep in cm as per formula
    const bodyDensity = 1.1443913 - 0.0006523 * sum + 0.0000014 * sum * sum - 0.0006053 * hipsCm
    return bodyDensity
  } else if (variation === 'S, S², ålder, C') {
    // With age and circumference (FEMALE ONLY)
    if (!tapeMeasurements?.hip) {
      return null
    }

    const hipsCm = tapeMeasurements.hip // Keep in cm as per formula
    const bodyDensity =
      1.1454464 - 0.0006558 * sum + 0.0000015 * sum * sum - 0.0000604 * age - 0.0005981 * hipsCm
    return bodyDensity
  } else if (variation === 'S, S²') {
    // Direct formula - returns %BF DIRECTLY (not density!)
    // Available for BOTH genders
    if (gender === 'male') {
      return 0.29288 * sum - 0.0005 * sum * sum + 0.15845 * age - 5.76377
    } else {
      return 0.29669 * sum - 0.00043 * sum * sum + 0.02963 * age + 1.4072
    }
  }

  return null
}

/**
 * 4. Jackson/Pollock 7 Caliper Method
 * Sites: chest(pectoral), abdominal, thigh, triceps, subscapular, suprailiac, midaxillary
 * Google Sheets variations:
 * 1. "S, S², ålder": Male: 1.112 - 0.00043499×sum + 0.00000055×sum² - 0.00028826×age
 *                    Female: 1.097 - 0.00046971×sum + 0.00000056×sum² - 0.00012828×age
 * 2. "S, S², C" (FEMALE ONLY): 1.147 - 0.00042359×sum + 0.00000061×sum² - 0.000652×hips_cm
 * 3. "S, S², ålder, C": Male: 1.101 - 0.0004115×sum + 0.00000069×sum² - 0.00022631×age - 0.0059239×waist_m + 0.0190632×forearm_m
 *                       Female: 1.147 - 0.0004293×sum + 0.00000065×sum² - 0.00009975×age - 0.00062415×hips_cm
 */
export function jacksonPollock7(
  params: BodyCompositionParams,
  variation: MethodVariation = 'S, S², ålder'
): number | null {
  const { age, gender, caliperMeasurements, tapeMeasurements } = params

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

  if (variation === 'S, S², ålder') {
    // Standard variation with age
    let bodyDensity: number
    if (gender === 'male') {
      bodyDensity = 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age
    } else {
      bodyDensity = 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age
    }
    return bodyDensity
  } else if (variation === 'S, S², C') {
    // With circumference (FEMALE ONLY)
    if (gender !== 'female' || !tapeMeasurements?.hip) {
      return null
    }

    const hipsCm = tapeMeasurements.hip // Keep in cm as per formula
    const bodyDensity = 1.147 - 0.00042359 * sum + 0.00000061 * sum * sum - 0.000652 * hipsCm
    return bodyDensity
  } else if (variation === 'S, S², ålder, C') {
    // With age and circumference (different for male/female)
    if (gender === 'male') {
      if (!tapeMeasurements?.waist || !tapeMeasurements?.forearm) {
        return null
      }

      const waistM = tapeMeasurements.waist * 0.01 // cm to meters
      const forearmM = tapeMeasurements.forearm * 0.01 // cm to meters
      const bodyDensity =
        1.101 -
        0.0004115 * sum +
        0.00000069 * sum * sum -
        0.00022631 * age -
        0.0059239 * waistM +
        0.0190632 * forearmM
      return bodyDensity
    } else {
      if (!tapeMeasurements?.hip) {
        return null
      }

      const hipsCm = tapeMeasurements.hip // Keep in cm as per formula
      const bodyDensity =
        1.147 - 0.0004293 * sum + 0.00000065 * sum * sum - 0.00009975 * age - 0.00062415 * hipsCm
      return bodyDensity
    }
  }

  return null
}

/**
 * 5. Durnin/Womersley Caliper Method (1974)
 * Sites: bicep, tricep, subscapular, suprailiac
 * Age ranges:
 *   Male: 17-19, 20-29, 30-39, 40-49, ≥50
 *   Female: 16-19, 20-29, 30-39, 40-49, ≥50
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
    if (age < 20) {
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
    if (age < 20) {
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

  return bodyDensity
}

/**
 * 6. Parillo Caliper Method (1993)
 * Sites: pectoral(chest), abdominal, thigh, biceps, triceps, subscapular, suprailiac, lower back, calf
 * Google Sheets formula: (sum × 27) / (weight_kg × 2.2046226218488)
 */
export function parillo(params: BodyCompositionParams): number | null {
  const { caliperMeasurements, weight } = params

  if (
    !caliperMeasurements?.chest ||
    !caliperMeasurements?.abdominal ||
    !caliperMeasurements?.thigh ||
    !caliperMeasurements?.bicep ||
    !caliperMeasurements?.tricep ||
    !caliperMeasurements?.subscapular ||
    !caliperMeasurements?.suprailiac ||
    !caliperMeasurements?.lowerBack ||
    !caliperMeasurements?.calf
  ) {
    return null
  }

  const { chest, abdominal, thigh, bicep, tricep, subscapular, suprailiac, lowerBack, calf } =
    caliperMeasurements
  const sum =
    chest + abdominal + thigh + bicep + tricep + subscapular + suprailiac + lowerBack + calf

  // Parillo formula: (sum × 27) / (weight_kg × 2.2046226218488)
  const weightLbs = weight * 2.2046226218488
  return (sum * 27) / weightLbs
}

/**
 * 7. Covert Bailey Measuring Tape Method
 * Google Sheets formula (CORRECTED):
 * Male: waist(C55), hips(C57), forearm(C59), wrist(C61)
 *   - Age ≤30: waist_in + (0.5 × hips_in) - (3 × forearm_in) - wrist_in
 *   - Age >30: waist_in + (0.5 × hips_in) - (2.7 × forearm_in) - wrist_in
 * Female: hips(C57), thighCirc(C63), calfCirc(C65), wrist(C61)
 *   - Age ≤30: hips_in + (0.8 × thigh_in) - (2 × calf_in) - wrist_in
 *   - Age >30: hips_in + thigh_in - (2 × calf_in) - wrist_in
 */
export function covertBailey(params: BodyCompositionParams): number | null {
  const { age, gender, tapeMeasurements } = params

  // Convert cm to inches
  const cmToInches = (cm: number) => cm / 2.54

  if (gender === 'male') {
    // Male requires: waist, hips, forearm, wrist
    if (
      !tapeMeasurements?.waist ||
      !tapeMeasurements?.hip ||
      !tapeMeasurements?.forearm ||
      !tapeMeasurements?.wrist
    ) {
      return null
    }

    const waistIn = cmToInches(tapeMeasurements.waist)
    const hipsIn = cmToInches(tapeMeasurements.hip)
    const forearmIn = cmToInches(tapeMeasurements.forearm)
    const wristIn = cmToInches(tapeMeasurements.wrist)

    if (age <= 30) {
      return waistIn + 0.5 * hipsIn - 3 * forearmIn - wristIn
    } else {
      return waistIn + 0.5 * hipsIn - 2.7 * forearmIn - wristIn
    }
  } else {
    // Female requires: hips, thighCirc, calfCirc, wrist
    if (
      !tapeMeasurements?.hip ||
      !tapeMeasurements?.thighCirc ||
      !tapeMeasurements?.calfCirc ||
      !tapeMeasurements?.wrist
    ) {
      return null
    }

    const hipsIn = cmToInches(tapeMeasurements.hip)
    const thighIn = cmToInches(tapeMeasurements.thighCirc)
    const calfIn = cmToInches(tapeMeasurements.calfCirc)
    const wristIn = cmToInches(tapeMeasurements.wrist)

    if (age <= 30) {
      return hipsIn + 0.8 * thighIn - 2 * calfIn - wristIn
    } else {
      return hipsIn + thighIn - 2 * calfIn - wristIn
    }
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

  // Convert cm to inches
  const waistInches = waist / 2.54
  const neckInches = neck / 2.54
  const heightInches = height / 2.54

  if (gender === 'male') {
    // Male: 86.010 × log10(abdomen - neck) - 70.041 × log10(height) + 36.76
    const bodyFat =
      86.01 * Math.log10(waistInches - neckInches) - 70.041 * Math.log10(heightInches) + 36.76
    return bodyFat
  } else {
    // Female: 163.205 × log10(waist + hip - neck) - 97.684 × log10(height) - 78.387
    if (!hip) return null
    const hipInches = hip / 2.54
    const bodyFat =
      163.205 * Math.log10(waistInches + hipInches - neckInches) -
      97.684 * Math.log10(heightInches) -
      78.387
    return bodyFat
  }
}

/**
 * 9. YMCA Measuring Tape Method
 * Uses weight and waist measurement
 * Google Sheets formulas:
 * Male: ((4.15*(waist_inches) - 0.082*(weight_lbs) - 98.42) / weight_lbs) * 100
 * Female: ((4.15*(waist_inches) - 0.082*(weight_lbs) - 76.76) / weight_lbs) * 100
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
    return ((4.15 * waistInches - 0.082 * weightLbs - 98.42) / weightLbs) * 100
  } else {
    // Female YMCA formula
    return ((4.15 * waistInches - 0.082 * weightLbs - 76.76) / weightLbs) * 100
  }
}

/**
 * 10. Modified YMCA Measuring Tape Method
 * Enhanced version with additional measurements
 * Google Sheets formulas:
 * Male: ((-0.082*(weight_lbs) + 4.15*(waist_inches) - 94.42) / weight_lbs) * 100
 * Female: ((0.268*(weight_lbs) - 0.318*(hip_inches) + 0.157*(waist_inches) + 0.245*(wrist_inches) - 0.434*(forearm_inches) - 8.987) / weight_lbs) * 100
 */
export function modifiedYmca(params: BodyCompositionParams): number | null {
  const { gender, weight, tapeMeasurements } = params

  if (!tapeMeasurements?.waist) {
    return null
  }

  const { waist, wrist, forearm, hip } = tapeMeasurements
  const weightLbs = weight * 2.20462
  const waistInches = waist / 2.54

  if (gender === 'male') {
    // Modified male formula
    return ((-0.082 * weightLbs + 4.15 * waistInches - 94.42) / weightLbs) * 100
  } else {
    // Modified female formula - requires hip, wrist, and forearm
    if (!hip || !wrist || !forearm) return null
    const hipInches = hip / 2.54
    const wristInches = wrist / 2.54
    const forearmInches = forearm / 2.54

    return (
      ((0.268 * weightLbs -
        0.318 * wristInches +
        0.157 * waistInches +
        0.245 * hipInches -
        0.434 * forearmInches -
        8.987) /
        weightLbs) *
      100
    )
  }
}

/**
 * 11. Heritage BMI to Body Fat Method
 * Estimates body fat from BMI, age, and gender
 * Google Sheets formula (corrected):
 * Male: 1.39 * BMI + 0.16 * age - 19.34
 * Female: 1.39 * BMI + 0.16 * age - 9
 */
export function heritageBMI(params: BodyCompositionParams): number | null {
  const { age, gender, bmi } = params

  if (!bmi) return null

  if (gender === 'male') {
    // Male Heritage formula (CORRECTED)
    return 1.39 * bmi + 0.16 * age - 19.34
  } else {
    // Female Heritage formula (CORRECTED)
    return 1.39 * bmi + 0.16 * age - 9
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
  params: BodyCompositionParams,
  variation?: MethodVariation
): number | null {
  switch (method) {
    case 'Jackson/Pollock 3 Caliper Method (Male)':
      return jacksonPollock3Male(params, variation)

    case 'Jackson/Pollock 3 Caliper Method (Female)':
      return jacksonPollock3Female(params, variation)

    case 'Jackson/Pollock 4 Caliper Method':
      return jacksonPollock4(params, variation)

    case 'Jackson/Pollock 7 Caliper Method':
      return jacksonPollock7(params, variation)

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
 * Calculate fat free mass (FFM) from body fat percentage
 */
export function calculateFatFreeMass(weight: number, bodyFatPercentage: number): number {
  return weight * (1 - bodyFatPercentage / 100)
}

/**
 * @deprecated Use calculateFatFreeMass instead
 * Legacy alias for backwards compatibility
 */
export function calculateLeanMass(weight: number, bodyFatPercentage: number): number {
  return calculateFatFreeMass(weight, bodyFatPercentage)
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

  // Jackson/Pollock 4 (FEMALE ONLY)
  if (
    gender === 'female' &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.suprailiac &&
    caliperMeasurements?.abdominal &&
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

  // Parillo (9 sites: chest, abdominal, thigh, bicep, tricep, subscapular, suprailiac, lowerBack, calf)
  if (
    caliperMeasurements?.chest &&
    caliperMeasurements?.abdominal &&
    caliperMeasurements?.thigh &&
    caliperMeasurements?.bicep &&
    caliperMeasurements?.tricep &&
    caliperMeasurements?.subscapular &&
    caliperMeasurements?.suprailiac &&
    caliperMeasurements?.lowerBack &&
    caliperMeasurements?.calf
  ) {
    methods.push('Parillo Caliper Method')
  }

  // Covert Bailey (DIFFERENT REQUIREMENTS FOR MALE/FEMALE)
  if (gender === 'male') {
    // Male requires: waist, hips, forearm, wrist
    if (
      tapeMeasurements?.waist &&
      tapeMeasurements?.hip &&
      tapeMeasurements?.forearm &&
      tapeMeasurements?.wrist
    ) {
      methods.push('Covert Bailey Measuring Tape Method')
    }
  } else {
    // Female requires: hips, thighCirc, calfCirc, wrist
    if (
      tapeMeasurements?.hip &&
      tapeMeasurements?.thighCirc &&
      tapeMeasurements?.calfCirc &&
      tapeMeasurements?.wrist
    ) {
      methods.push('Covert Bailey Measuring Tape Method')
    }
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
  if (tapeMeasurements?.waist) {
    if (gender === 'male') {
      // Male only needs waist
      methods.push('Modified YMCA Measuring Tape Method')
    } else if (tapeMeasurements?.hip && tapeMeasurements?.wrist && tapeMeasurements?.forearm) {
      // Female needs waist, hip, wrist, and forearm
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
