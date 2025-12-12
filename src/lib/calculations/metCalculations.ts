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
 * @returns Antal kalorier förbrända
 */
export function calculateCaloriesBurned(
  met: number,
  weightKg: number,
  durationMinutes: number
): number {
  const durationHours = durationMinutes / 60;
  return met * weightKg * durationHours;
}

/**
 * Beräkna hur lång tid som krävs för att förbränna ett visst antal kalorier
 *
 * @param targetCalories - Målet av kalorier att förbränna
 * @param met - MET värde för aktiviteten
 * @param weightKg - Kroppsvikt i kg
 * @returns Tid i minuter
 */
export function calculateTimeRequired(
  targetCalories: number,
  met: number,
  weightKg: number
): number {
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
 * @returns Genomsnittlig MET viktad efter tid
 */
export function calculateAverageMET(
  activities: Array<{ met: number; durationMinutes: number }>
): number {
  const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
  const weightedSum = activities.reduce((sum, a) => sum + a.met * a.durationMinutes, 0);

  return weightedSum / totalMinutes;
}

/**
 * Konvertera MET till intensitetsnivå
 */
export function getIntensityLevel(met: number): {
  level: 'sedentary' | 'light' | 'moderate' | 'vigorous' | 'very vigorous';
  label: string;
  color: string;
} {
  if (met < 1.6) {
    return { level: 'sedentary', label: 'Sittande', color: 'bg-gray-100 text-gray-700' };
  } else if (met < 3.0) {
    return { level: 'light', label: 'Lätt', color: 'bg-blue-100 text-blue-700' };
  } else if (met < 6.0) {
    return { level: 'moderate', label: 'Måttlig', color: 'bg-green-100 text-green-700' };
  } else if (met < 9.0) {
    return { level: 'vigorous', label: 'Hård', color: 'bg-orange-100 text-orange-700' };
  } else {
    return { level: 'very vigorous', label: 'Mycket hård', color: 'bg-red-100 text-red-700' };
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
