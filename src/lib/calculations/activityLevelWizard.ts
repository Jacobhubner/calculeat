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
  // NEAT komponenter (Non-Exercise Activity Thermogenesis)

  // NEAT_steps: Gångkalorier från steg (viktjusterad med MET-värde)
  const walkingMET = wizardData.walking.selectedWalkActivity?.met || 3.5 // 3.5 MET = normal gång
  const neatSteps = (wizardData.walking.stepsPerDay * (0.04 / 70) * weightKg * walkingMET) / 3.8

  // NEAT_standing: Stående-kalorier (viktjusterad formel)
  const neatStanding = 1.3 * weightKg * wizardData.walking.hoursStandingPerDay

  // NEAT_household: Hushållskalorier
  const neatHousehold =
    (wizardData.household.selectedHouseholdActivity?.met || 2.0) *
    weightKg *
    wizardData.household.hoursPerDay

  // NEAT_total: Total NEAT multiplicerat med SPA-faktor
  const neatTotal = (neatSteps + neatStanding + neatHousehold) * wizardData.spaFactor

  // EAT (Exercise Activity Thermogenesis): Träningskalorier per dag
  const eat =
    (wizardData.training.daysPerWeek / 7) *
    (wizardData.training.minutesPerSession / 60) *
    (wizardData.training.selectedActivity?.met || 1.0) *
    weightKg

  // TDEE beräkning med TEF (Thermic Effect of Food = 10% av TDEE)
  // TDEE = BMR + NEAT_total + EAT + TEF
  // TEF = 0.1 × TDEE
  // Substituera och lös algebraiskt:
  // TDEE = BMR + NEAT_total + EAT + 0.1×TDEE
  // 0.9×TDEE = BMR + NEAT_total + EAT
  // TDEE = (BMR + NEAT_total + EAT) / 0.9
  const tdee = (bmr + neatTotal + eat) / 0.9

  // PAL = TDEE / BMR
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
  if (data.household.hoursPerDay < 0 || data.household.hoursPerDay > 16) {
    return 'Timmar hushållsarbete måste vara mellan 0 och 16'
  }

  // Steg 4 - SPA
  if (data.spaFactor < 1.05 || data.spaFactor > 1.2) {
    return 'SPA-faktor måste vara mellan 1.05 och 1.20'
  }

  return null // Allt är OK
}
