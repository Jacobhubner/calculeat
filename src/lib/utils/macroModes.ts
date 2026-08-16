/**
 * Predefined Macro Modes (Kostlägen)
 * NNR, Weight Loss, Active, Off-Season, On-Season
 *
 * Evidensbas per läge dokumenteras vid respektive funktion och visas
 * för användaren via referensknapparna i MacroModesCard.
 */

import type { CalorieGoal, DeficitLevel } from '@/lib/types'

export type MacroModeId = 'nnr' | 'weightloss' | 'active' | 'offseason' | 'onseason'

export interface MacroMode {
  calorieGoal: CalorieGoal
  deficitLevel?: DeficitLevel
  fatMinPercent: number
  fatMaxPercent: number
  carbMinPercent: number
  carbMaxPercent: number
  proteinMinPercent: number
  proteinMaxPercent: number
  // Calorie range multipliers (applied to TDEE to get CalorieMin/Max)
  calorieMinMultiplier: number
  calorieMaxMultiplier: number
}

/**
 * NNR Mode (Nordic Nutrition Recommendations)
 * Maintains weight with balanced macros
 */
export function nnrMode(_avgCalories: number): MacroMode {
  // NNR: Fixed percentages
  return {
    calorieGoal: 'Maintain weight',
    fatMinPercent: 25,
    fatMaxPercent: 40,
    proteinMinPercent: 10,
    proteinMaxPercent: 20,
    carbMinPercent: 45,
    carbMaxPercent: 60,
    calorieMinMultiplier: 0.97, // TDEE * 0.97 (±3%)
    calorieMaxMultiplier: 1.03, // TDEE * 1.03 (±3%)
  }
}

/**
 * Weight Loss Mode (allmän viktminskning)
 * Måttligt underskott med förhöjt protein för mättnad och bevarad
 * muskelmassa — för allmänheten, inte tävlingsförberedelse.
 *
 * Evidens (attribution verifierad mot fulltext 2026-07-18):
 * - Protein 1,2–1,6 g/kg vid energiunderskott: Leidy et al., Am J Clin Nutr 2015
 *   (doi: 10.3945/ajcn.114.084038) — exakt deras intervall; Wycherleys HP-arm
 *   (1,25 ± 0,17 g/kg) stödjer nedre delen (doi: 10.3945/ajcn.112.044321)
 * - Fett 20–30 E%: Wycherleys interventioner var per design low-fat
 *   (prescriberat ≤30 %, achieved 22–33 %); AMDR:s nedre halva
 * - Underskott 20–25 %: Wycherleys inkluderade studier använde ~500–1000
 *   kcal/dag (oftast 500 kcal ≈ 2092 kJ), i linje med riktlinjen 500–750
 *   kcal/dag. För en typisk användare (TDEE 2000–2500) ligger 20–25 % (~450–625
 *   kcal) i det spannet.
 */
export function weightLossMode(
  weight: number,
  caloriesMin: number,
  caloriesMax: number
): MacroMode {
  // FAT: 20–30 % av kalorier — Wycherley-interventionerna var low-fat
  // (prescriberat ≤30 %, achieved 22–33 %); AMDR:s nedre halva
  const fatMinKcal = caloriesMin * 0.2
  const fatMaxKcal = caloriesMax * 0.3

  // PROTEIN: 1,2–1,6 g per kg kroppsvikt
  const proteinMinGrams = weight * 1.2
  const proteinMaxGrams = weight * 1.6
  const proteinMinKcal = proteinMinGrams * 4
  const proteinMaxKcal = proteinMaxGrams * 4

  const fatMinPercent = (fatMinKcal / caloriesMin) * 100
  const fatMaxPercent = (fatMaxKcal / caloriesMax) * 100
  const proteinMinPercent = (proteinMinKcal / caloriesMin) * 100
  const proteinMaxPercent = (proteinMaxKcal / caloriesMax) * 100

  // CARBS: resterande så att summan blir exakt 100 %
  const carbMinPercent = 100 - (fatMaxPercent + proteinMaxPercent)
  const carbMaxPercent = 100 - (fatMinPercent + proteinMinPercent)

  return {
    calorieGoal: 'Weight loss',
    deficitLevel: '20-25%',
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    calorieMinMultiplier: 0.75, // TDEE * 0.75 (25 % underskott)
    calorieMaxMultiplier: 0.8, // TDEE * 0.8 (20 % underskott)
  }
}

