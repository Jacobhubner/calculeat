/**
 * Beräkningar för målvikt och kroppsfett mål
 */

export interface GoalCalculationResult {
  currentLeanMass?: number // kg - valfri
  currentFatMass?: number // kg - valfri
  targetWeight: number // kg
  weightToChange: number // kg (negativt = förlora, positivt = öka)
  fatToChange?: number // kg - valfri
  leanMassToGain?: number // kg (om bulk/recomp) - valfri
}

export interface TimelineEstimate {
  weeksRequired: number
  monthsRequired: number
  estimatedEndDate: Date
  weeklyWeightChange: number // kg per vecka
}

/**
 * Beräkna målvikt baserat på nuvarande vikt och önskat kroppsfett %
 *
 * @param currentWeight - Nuvarande vikt i kg
 * @param currentBodyFat - Nuvarande kroppsfett i %
 * @param targetBodyFat - Önskat kroppsfett i %
 * @param maintainLeanMass - Om true, bibehåll fettfri massa (cutting). Om false, tillåt ökning (recomp)
 * @returns Målberäkning
 */
export function calculateGoal(
  currentWeight: number,
  currentBodyFat: number,
  targetBodyFat: number,
  maintainLeanMass: boolean = true
): GoalCalculationResult {
  // Beräkna nuvarande kroppssammansättning
  const currentFatMass = currentWeight * (currentBodyFat / 100)
  const currentLeanMass = currentWeight - currentFatMass

  // Beräkna målvikt
  // Om vi bibehåller fettfri massa: Målvikt = Fettfri massa / (1 - Mål BF%)
  const targetWeight = currentLeanMass / (1 - targetBodyFat / 100)

  // Beräkna förändringar
  const weightToChange = targetWeight - currentWeight
  const targetFatMass = targetWeight * (targetBodyFat / 100)
  const fatToChange = targetFatMass - currentFatMass

  return {
    currentLeanMass,
    currentFatMass,
    targetWeight,
    weightToChange,
    fatToChange,
    leanMassToGain: maintainLeanMass ? 0 : undefined,
  }
}

/**
 * Beräkna mål kroppsfett% baserat på målvikt
 * (Omvänd beräkning - från vikt till BF%)
 *
 * @param currentWeight - Nuvarande vikt i kg
 * @param currentBodyFat - Nuvarande kroppsfett i %
 * @param targetWeight - Målvikt i kg
 * @returns Beräknat mål kroppsfett%
 */
export function calculateTargetBodyFatFromWeight(
  currentWeight: number,
  currentBodyFat: number,
  targetWeight: number
): number {
  // Beräkna nuvarande fettfri massa
  const currentFatMass = currentWeight * (currentBodyFat / 100)
  const currentLeanMass = currentWeight - currentFatMass

  // Anta att fettfri massa bevaras
  // Målvikt = Fettfri massa / (1 - Mål BF%)
  // Omvandla: Mål BF% = 1 - (Fettfri massa / Målvikt)
  const targetBodyFat = (1 - currentLeanMass / targetWeight) * 100

  // Begränsa till rimliga värden (5-50%)
  return Math.max(5, Math.min(50, targetBodyFat))
}

/**
 * Beräkna tidslinje för att nå mål
 *
 * @param weightToChange - Viktförändring i kg (negativt = förlora)
 * @param weeklyDeficit - Veckovis kaloriunderskott
 * @returns Tidsuppskattning
 */
export function calculateTimeline(weightToChange: number, weeklyDeficit: number): TimelineEstimate {
  // 1 kg kroppsfett ≈ 7700 kcal
  const kcalPerKg = 7700

  // Beräkna veckovis viktförändring baserat på deficit
  const weeklyWeightChange = weeklyDeficit / kcalPerKg

  // Beräkna veckor som krävs
  const weeksRequired = Math.abs(weightToChange / weeklyWeightChange)
  const monthsRequired = weeksRequired / 4.33 // Genomsnittligt antal veckor per månad

  // Beräkna slutdatum
  const today = new Date()
  const estimatedEndDate = new Date(today.getTime() + weeksRequired * 7 * 24 * 60 * 60 * 1000)

  return {
    weeksRequired: Math.round(weeksRequired),
    monthsRequired: Number(monthsRequired.toFixed(1)),
    estimatedEndDate,
    weeklyWeightChange,
  }
}

/**
 * Beräkna rekommenderad veckovis viktförändring baserat på kroppsfett
 *
 * @param currentBodyFat - Nuvarande kroppsfett i %
 * @param goal - 'loss' eller 'gain'
 * @returns Rekommenderad kg per vecka
 */
