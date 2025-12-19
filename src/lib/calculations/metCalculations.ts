/**
 * MET (Metabolic Equivalent of Task) Beräkningar
 *
 * MET är ett mått på energiförbrukning för olika aktiviteter
 * 1 MET = energi i vila (cirka 1 kcal/kg/timme)
 *
 * Formel: Kalorier = MET × vikt (kg) × tid (timmar)
 */

export interface METCalculationResult {
  calories: number;
  met: number;
  durationMinutes: number;
  weightKg: number;
  activity: string;
}

/**
 * Beräkna kalorier förbrända för en aktivitet
 *
 * @param met - MET värde för aktiviteten
 * @param weightKg - Kroppsvikt i kg
 * @param durationMinutes - Varaktighet i minuter
 * @returns Antal kalorier förbrända, 0 if invalid inputs
 */
export function calculateCaloriesBurned(
  met: number,
  weightKg: number,
  durationMinutes: number
): number {
  // Validate inputs to prevent invalid calculations
  if (met < 0 || weightKg <= 0 || durationMinutes < 0) {
    return 0;
  }

  // MET values are typically between 0.9 (sleeping) and 23 (running very fast)
  // Warn if unrealistic but don't fail
  if (met > 25) {
    console.warn(`Unusually high MET value: ${met}`);
  }

  const durationHours = durationMinutes / 60;
  return met * weightKg * durationHours;
}

/**
 * Beräkna hur lång tid som krävs för att förbränna ett visst antal kalorier
 *
 * @param targetCalories - Målet av kalorier att förbränna
 * @param met - MET värde för aktiviteten
 * @param weightKg - Kroppsvikt i kg
 * @returns Tid i minuter, 0 if invalid inputs
 */
export function calculateTimeRequired(
  targetCalories: number,
  met: number,
  weightKg: number
): number {
  // Validate inputs to prevent division by zero or invalid calculations
  if (targetCalories <= 0 || met <= 0 || weightKg <= 0) {
    return 0;
  }

  const hoursRequired = targetCalories / (met * weightKg);
  return hoursRequired * 60;
}

/**
 * Jämför flera aktiviteter
 *
 * @param activities - Array av aktiviteter med MET värden
 * @param weightKg - Kroppsvikt i kg
 * @param durationMinutes - Varaktighet i minuter (samma för alla)
 * @returns Array av resultat sorterade efter kalorier förbrända
 */
export function compareActivities(
  activities: Array<{ activity: string; met: number }>,
  weightKg: number,
  durationMinutes: number
): METCalculationResult[] {
  return activities
    .map(activity => ({
      activity: activity.activity,
      met: activity.met,
      weightKg,
      durationMinutes,
      calories: calculateCaloriesBurned(activity.met, weightKg, durationMinutes),
    }))
    .sort((a, b) => b.calories - a.calories);
}

/**
 * Beräkna genomsnittlig MET för en serie aktiviteter
 *
 * @param activities - Array av aktiviteter med MET och varaktighet
 * @returns Genomsnittlig MET viktad efter tid, 0 if no activities or invalid data
 */
export function calculateAverageMET(
  activities: Array<{ met: number; durationMinutes: number }>
): number {
  // Validate input array
  if (!activities || activities.length === 0) {
    return 0;
  }

  const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const weightedSum = activities.reduce((sum, a) => sum + a.met * a.durationMinutes, 0);

  // Prevent division by zero
  if (totalMinutes === 0) {
    return 0;
  }

  return weightedSum / totalMinutes;
}

/**
 * Konvertera MET till intensitetsnivå
 * Uppdaterad för svenska intensitetsnivåer
 */
export function getIntensityLevel(met: number): {
  level: 'sittande' | 'lätt' | 'måttlig' | 'hög' | 'mycket hög';
  label: string;
  color: string;
} {
  if (met < 1.6) {
    return { level: 'sittande', label: 'Sittande', color: 'bg-gray-100 text-gray-700' };
  } else if (met < 3.0) {
    return { level: 'lätt', label: 'Lätt', color: 'bg-blue-100 text-blue-700' };
  } else if (met < 6.0) {
    return { level: 'måttlig', label: 'Måttlig', color: 'bg-green-100 text-green-700' };
  } else if (met < 9.0) {
    return { level: 'hög', label: 'Hög', color: 'bg-orange-100 text-orange-700' };
  } else {
    return { level: 'mycket hög', label: 'Mycket hög', color: 'bg-red-100 text-red-700' };
  }
}

/**
 * Beräkna total daglig energiförbrukning baserat på aktiviteter
 *
 * @param activities - Array av dagliga aktiviteter
 * @param weightKg - Kroppsvikt i kg
 * @param bmr - Basal metabolic rate (kalorier i vila)
 * @returns Total energiförbrukning för dagen
 */
export function calculateDailyEnergyExpenditure(
  activities: Array<{ met: number; durationMinutes: number }>,
  weightKg: number,
  bmr: number
): {
  activitiesCalories: number;
  totalCalories: number;
  pal: number; // Physical Activity Level
} {
  // Validate inputs
  if (weightKg <= 0 || bmr <= 0) {
    return {
      activitiesCalories: 0,
      totalCalories: 0,
      pal: 1.0, // Default PAL for sedentary
    };
  }

  const activitiesCalories = activities.reduce((sum, activity) => {
    return sum + calculateCaloriesBurned(activity.met, weightKg, activity.durationMinutes);
  }, 0);

  const totalCalories = bmr + activitiesCalories;
  const pal = totalCalories / bmr;

  return {
    activitiesCalories,
    totalCalories,
    pal,
  };
}