/**
 * Active Mode (aktiv/underhåll)
 * Underhållskalorier med träningsanpassat protein — för den som
 * styrketränar regelbundet utan bulk-/cut-ambitioner.
 *
 * Evidens (attribution verifierad mot fulltext 2026-07-18):
 * - Protein 1,6–2,0 g/kg: Mortons brytpunkt är 1,62 g/kg (95 % KI 1,03–2,20) —
 *   intag DÄRUTÖVER gav ingen ytterligare FFM-vinst; 2,0 är ISSN:s övre gräns
 *   för muskeluppbyggnad/underhåll (1,4–2,0 g/kg). Morton et al., Br J Sports
 *   Med 2018 (doi: 10.1136/bjsports-2017-097608); Jäger et al., J Int Soc
 *   Sports Nutr 2017 (doi: 10.1186/s12970-017-0177-8)
 * - Fett 20–35 E%: AMDR — tillskrivs inte proteinstudierna
 */
export function activeMode(weight: number, caloriesMin: number, caloriesMax: number): MacroMode {
  // FAT: 20–35 % av kalorier (AMDR)
  const fatMinKcal = caloriesMin * 0.2
  const fatMaxKcal = caloriesMax * 0.35

  // PROTEIN: 1,6–2,0 g per kg kroppsvikt (Morton-brytpunkt → ISSN-tak)
  const proteinMinGrams = weight * 1.6
  const proteinMaxGrams = weight * 2.0
  const proteinMinKcal = proteinMinGrams * 4
  const proteinMaxKcal = proteinMaxGrams * 4

  const fatMinPercent = (fatMinKcal / caloriesMin) * 100
  const fatMaxPercent = (fatMaxKcal / caloriesMax) * 100
  const proteinMinPercent = (proteinMinKcal / caloriesMin) * 100
  const proteinMaxPercent = (proteinMaxKcal / caloriesMax) * 100

  // CARBS: resterande så att summan blir exakt 100 %
  const carbMinPercent = 100 - (fatMaxPercent + proteinMaxPercent)
  const carbMaxPercent = 100 - (fatMinPercent + proteinMinPercent)

  return {
    calorieGoal: 'Maintain weight',
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    calorieMinMultiplier: 0.97, // TDEE ±3 % (underhåll)
    calorieMaxMultiplier: 1.03,
  }
}

/**
 * Off-Season Mode (Bodybuilding bulk)
 * Weight gain with high protein
 */
export function offSeasonMode(weight: number, caloriesMin: number, caloriesMax: number): MacroMode {
  // FAT: 0.5-1.5 g per kg body weight
  const fatMinGrams = weight * 0.5
  const fatMaxGrams = weight * 1.5

  // PROTEIN: 1.6-2.2 g per kg body weight
  const proteinMinGrams = weight * 1.6
  const proteinMaxGrams = weight * 2.2

  // Convert grams to kcal
  const fatMinKcal = fatMinGrams * 9
  const fatMaxKcal = fatMaxGrams * 9
  const proteinMinKcal = proteinMinGrams * 4
  const proteinMaxKcal = proteinMaxGrams * 4

  // Convert to percentages (NO ROUNDING - keep exact decimals for precision)
  const fatMinPercent = (fatMinKcal / caloriesMin) * 100
  const fatMaxPercent = (fatMaxKcal / caloriesMax) * 100
  const proteinMinPercent = (proteinMinKcal / caloriesMin) * 100
  const proteinMaxPercent = (proteinMaxKcal / caloriesMax) * 100

  // CARBS: Calculate as remainder to ensure total = 100%
  // This ensures fat% + protein% + carb% = 100% exactly
  const carbMinPercent = 100 - (fatMaxPercent + proteinMaxPercent)
  const carbMaxPercent = 100 - (fatMinPercent + proteinMinPercent)

  return {
    calorieGoal: 'Weight gain',
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    calorieMinMultiplier: 1.1, // TDEE * 1.1
    calorieMaxMultiplier: 1.2, // TDEE * 1.2
  }
}

/**
 * On-Season Mode (Bodybuilding cut)
 * Weight loss with very high protein to preserve muscle
 */
