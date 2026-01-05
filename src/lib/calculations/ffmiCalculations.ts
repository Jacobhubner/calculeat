/**
 * Fat Free Mass Index (FFMI) Calculations
 * Based on scientific research for assessing muscle mass relative to height
 */

import {
  FFMI_DESCRIPTION_CATEGORIES,
  FFMI_WITH_BODY_FAT_RANGES,
} from '../constants/bodyCompositionReferenceData'

/**
 * Calculate FFMI (Fat Free Mass Index)
 * Formula: FFMI = LBM (kg) / (height (m))²
 *
 * @param leanBodyMass - Lean body mass in kg
 * @param heightInMeters - Height in meters
 * @returns FFMI value
 */
export function calculateFFMI(leanBodyMass: number, heightInMeters: number): number {
  if (leanBodyMass <= 0 || heightInMeters <= 0) {
    return 0
  }
  return leanBodyMass / (heightInMeters * heightInMeters)
}

/**
 * Calculate Normalized FFMI (adjusted for height)
 * Formula: Normalized FFMI = FFMI + 6.1 × (1.8 - height)
 * This normalizes FFMI to a standard height of 180cm (1.8m)
 *
 * @param ffmi - FFMI value
 * @param heightInMeters - Height in meters
 * @returns Normalized FFMI value
 */
export function calculateNormalizedFFMI(ffmi: number, heightInMeters: number): number {
  if (ffmi <= 0 || heightInMeters <= 0) {
    return 0
  }
  return ffmi + 6.1 * (1.8 - heightInMeters)
}

/**
 * Get FFMI category based on FFMI value and gender
 * Categories: Below average, Average, Above average, Excellent, Superior, Suspicion of steroid use, Steroid usage likely
 *
 * @param ffmi - FFMI value
 * @param gender - 'male' or 'female'
 * @returns Category description
 */
export function getFFMICategory(ffmi: number, gender: string): string {
  if (ffmi <= 0) {
    return 'Unknown'
  }

  const isMale = gender === 'male'

  for (const category of FFMI_DESCRIPTION_CATEGORIES) {
    const range = isMale ? category.men : category.women

    // Handle "< X" format
    if (range.startsWith('<')) {
      const threshold = parseFloat(range.replace('<', '').trim())
      if (ffmi < threshold) {
        return category.description
      }
    }
    // Handle "> X" format
    else if (range.startsWith('>')) {
      const threshold = parseFloat(range.replace('>', '').trim())
      if (ffmi > threshold) {
        return category.description
      }
    }
    // Handle "X–Y" format
    else if (range.includes('–')) {
      const [min, max] = range.split('–').map(v => parseFloat(v.trim()))
      if (ffmi >= min && ffmi <= max) {
        return category.description
      }
    }
  }

  return 'Unknown'
}

/**
 * Get FFMI description based on combined FFMI and body fat %
 * Descriptions: Skinny, Average, Obese, Athlete, Advanced gym user, Bodybuilder/Powerlifter/Weightlifter
 *
 * @param ffmi - FFMI value
 * @param bodyFatPct - Body fat percentage
 * @param gender - 'male' or 'female'
 * @returns Description
 */
export function getFFMIDescription(ffmi: number, bodyFatPct: number, gender: string): string {
  if (ffmi <= 0 || bodyFatPct <= 0) {
    return 'Unknown'
  }

  const isMale = gender === 'male'

  for (const range of FFMI_WITH_BODY_FAT_RANGES) {
    const ffmiRange = isMale ? range.ffmiMen : range.ffmiWomen
    const bfRange = isMale ? range.bodyFatMen : range.bodyFatWomen

    // Parse FFMI range (format: "X–Y")
    const [ffmiMin, ffmiMax] = ffmiRange.split('–').map(v => parseFloat(v.trim()))

    // Parse body fat range (format: "X–Y%")
    const bfRangeCleaned = bfRange.replace('%', '')
    const [bfMin, bfMax] = bfRangeCleaned.split('–').map(v => parseFloat(v.trim()))

    // Check if both FFMI and body fat % fall within the range
    if (ffmi >= ffmiMin && ffmi <= ffmiMax && bodyFatPct >= bfMin && bodyFatPct <= bfMax) {
      return range.description
    }
  }

  return 'Unknown'
}

/**
 * Calculate maximum fat metabolism (max fat oxidation)
 * Based on Alpert SS (2005) and practical interpretations by Lyle McDonald/Tom Venuto
 *
 * Returns practical value (~31 kcal/kg/day) used in fitness/diet literature
 * This is a conservative approximation (40-45% of Alpert's 69 kcal/kg/day)
 *
 * @param leanBodyMass - Lean body mass in kg
 * @param totalWeight - Total body weight in kg
 * @param tdee - Total Daily Energy Expenditure in kcal
 * @returns Object with practical max fat oxidation value
 */
export function calculateMaxFatMetabolism(
  leanBodyMass: number,
  totalWeight: number,
  tdee: number
): {
  kcalDeficit: number
  percentOfTDEE: number
  practicalMax: number
  observedMax: number
  theoreticalMax: number
} {
  if (leanBodyMass <= 0 || totalWeight <= 0 || tdee <= 0) {
    return {
      kcalDeficit: 0,
      percentOfTDEE: 0,
      practicalMax: 0,
      observedMax: 0,
      theoreticalMax: 0,
    }
  }

  // Calculate fat mass
  const fatMass = totalWeight - leanBodyMass

  if (fatMass <= 0) {
    return {
      kcalDeficit: 0,
      percentOfTDEE: 0,
      practicalMax: 0,
      observedMax: 0,
      theoreticalMax: 0,
    }
  }

  // Energy transfer factors
  const PRACTICAL_RATE = 31 // kcal/kg/day - practical approximation (Lyle McDonald, Tom Venuto)
  const OBSERVED_RATE = 69 // kcal/kg/day (~290 kJ/kg/day) - Alpert's empirical observation
  const THEORETICAL_RATE = 86 // kcal/kg/day (~358 kJ/kg/day) - Alpert's theoretical optimum

  // Calculate all values for reference
  const practicalMax = fatMass * PRACTICAL_RATE
  const observedMax = fatMass * OBSERVED_RATE
  const theoreticalMax = fatMass * THEORETICAL_RATE

  // Calculate as percentage of TDEE (using practical value)
  const percentOfTDEE = (practicalMax / tdee) * 100

  return {
    // Primary value (practical, conservative)
    kcalDeficit: Math.round(practicalMax),
    percentOfTDEE: Math.round(percentOfTDEE),
    // Additional values for info display
    practicalMax: Math.round(practicalMax),
    observedMax: Math.round(observedMax),
    theoreticalMax: Math.round(theoreticalMax),
  }
}

/**
 * Get color class for FFMI category highlighting
 *
 * @param category - FFMI category
 * @returns Tailwind color class
 */
export function getFFMICategoryColorClass(category: string): string {
  const categoryData = FFMI_DESCRIPTION_CATEGORIES.find(c => c.description === category)
  return categoryData?.colorClass || 'bg-gray-50'
}

/**
 * Get color class for FFMI description highlighting
 *
 * @param description - FFMI description
 * @returns Tailwind color class
 */
export function getFFMIDescriptionColorClass(description: string): string {
  const descriptionData = FFMI_WITH_BODY_FAT_RANGES.find(r => r.description === description)
  return descriptionData?.colorClass || 'bg-gray-50'
}
