/**
 * Gissar vilken måltid användaren troligen loggar just nu.
 *
 * Snabbloggning hade ingen given måltidsplats och valde därför sista
 * måltiden på dagen — vid standarduppsättningen "Middag", även klockan sju
 * på morgonen. Fel förval är dyrare än det låter: det syns inte alltid, och
 * maten hamnar tyst i fel måltid.
 *
 * Måltider har inga klockslag i databasen, bara ordning. Därför fördelas
 * dygnets ättimmar (06–22) jämnt över måltiderna i tur och ordning. Det ger
 * rätt måltid för en vanlig dag utan att kräva ny data, och användaren kan
 * alltid byta i väljaren.
 */

/** Ättimmar: före 06 räknas som dygnets sista måltid, efter 22 likaså. */
const DAY_START_HOUR = 6
const DAY_END_HOUR = 22

export function pickDefaultMealIndex(mealCount: number, date = new Date()): number {
  if (mealCount <= 0) return 0
  if (mealCount === 1) return 0

  const hour = date.getHours()

  // Nattätande hör till dagens sista måltid snarare än morgondagens första
  if (hour < DAY_START_HOUR) return mealCount - 1
  if (hour >= DAY_END_HOUR) return mealCount - 1

  const span = DAY_END_HOUR - DAY_START_HOUR
  const progress = (hour - DAY_START_HOUR) / span
  const index = Math.floor(progress * mealCount)

  // Math.floor kan ge mealCount exakt vid slutet av intervallet
  return Math.min(index, mealCount - 1)
}
