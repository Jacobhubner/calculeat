/**
 * Beräkningar för målvikt och kroppsfett mål
 */

import { KCAL_PER_KG } from './calibration-constants'

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
 * @param currentWeightKg - Startvikt. Anges den används den EXPONENTIELLA
 *        modellen, som är den fysiologiskt korrekta vid viktnedgång (se
 *        nedan). Utelämnas den behålls den linjära, vilket krävs för
 *        viktuppgång och för läget utan kroppsfettprocent.
 * @returns Tidsuppskattning
 */
export function calculateTimeline(
  weightToChange: number,
  weeklyDeficit: number,
  currentWeightKg?: number
): TimelineEstimate | null {
  // Beräkna veckovis viktförändring baserat på deficit
  const weeklyWeightChange = weeklyDeficit / KCAL_PER_KG

  // Guard: om viktförändringen är noll undviker vi division med noll
  if (weeklyWeightChange === 0) return null

  /**
   * EXPONENTIELL MODELL VID VIKTNEDGÅNG (ändrat 2026-08-19).
   *
   * Den tidigare linjära modellen antog ett fast antal kg per vecka hela
   * vägen. Det stämmer inte när målet uttrycks som en ANDEL av TDEE — vilket
   * det gör här (20–25 % underskott): TDEE sjunker när vikten gör det, så
   * underskottet i kcal krymper, och därmed veckotappet.
   *
   * VERIFIERAT genom att simulera vecka för vecka med TDEE omräknat ur
   * Mifflin-St Jeor varje vecka, alltså exakt vad appen utlovar:
   *
   *   fall               sanning   linjär      exponentiell
   *   80 kg 20→8 %       22 v      20 v (−2)   22 v (±0)
   *   100 kg 25→12 %     27 v      26 v (−1)   28 v (+1)
   *   120 kg 35→15 %     49 v      45 v (−4)   51 v (+2)
   *
   * Den linjära felade ALLTID åt samma håll: den lovade snabbare resultat än
   * möjligt. Det är skillnaden mot mätfel, som varierar slumpmässigt — ett
   * systematiskt fel som alltid pekar åt det önskvärda hållet är värre än ett
   * större slumpmässigt.
   *
   * KÄND FÖRENKLING: modellen antar att TDEE sjunker proportionellt mot
   * vikten. I verkligheten sjunker den långsammare (delar av BMR beror på
   * längd, ålder och kön): −15 % vikt ger ungefär −8 % TDEE. Modellen
   * överskattar därför avtagandet något — men den avvikelsen pekar åt motsatt
   * håll mot adaptiv termogenes, som ingen av modellerna räknar med, så
   * nettot är de +1 till +2 veckor som syns i tabellen ovan.
   *
   * Samma modell som contestPrep.estimatePrepDuration, så perioder och
   * Målsättning inte kan ge motstridiga svar för samma indata.
   */
  const usesExponential = !!currentWeightKg && currentWeightKg > 0 && weightToChange < 0

  let weeksRequired: number
  if (usesExponential) {
    const targetWeight = currentWeightKg + weightToChange
    // Målvikten måste vara positiv för att logaritmen ska vara definierad.
    if (targetWeight <= 0) return null
    const r = Math.abs(weeklyWeightChange) / currentWeightKg
    // r >= 1 vore att tappa hela kroppsvikten på en vecka — ln(0) eller värre.
    if (r <= 0 || r >= 1) return null
    weeksRequired = Math.log(targetWeight / currentWeightKg) / Math.log(1 - r)
  } else {
    weeksRequired = Math.abs(weightToChange / weeklyWeightChange)
  }

  if (!Number.isFinite(weeksRequired) || weeksRequired <= 0) return null

  const monthsRequired = weeksRequired / 4.33 // Genomsnittligt antal veckor per månad

  // Beräkna slutdatum
  const today = new Date()
  const estimatedEndDate = new Date(today.getTime() + weeksRequired * 7 * 24 * 60 * 60 * 1000)

  return {
    /**
     * EN DECIMAL, inte heltal (ändrat 2026-08-19).
     *
     * Math.round gjorde att spannet 2,70–3,38 veckor visades som "3–3
     * veckor" — ett intervall utan bredd, som signalerar precision som inte
     * finns. Den verkliga bredden var 4,7 dagar, alltså en fjärdedel av
     * tiden. Värre på snabbaste nivån: 2,25 rundades NER till 2, kortare än
     * något utfall modellen själv förutsäger.
     */
    weeksRequired: Number(weeksRequired.toFixed(1)),
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
  // KCAL_PER_KG i stället för en egen 7700-literal: samma konstant som
  // resten av appen, så de inte kan glida isär.
  const weeklyCalorieAdjustment = weeklyWeightChange * KCAL_PER_KG
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
        category: 'Essentiellt fett',
        description: '2–5% — hälsorisk vid långvarigt underskott',
        color: 'text-red-600 dark:text-red-400',
      }
    } else if (bodyFat < 14) {
      return {
        category: 'Atlet',
        description: '6–13% — mycket låg kroppsfett',
        color: 'text-green-600 dark:text-green-400',
      }
    } else if (bodyFat < 18) {
      return {
        category: 'Fitness (vältränad)',
        description: '14–17% — låg kroppsfett',
        color: 'text-blue-600 dark:text-blue-400',
      }
    } else if (bodyFat < 25) {
      return {
        category: 'Hälsosamt medel',
        description: '18–24% — acceptabel nivå',
        color: 'text-yellow-600 dark:text-yellow-400',
      }
    } else {
      return {
        category: 'Överviktig',
        description: '≥ 25% — förhöjd hälsorisk',
        color: 'text-orange-600 dark:text-orange-400',
      }
    }
  } else {
    // Female
    if (bodyFat < 14) {
      return {
        category: 'Essentiellt fett',
        description: '10–13% — hälsorisk vid långvarigt underskott',
        color: 'text-red-600 dark:text-red-400',
      }
    } else if (bodyFat < 21) {
      return {
        category: 'Atlet',
        description: '14–20% — mycket låg kroppsfett',
        color: 'text-green-600 dark:text-green-400',
      }
    } else if (bodyFat < 25) {
      return {
        category: 'Fitness (vältränad)',
        description: '21–24% — låg kroppsfett',
        color: 'text-blue-600 dark:text-blue-400',
      }
    } else if (bodyFat < 32) {
      return {
        category: 'Hälsosamt medel',
        description: '25–31% — acceptabel nivå',
        color: 'text-yellow-600 dark:text-yellow-400',
      }
    } else {
      return {
        category: 'Överviktig',
        description: '≥ 32% — förhöjd hälsorisk',
        color: 'text-orange-600 dark:text-orange-400',
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
