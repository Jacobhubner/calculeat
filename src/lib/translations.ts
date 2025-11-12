/**
 * Svenska översättningar för kalkylatorn
 */

export const palSystemTranslations: Record<string, string> = {
  'FAO/WHO/UNU based PAL values': 'FAO/WHO/UNU-baserade PAL-värden',
  'DAMNRIPPED PAL values': 'DAMNRIPPED PAL-värden',
  'Pro Physique PAL values': 'Pro Physique PAL-värden',
  'Fitness Stuff PAL values': 'Fitness Stuff PAL-värden',
  'Basic internet PAL values': 'Grundläggande PAL-värden',
  'Custom PAL': 'Anpassat PAL-värde',
}

export const activityLevelTranslations: Record<string, string> = {
  Sedentary: 'Stillasittande',
  'Lightly active': 'Lätt aktiv',
  'Moderately active': 'Måttligt aktiv',
  'Very active': 'Mycket aktiv',
  'Extremely active': 'Extremt aktiv',
}

export const intensityLevelTranslations: Record<string, string> = {
  None: 'Ingen',
  Light: 'Lätt',
  Moderate: 'Måttlig',
  Difficult: 'Svår',
  Intense: 'Intensiv',
}

export const deficitLevelTranslations: Record<string, string> = {
  Slow: 'Långsam (15% underskott)',
  Moderate: 'Måttlig (20-25% underskott)',
  Aggressive: 'Aggressiv (30% underskott)',
}

export const calorieGoalTranslations: Record<string, string> = {
  'Maintain weight': 'Bibehålla vikt',
  'Weight loss': 'Viktminskning',
  'Weight gain': 'Viktökning',
}

export const dailyStepsTranslations: Record<string, string> = {
  '3 000 – 4 999 steps/day': '3 000 – 4 999 steg/dag',
  '5 000 – 6 999 steps/day': '5 000 – 6 999 steg/dag',
  '7 000 – 8 999 steps/day': '7 000 – 8 999 steg/dag',
  '9 000 – 10 999 steps/day': '9 000 – 10 999 steg/dag',
  '11 000 – 12 999 steps/day': '11 000 – 12 999 steg/dag',
  '≥ 13 000 steps/day': '≥ 13 000 steg/dag',
}

// Helper funktioner för översättning
export function translatePALSystem(palSystem?: string): string {
  if (!palSystem) return ''
  return palSystemTranslations[palSystem] || palSystem
}

export function translateActivityLevel(level?: string): string {
  if (!level) return ''
  return activityLevelTranslations[level] || level
}

export function translateIntensityLevel(level?: string): string {
  if (!level) return ''
  return intensityLevelTranslations[level] || level
}

export function translateDeficitLevel(level?: string): string {
  if (!level) return ''
  return deficitLevelTranslations[level] || level
}

export function translateCalorieGoal(goal?: string): string {
  if (!goal) return ''
  return calorieGoalTranslations[goal] || goal
}

export function translateDailySteps(steps?: string): string {
  if (!steps) return ''
  return dailyStepsTranslations[steps] || steps
}

// Hjälpfunktion för att få goal-label med deficit
export function getGoalLabel(goal?: string, deficitLevel?: string): string {
  const translatedGoal = translateCalorieGoal(goal)
  if (goal === 'Weight loss' && deficitLevel) {
    const translatedDeficit = translateDeficitLevel(deficitLevel)
    return `${translatedGoal} - ${translatedDeficit}`
  }
  return translatedGoal
}

// Färgkodning för mål-typer
export function getGoalColor(goal?: string): 'neutral' | 'orange' | 'purple' | 'blue' | 'green' {
  switch (goal) {
    case 'Maintain weight':
      return 'neutral'
    case 'Weight loss':
      return 'orange'
    case 'Weight gain':
      return 'purple'
    default:
      return 'blue'
  }
}

// PAL-system beskrivningar
export const palSystemDescriptions: Record<string, string> = {
  'FAO/WHO/UNU based PAL values':
    'Detta system använder könsspecifika värden baserade på WHO:s rekommendationer',
  'DAMNRIPPED PAL values':
    'Detta system kräver både aktivitetsnivå och träningsintensitet för mer exakt beräkning',
  'Pro Physique PAL values':
    'Detta system beräknar PAL baserat på aktivitetsnivå plus träningsfrekvens × duration × intensitet',
  'Fitness Stuff PAL values':
    'Detta system tar hänsyn till träningsfrekvens, duration och dagliga steg för en detaljerad beräkning',
  'Basic internet PAL values': 'Enklaste systemet - endast en dropdown krävs',
  'Custom PAL': 'Ange ditt eget PAL-värde manuellt (1.0 - 3.0)',
}

export function getPALSystemDescription(palSystem?: string): string {
  if (!palSystem) return ''
  return palSystemDescriptions[palSystem] || ''
}
