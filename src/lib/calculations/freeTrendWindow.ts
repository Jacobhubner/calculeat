/**
 * Gratisnivåns synliga fönster för trendgraferna (vikt + kroppsfett).
 *
 * Reglerna är beslutade i docs/PREMIUM_SPEC.md. De ligger här, fristående från
 * WeightTracker, för att kunna testas isolerat — gatingen är premiumkritisk och
 * har gått sönder på subtila sätt (se testerna i freeTrendWindow.test.ts).
 */

/** Gratisnivåns synliga trendfönster. */
export const FREE_WINDOW_DAYS = 30

/**
 * Punktgolv: den som loggar sällan har ofta 0–1 punkt inom 30 dagar, och en
 * ensam punkt kan inte bilda en linje. Golvet garanterar en läsbar kurva utan
 * att luckra upp tidsgränsen för den som loggar aktivt.
 */
export const FREE_MIN_POINTS = 3

/**
 * Tak för golvet. Utan det skulle tre mätningar utspridda över flera år ge
 * gratisanvändaren hela den spännvidden — alltså mer historik ju sämre man
 * loggar. Taket kapar vid ett halvår.
 */
export const FREE_FLOOR_CAP_DAYS = 180

export const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Beskär en tidssorterad (stigande) serie till gratisnivåns fönster.
 *
 * Regeln: 30 dagar som huvudfall. Räcker det inte till FREE_MIN_POINTS tas de
 * senaste punkterna i stället, dock aldrig äldre än taket — och aldrig ett
 * SÄMRE resultat än tidsfönstret redan gav, så golvet kan inte göra vyn tommare.
 *
 * `fullSeries` är serien före intervallfiltrering. Golvet plockas därifrån så
 * att ett smalt valt intervall (14d) inte hinner tömma urvalet först.
 */
export function applyFreeWindow<T extends { timestamp: number }>(
  data: T[],
  windowStart: number,
  floorCap: number,
  fullSeries: T[] = data
): T[] {
  const byTime = data.filter(d => d.timestamp >= windowStart)
  if (byTime.length >= FREE_MIN_POINTS) return byTime

  const floor = fullSeries.slice(-FREE_MIN_POINTS)
  const capped = floor.filter(d => d.timestamp >= floorCap)
  return capped.length > byTime.length ? capped : byTime
}
