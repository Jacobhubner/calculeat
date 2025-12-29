import type {
  ActivityLevelWizardData,
  WizardResult,
} from '@/components/tools/tdee-calculator/ActivityLevelWizard/types'

/**
 * Beräknar PAL-värde från detaljerad aktivitetsdata
 *
 * @param wizardData - Data från wizard (träning, gång, hushållsarbete, SPA)
 * @param bmr - Basal Metabolic Rate (kcal/dag)
 * @param weightKg - Kroppsvikt i kg
 * @returns Beräknat PAL-värde, TDEE och BMR
 */
export function calculatePALFromWizard(
  wizardData: ActivityLevelWizardData,
  bmr: number,
  weightKg: number
): WizardResult {
  // 1. Träningskalorier per dag (genomsnitt över veckan)
  const trainingCaloriesPerDay =
    (wizardData.training.daysPerWeek *
      wizardData.training.minutesPerSession *
      (wizardData.training.selectedActivity?.met || 1.0) *
      weightKg) /
    60 /
    7

  // 2. Gångkalorier från steg (~0.04 kcal per steg för genomsnittsperson)
  const walkingCaloriesFromSteps = wizardData.walking.stepsPerDay * 0.04

  // 3. Stående-kalorier (~50 kcal/timme mer än sittande)
  const standingCalories = wizardData.walking.hoursStandingPerDay * 50

  // 4. Hushållskalorier
  const householdCalories =
    (wizardData.household.hoursPerDay *
      60 *
      (wizardData.household.selectedHouseholdActivity?.met || 2.0) *
      weightKg) /
    60

  // 5. Total aktivitet per dag
  const totalActivityCalories =
    trainingCaloriesPerDay + walkingCaloriesFromSteps + standingCalories + householdCalories

  // 6. TDEE = BMR + (aktivitet * SPA-faktor)
  const tdee = bmr + totalActivityCalories * wizardData.spaFactor

  // 7. PAL = TDEE / BMR
  const pal = tdee / bmr

  return {
    pal: Math.round(pal * 100) / 100, // Avrunda till 2 decimaler
    tdee: Math.round(tdee),
    bmr: Math.round(bmr),
  }
}

/**
 * Validerar wizard-data
 */
export function validateWizardData(data: ActivityLevelWizardData): string | null {
  // Steg 1 - Träning
  if (data.training.daysPerWeek < 0 || data.training.daysPerWeek > 7) {
    return 'Antal träningsdagar måste vara mellan 0 och 7'
  }
  if (data.training.minutesPerSession < 0 || data.training.minutesPerSession > 300) {
    return 'Minuter per session måste vara mellan 0 och 300'
  }
  if (data.training.daysPerWeek > 0 && data.training.minutesPerSession === 0) {
    return 'Om du tränar flera dagar, ange antal minuter per tillfälle'
  }

  // Steg 2 - Gång & Stående
  if (data.walking.stepsPerDay < 0 || data.walking.stepsPerDay > 30000) {
    return 'Antal steg måste vara mellan 0 och 30000'
  }
  if (data.walking.hoursStandingPerDay < 0 || data.walking.hoursStandingPerDay > 16) {
    return 'Timmar stående måste vara mellan 0 och 16'
  }

  // Steg 3 - Hushållsarbete
  if (data.household.hoursPerDay < 0 || data.household.hoursPerDay > 12) {
    return 'Timmar hushållsarbete måste vara mellan 0 och 12'
  }

  // Steg 4 - SPA
  if (data.spaFactor < 0.8 || data.spaFactor > 1.2) {
    return 'SPA-faktor måste vara mellan 0.8 och 1.2'
  }

  return null // Allt är OK
}
