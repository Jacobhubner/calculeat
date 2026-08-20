/**
 * Djuplänkning till en sektion på en sida.
 *
 * BAKGRUND (2026-08-16): "Kalibrera nu" i Översikt navigerade till
 * Kaloribehov, men kalibreringen ligger långt ned OCH är kollapsad — så
 * uppmaningen lämnade användaren att leta själv.
 *
 * Att bara scrolla vid mount räckte inte. Tre saker rör målet samtidigt:
 * den globala ScrollToTop i App.tsx, att sektionen renderas först när
 * profilen laddats, och att den expanderar just då vilket får sidan att
 * växa. Ett enda scrollIntoView landade mitt i formuläret ovanför.
 */

/** URL-parametrar som pekar ut en sektion och därför ska hindra scroll-to-top. */
export const DEEP_LINK_PARAMS = ['calibrate', 'phase', 'weight'] as const

/**
 * Ska den globala scroll-to-top hoppas över för den här URL:en?
 *
 * Sant när URL:en pekar ut ett mål på sidan — då äger sektionen
 * scrollpositionen, och en konkurrerande scroll till toppen gör att
 * användaren landar fel.
 */
export function shouldSkipScrollToTop(search: string): boolean {
  const params = new URLSearchParams(search)
  return DEEP_LINK_PARAMS.some(p => params.has(p))
}

/**
 * Har scrollen landat? Positionen räknas som stabil när elementet inte
 * flyttat sig mätbart sedan förra ramen.
 *
 * Tröskeln 1 px: subpixelrendering gör att värdet sällan är exakt
 * identiskt två ramar i rad.
 */
export function hasScrollSettled(previousTop: number, currentTop: number): boolean {
  return Math.abs(currentTop - previousTop) < 1
}

/** Övre gräns för omsiktningar, så en ständigt växande sida inte loopar. */
export const MAX_SCROLL_FRAMES = 40

/**
 * Ska djuplänken utlösa en scroll, givet URL-parametern och om avsikten
 * redan registrerats?
 *
 * VARFÖR DETTA ÄR EN EGEN FUNKTION: den första implementationen gjorde
 * både städningen av URL-parametern och scrollen i EN effekt, med
 * searchParams i beroendelistan. Borttagningen av parametern startade om
 * effekten, och cleanup körde cancelAnimationFrame innan första ramen
 * hunnit köra. Sektionen expanderade men scrollen dog omedelbart.
 *
 * Avsikten måste alltså bäras av något som överlever att parametern
 * försvinner — en ref, inte URL:en.
 */
export function shouldTriggerDeepLinkScroll(params: {
  /** Finns parametern i URL:en just nu? */
  paramPresent: boolean
  /** Har avsikten redan registrerats i en ref? */
  intentRegistered: boolean
}): boolean {
  return params.paramPresent || params.intentRegistered
}

/**
 * Får scrollen köras nu, eller ska den vänta?
 *
 * VARFÖR: vid mount kör React alla effekter direkt efter varandra, innan
 * omrenderingen från setIsOpen(true) hunnit ske. Utan det här villkoret
 * scrollade vi mot en fortfarande KOLLAPSAD sektion, nollställde
 * avsiktsflaggan, och hoppade därmed över den riktiga körningen efter
 * expansionen. Sektionen öppnades men sidan stod kvar — vilket var precis
 * symptomet.
 */
export function canScrollToSection(params: {
  /** Är avsikten registrerad? */
  intentRegistered: boolean
  /** Har sektionen faktiskt expanderat? */
  sectionExpanded: boolean
}): boolean {
  return params.intentRegistered && params.sectionExpanded
}