export function getRecommendedWeeklyChange(
  currentBodyFat: number,
  goal: 'loss' | 'gain'
): { min: number; max: number; recommended: number } {
  if (goal === 'loss') {
    // Högre kroppsfett = snabbare förlust möjlig
    if (currentBodyFat > 25) {
      return { min: 0.5, max: 1.0, recommended: 0.75 }
    } else if (currentBodyFat > 15) {
      return { min: 0.3, max: 0.7, recommended: 0.5 }
    } else {
      return { min: 0.2, max: 0.5, recommended: 0.3 }
    }
  } else {
    // Gain: Långsammare ökning för att minimera fettuppbyggnad
    return { min: 0.2, max: 0.5, recommended: 0.3 }
  }
}

/**
 * Beräkna kaloriunderskott/överskott för önskad viktförändring
 *
 * @param weeklyWeightChange - Önskad kg per vecka (negativt = förlora)
 * @returns Dagligt kaloriunderskott/överskott
 */
export function calculateDailyCalorieAdjustment(weeklyWeightChange: number): number {
  const kcalPerKg = 7700
  const weeklyCalorieAdjustment = weeklyWeightChange * kcalPerKg
  return weeklyCalorieAdjustment / 7
}

/**
 * Kategorisera kroppsfett % per kön
 *
 * @param bodyFat - Kroppsfett i %
 * @param gender - 'male' eller 'female'
 * @returns Kategori
 */
export function getBodyFatCategory(
  bodyFat: number,
  gender: 'male' | 'female'
): {
  category: string
  description: string
  color: string
} {
  if (gender === 'male') {
    if (bodyFat < 6) {
      return {
        category: 'Essential Fat',
        description: 'Väsentligt fett - Hälsorisk',
        color: 'text-red-600',
      }
    } else if (bodyFat < 14) {
      return {
        category: 'Athletes',
        description: 'Atleter - Mycket låg kroppsfett',
        color: 'text-green-600',
      }
    } else if (bodyFat < 18) {
      return {
        category: 'Fitness',
        description: 'Fitness - Låg kroppsfett',
        color: 'text-blue-600',
      }
    } else if (bodyFat < 25) {
      return {
        category: 'Average',
        description: 'Genomsnitt - Acceptabel',
        color: 'text-yellow-600',
      }
    } else {
      return {
        category: 'Obese',
        description: 'Övervikt - Hälsorisk',
        color: 'text-orange-600',
      }
    }
  } else {
    // Female
    if (bodyFat < 14) {
      return {
        category: 'Essential Fat',
        description: 'Väsentligt fett - Hälsorisk',
        color: 'text-red-600',
      }
    } else if (bodyFat < 21) {
      return {
        category: 'Athletes',
        description: 'Atleter - Mycket låg kroppsfett',
        color: 'text-green-600',
      }
    } else if (bodyFat < 25) {
      return {
        category: 'Fitness',
        description: 'Fitness - Låg kroppsfett',
        color: 'text-blue-600',
      }
    } else if (bodyFat < 32) {
      return {
        category: 'Average',
        description: 'Genomsnitt - Acceptabel',
        color: 'text-yellow-600',
      }
    } else {
      return {
        category: 'Obese',
        description: 'Övervikt - Hälsorisk',
        color: 'text-orange-600',
      }
    }
  }
}

/**
 * Beräkna makron för målkalorier
 *
 * @param targetCalories - Målkalorier per dag
 * @param leanBodyMass - Fettfri massa i kg
 * @param goal - 'loss' eller 'gain'
 * @returns Makrofördelning
 */
export function calculateMacrosForGoal(
  targetCalories: number,
  leanBodyMass: number,
  goal: 'loss' | 'gain'
): {
  protein: { grams: number; calories: number; percentage: number }
  fat: { grams: number; calories: number; percentage: number }
  carbs: { grams: number; calories: number; percentage: number }
} {
  // Protein: 2.0-2.5 g/kg fettfri massa för cutting, 1.8-2.2 för bulk
  const proteinPerKg = goal === 'loss' ? 2.2 : 2.0
  const proteinGrams = leanBodyMass * proteinPerKg
  const proteinCalories = proteinGrams * 4

  // Fett: 25-30% av totala kalorier
  const fatPercentage = 0.275
  const fatCalories = targetCalories * fatPercentage
  const fatGrams = fatCalories / 9

  // Kolhydrater: Resten
  const carbsCalories = targetCalories - proteinCalories - fatCalories
  const carbsGrams = carbsCalories / 4

  return {
    protein: {
      grams: Math.round(proteinGrams),
      calories: Math.round(proteinCalories),
      percentage: Math.round((proteinCalories / targetCalories) * 100),
    },
    fat: {
      grams: Math.round(fatGrams),
      calories: Math.round(fatCalories),
      percentage: Math.round((fatCalories / targetCalories) * 100),
    },
    carbs: {
      grams: Math.round(carbsGrams),
      calories: Math.round(carbsCalories),
      percentage: Math.round((carbsCalories / targetCalories) * 100),
    },
  }
}
