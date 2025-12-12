/**
 * Fat Free Mass Index (FFMI) Calculations
 * Based on scientific research for assessing muscle mass relative to height
 */

import { FFMI_DESCRIPTION_CATEGORIES, FFMI_WITH_BODY_FAT_RANGES } from '../constants/bodyCompositionReferenceData';

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
    return 0;
  }
  return leanBodyMass / (heightInMeters * heightInMeters);
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
    return 0;
  }
  return ffmi + 6.1 * (1.8 - heightInMeters);
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
    return 'Unknown';
  }

  const isMale = gender === 'male';

  for (const category of FFMI_DESCRIPTION_CATEGORIES) {
    const range = isMale ? category.men : category.women;

    // Handle "< X" format
    if (range.startsWith('<')) {
      const threshold = parseFloat(range.replace('<', '').trim());
      if (ffmi < threshold) {
        return category.description;
      }
    }
    // Handle "> X" format
    else if (range.startsWith('>')) {
      const threshold = parseFloat(range.replace('>', '').trim());
      if (ffmi > threshold) {
        return category.description;
      }
    }
    // Handle "X–Y" format
    else if (range.includes('–')) {
      const [min, max] = range.split('–').map((v) => parseFloat(v.trim()));
      if (ffmi >= min && ffmi <= max) {
        return category.description;
      }
    }
  }

  return 'Unknown';
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
    return 'Unknown';
  }

  const isMale = gender === 'male';

  for (const range of FFMI_WITH_BODY_FAT_RANGES) {
    const ffmiRange = isMale ? range.ffmiMen : range.ffmiWomen;
    const bfRange = isMale ? range.bodyFatMen : range.bodyFatWomen;

    // Parse FFMI range (format: "X–Y")
    const [ffmiMin, ffmiMax] = ffmiRange.split('–').map((v) => parseFloat(v.trim()));

    // Parse body fat range (format: "X–Y%")
    const bfRangeCleaned = bfRange.replace('%', '');
    const [bfMin, bfMax] = bfRangeCleaned.split('–').map((v) => parseFloat(v.trim()));

    // Check if both FFMI and body fat % fall within the range
    if (ffmi >= ffmiMin && ffmi <= ffmiMax && bodyFatPct >= bfMin && bodyFatPct <= bfMax) {
      return range.description;
    }
  }

  return 'Unknown';
}

/**
 * Calculate maximum fat metabolism (max fat oxidation)
 * Based on research: approximately 31 kcal/kg of fat mass per day
 * Reference: Alpert SS. "A limit on the energy transfer rate from the human fat store in hypophagia"
 *
 * @param leanBodyMass - Lean body mass in kg
 * @param totalWeight - Total body weight in kg
 * @param tdee - Total Daily Energy Expenditure in kcal
 * @returns Object with kcalDeficit and percentOfTDEE
 */
export function calculateMaxFatMetabolism(
  leanBodyMass: number,
  totalWeight: number,
  tdee: number
): { kcalDeficit: number; percentOfTDEE: number } {
  if (leanBodyMass <= 0 || totalWeight <= 0 || tdee <= 0) {
    return { kcalDeficit: 0, percentOfTDEE: 0 };
  }

  // Calculate fat mass
  const fatMass = totalWeight - leanBodyMass;

  if (fatMass <= 0) {
    return { kcalDeficit: 0, percentOfTDEE: 0 };
  }

  // Max fat oxidation: approximately 31 kcal/kg of fat mass per day
  const maxFatOxidation = fatMass * 31;

  // Calculate as percentage of TDEE
  const percentOfTDEE = (maxFatOxidation / tdee) * 100;

  return {
    kcalDeficit: Math.round(maxFatOxidation),
    percentOfTDEE: Math.round(percentOfTDEE),
  };
}

/**
 * Get color class for FFMI category highlighting
 *
 * @param category - FFMI category
 * @returns Tailwind color class
 */
export function getFFMICategoryColorClass(category: string): string {
  const categoryData = FFMI_DESCRIPTION_CATEGORIES.find((c) => c.description === category);
  return categoryData?.colorClass || 'bg-gray-50';
}

/**
 * Get color class for FFMI description highlighting
 *
 * @param description - FFMI description
 * @returns Tailwind color class
 */
export function getFFMIDescriptionColorClass(description: string): string {
  const descriptionData = FFMI_WITH_BODY_FAT_RANGES.find((r) => r.description === description);
  return descriptionData?.colorClass || 'bg-gray-50';
}