export function onSeasonMode(
  fatFreeMass: number,
  caloriesMin: number,
  caloriesMax: number
): MacroMode {
  // FAT: Always percentage of calories (fixed 15-30%)
  // Fat-min = 15% of caloriesMin
  // Fat-max = 30% of caloriesMax
  const fatMinKcal = caloriesMin * 0.15
  const fatMaxKcal = caloriesMax * 0.3

  // PROTEIN: Based on FFM (grams)
  const proteinMinGrams = fatFreeMass * 2.3
  const proteinMaxGrams = fatFreeMass * 3.1

  // Convert protein grams to kcal
  const proteinMinKcal = proteinMinGrams * 4
  const proteinMaxKcal = proteinMaxGrams * 4

  // Convert to percentages (NO ROUNDING - keep exact decimals for precision)
  const fatMinPercent = (fatMinKcal / caloriesMin) * 100
  const fatMaxPercent = (fatMaxKcal / caloriesMax) * 100
  const proteinMinPercent = (proteinMinKcal / caloriesMin) * 100
  const proteinMaxPercent = (proteinMaxKcal / caloriesMax) * 100

  // CARBS: Calculate as remainder to ensure total = 100%
  // This ensures fat% + protein% + carb% = 100% exactly
  const carbMinPercent = 100 - (fatMaxPercent + proteinMaxPercent)
  const carbMaxPercent = 100 - (fatMinPercent + proteinMinPercent)

  return {
    calorieGoal: 'Weight loss',
    deficitLevel: '20-25%', // On-season: 20-25% deficit (TDEE * 0.75-0.8)
    fatMinPercent,
    fatMaxPercent,
    proteinMinPercent,
    proteinMaxPercent,
    carbMinPercent,
    carbMaxPercent,
    calorieMinMultiplier: 0.75, // TDEE * 0.75 (25% deficit)
    calorieMaxMultiplier: 0.8, // TDEE * 0.8 (20% deficit)
  }
}

/**
 * Apply a macro mode to user profile
 */
/**
 * Gratis kostlägen. ALLA fem sedan 2026-08-15 — premium flyttades till
 * `diet_phase_planning` (fasplanering över tid), se docs/PREMIUM_SPEC.md.
 *
 * Konstanten behålls eftersom `isLocked` och `freeMacrosForGoal` läser den,
 * och för att gränsen ska gå att flytta tillbaka på ett ställe om beslutet
 * omprövas.
 */
export const FREE_MACRO_MODES: MacroModeId[] = [
  'nnr',
  'weightloss',
  'active',
  'offseason',
  'onseason',
]

// Standardläge för ett kalorimål — används vid onboarding/TDEE-beräkning för
// att sätta en makrofördelning som matchar målet direkt (annars matchar inget
// kostläge och makrofördelningen blir odefinierad).
export function macroModeForGoal(goal?: string | null): MacroModeId {
  if (goal === 'Weight loss') return 'weightloss'
  if (goal === 'Weight gain') return 'offseason'
  return 'nnr' // Maintain weight (och ingen/okänt mål)
}

// Makrofördelning för målets standardläge — MEN endast om det läget är gratis.
//
// Sedan alla kostlägen blev fria (2026-08-15) returnerar denna aldrig null i
// praktiken. Tidigare mappade viktuppgång till offseason (premium) och gav
// null, vilket lämnade onboarding UTAN makrofördelning för den som ville gå
// upp i vikt. Den skaven är därmed borta.
// Gate-kontrollen behålls så att funktionen fortsätter vara korrekt om
// gränsen någon gång flyttas tillbaka.
export function freeMacrosForGoal(
  goal: string | null | undefined,
  params: { weight: number; caloriesMin: number; caloriesMax: number }
): MacroMode | null {
  const mode = macroModeForGoal(goal)
  if (!FREE_MACRO_MODES.includes(mode)) return null
  return applyMacroMode(mode, params)
}

/**
 * Som applyMacroMode, men returnerar null i stället för att kasta när ett
 * läge saknar sina förutsättningar (onseason kräver fettfri massa).
 *
 * Används när makrofördelningen är en BIVERKNING av något annat — t.ex. när
 * en period skriver sina mål till profilen. Där ska ett saknat kroppsfett
 * betyda "sätt inga makron", inte avbryta hela operationen.
 */
export function macrosForMode(
  mode: MacroModeId,
  params: {
    weight: number
    fatFreeMass?: number
    caloriesMin: number
    caloriesMax: number
  }
): MacroMode | null {
  try {
    return applyMacroMode(mode, params)
  } catch {
    return null
  }
}

export function applyMacroMode(
  mode: MacroModeId,
  params: {
    weight: number
    fatFreeMass?: number
    caloriesMin: number
    caloriesMax: number
  }
): MacroMode {
  const avgCalories = (params.caloriesMin + params.caloriesMax) / 2

  switch (mode) {
    case 'nnr':
      return nnrMode(avgCalories)

    case 'weightloss':
      return weightLossMode(params.weight, params.caloriesMin, params.caloriesMax)

    case 'active':
      return activeMode(params.weight, params.caloriesMin, params.caloriesMax)

    case 'offseason':
      return offSeasonMode(params.weight, params.caloriesMin, params.caloriesMax)

    case 'onseason':
      if (!params.fatFreeMass) {
        throw new Error('Fat free mass (FFM) required for on-season mode')
      }
      return onSeasonMode(params.fatFreeMass, params.caloriesMin, params.caloriesMax)

    default:
      return nnrMode(avgCalories)
  }
}
