/**
 * Underskottsnivåer — hur djupt kaloriunderskottet är vid viktnedgång.
 *
 * ARBETSFÖRDELNINGEN: kostläget äger MAKROFÖRDELNINGEN (fett/kolhydrat/protein
 * och vilken bas proteinet räknas mot). Underskottsnivån äger DJUPET. De två
 * är oberoende: man kan köra Deff-lägets proteinlogik på ett försiktigt
 * underskott, eller NNR-fördelning på ett aggressivt.
 *
 * VARFÖR EN EGEN FIL: nivåerna används på tre ställen som annars inte känner
 * till varandra — profilens kaloriuträkning, periodernas kalorimål och
 * tidsräknaren i PrepDurationHelper. Låg definitionen kvar i contestPrep.ts
 * skulle en tidsräknare styra profilens kalorimål, vilket är fel hemvist.
 *
 * FAKTORERNA ÄR ANDELAR AV TDEE och måste vara identiska med hur profilen
 * räknar. Fyra ställen härleder kalorier ur calorie_goal + deficit_level:
 *   - MetabolicCalibration (vid varje tillämpad kalibrering)
 *   - ProfilePage
 *   - TDEECalculatorTool
 *   - GoalCalculatorTool
 * Glider någon isär får användaren olika mål beroende på vad som senast rörde
 * profilen. Låst med test i deficitLevels.test.ts.
 */

import type { DeficitLevel } from '@/lib/types'

export const DEFICIT_LEVELS = [
  {
    id: 'cautious',
    factorMin: 0.85,
    factorMax: 0.9,
    /** Motsvarar DeficitLevel-unionen i types.ts — samma sträng som profilen lagrar. */
    label: '10-15%',
  },
  { id: 'normal', factorMin: 0.75, factorMax: 0.8, label: '20-25%' },
  { id: 'aggressive', factorMin: 0.7, factorMax: 0.75, label: '25-30%' },
] as const satisfies ReadonlyArray<{
  id: string
  factorMin: number
  factorMax: number
  label: DeficitLevel
}>

export type DeficitLevelId = (typeof DEFICIT_LEVELS)[number]['id']

/** Nivå-id → den sträng profilen lagrar i deficit_level. */
export function deficitLevelIdToLabel(id: DeficitLevelId): DeficitLevel {
  return DEFICIT_LEVELS.find(d => d.id === id)!.label
}

/**
 * Profilens lagrade värde → nivå-id.
 *
 * Returnerar null när värdet saknas eller är okänt, så anroparen själv får
 * välja förval. Att tyst falla tillbaka på en nivå här vore att gissa åt
 * användaren — och just den gissningen finns redan på ett ställe i appen
 * (MetabolicCalibration låter okänt värde bli 0,275, alltså aggressivt).
 */
export function deficitLevelIdFromLabel(
  label: DeficitLevel | null | undefined
): DeficitLevelId | null {
  if (!label) return null
  return DEFICIT_LEVELS.find(d => d.label === label)?.id ?? null
}

/** Multiplikatorerna för en nivå, eller null om id:t är okänt. */
export function multipliersForDeficitLevel(
  id: DeficitLevelId
): { min: number; max: number } | null {
  const def = DEFICIT_LEVELS.find(d => d.id === id)
  return def ? { min: def.factorMin, max: def.factorMax } : null
}
