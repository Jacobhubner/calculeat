/**
 * Skrollbeslut för meddelandetråden.
 *
 * Logiken bodde inbäddad i SocialHub och gick inte att testa. Den fick två
 * verkliga buggar: skrollning efter sändning träffade den gamla listan
 * (meddelandet hade inte hämtats om ännu), och bilagor som laddade i
 * efterhand gjorde bubblan högre än positionen vi just skrollat till.
 */

/** Hur nära botten man måste vara för att en laddad bilaga ska följa med ner. */
export const FOLLOW_BOTTOM_THRESHOLD_PX = 250

/**
 * Ska tråden skrolla ner för att listan ändrades?
 *
 * Sant bara när tillskottet hamnade i SLUTET. Vid "ladda äldre" växer listan
 * också, men uppåt — då ska positionen lämnas i fred, annars kastas man ner
 * till botten mitt i läsningen.
 */
export function shouldScrollOnListChange(params: {
  prevCount: number
  nextCount: number
  prevLastId: string | null
  nextLastId: string | null
  hasScrolledInitially: boolean
}): boolean {
  const { prevCount, nextCount, prevLastId, nextLastId, hasScrolledInitially } = params
  if (!hasScrolledInitially) return false
  const grew = nextCount > prevCount
  const newestChanged = nextLastId !== prevLastId
  return grew && newestChanged
}

/**
 * Ska vi följa med ner när en bilaga laddat och gjort innehållet högre?
 * Bara om användaren redan står nära botten — den som medvetet skrollat upp
 * ska inte ryckas tillbaka.
 */
export function shouldFollowBottomOnResize(metrics: {
  scrollHeight: number
  clientHeight: number
  scrollTop: number
}): boolean {
  const { scrollHeight, clientHeight, scrollTop } = metrics
  return scrollHeight - clientHeight - scrollTop < FOLLOW_BOTTOM_THRESHOLD_PX
}
