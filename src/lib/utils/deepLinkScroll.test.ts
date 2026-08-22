import { describe, it, expect } from 'vitest'
import {
  shouldSkipScrollToTop,
  hasScrollSettled,
  DEEP_LINK_PARAMS,
  MAX_SCROLL_FRAMES,
  shouldTriggerDeepLinkScroll,
  canScrollToSection,
  REQUIRED_SETTLED_FRAMES,
} from './deepLinkScroll'

/**
 * Låser beteendet bakom djuplänkar till en sektion. Felet som utlöste det
 * här: "Kalibrera nu" tog användaren till rätt sida men fel plats, eftersom
 * den globala scroll-to-top konkurrerade med sektionens egen scroll.
 */

describe('shouldSkipScrollToTop', () => {
  it('hoppar över när URL:en pekar ut kalibreringen', () => {
    expect(shouldSkipScrollToTop('?calibrate=open')).toBe(true)
  })

  it('hoppar över när URL:en pekar ut en period', () => {
    expect(shouldSkipScrollToTop('?phase=open')).toBe(true)
  })

  it('scrollar till toppen vid vanlig navigering', () => {
    expect(shouldSkipScrollToTop('')).toBe(false)
    expect(shouldSkipScrollToTop('?tab=history')).toBe(false)
  })

  it('fungerar med flera parametrar', () => {
    expect(shouldSkipScrollToTop('?tab=x&calibrate=open')).toBe(true)
  })

  it('reagerar på parameterns närvaro, inte dess värde', () => {
    // ?calibrate= utan värde ska ändå räknas som djuplänk
    expect(shouldSkipScrollToTop('?calibrate=')).toBe(true)
  })

  it('täcker alla deklarerade djuplänksparametrar', () => {
    for (const p of DEEP_LINK_PARAMS) {
      expect(shouldSkipScrollToTop(`?${p}=open`)).toBe(true)
    }
  })
})

describe('hasScrollSettled', () => {
  it('är klar när positionen inte rört sig', () => {
    expect(hasScrollSettled(120, 120)).toBe(true)
  })

  it('tolererar subpixelrörelse', () => {
    expect(hasScrollSettled(120, 120.4)).toBe(true)
  })

  it('är inte klar medan sidan fortfarande växer', () => {
    expect(hasScrollSettled(120, 260)).toBe(false)
  })

  it('hanterar rörelse åt båda håll', () => {
    expect(hasScrollSettled(300, 120)).toBe(false)
    expect(hasScrollSettled(120, 300)).toBe(false)
  })
})

describe('shouldTriggerDeepLinkScroll', () => {
  /**
   * Buggen som motiverar funktionen: en enda effekt gjorde både städningen
   * av URL-parametern och scrollen. Borttagningen triggade en omkörning vars
   * cleanup dödade animationen innan första ramen kört. Sektionen öppnades
   * men scrollen uteblev.
   */

  it('scrollar när parametern finns', () => {
    expect(shouldTriggerDeepLinkScroll({ paramPresent: true, intentRegistered: false })).toBe(true)
  })

  it('scrollar fortfarande efter att parametern städats bort', () => {
    // Kärnan: avsikten måste överleva att URL:en ändras
    expect(shouldTriggerDeepLinkScroll({ paramPresent: false, intentRegistered: true })).toBe(true)
  })

  it('scrollar inte vid vanlig navigering', () => {
    expect(shouldTriggerDeepLinkScroll({ paramPresent: false, intentRegistered: false })).toBe(
      false
    )
  })
})

describe('canScrollToSection', () => {
  /**
   * Buggen: vid mount kör React båda effekterna innan omrenderingen från
   * setIsOpen(true). Scrollen sköt då mot en kollapsad sektion, nollställde
   * flaggan, och hoppade över den riktiga körningen efter expansionen.
   */

  it('väntar tills sektionen faktiskt expanderat', () => {
    expect(canScrollToSection({ intentRegistered: true, sectionExpanded: false })).toBe(false)
  })

  it('scrollar när både avsikt och expansion finns', () => {
    expect(canScrollToSection({ intentRegistered: true, sectionExpanded: true })).toBe(true)
  })

  it('scrollar inte utan avsikt, även om sektionen är öppen', () => {
    // Användaren kan ha öppnat sektionen manuellt — då ska vi inte flytta sidan
    expect(canScrollToSection({ intentRegistered: false, sectionExpanded: true })).toBe(false)
  })

  it('scrollar inte när ingenting stämmer', () => {
    expect(canScrollToSection({ intentRegistered: false, sectionExpanded: false })).toBe(false)
  })
})

describe('MAX_SCROLL_FRAMES', () => {
  it('ger tillräckligt med tid utan att kunna loopa', () => {
    // ~40 ramar ≈ 600 ms vid 60 fps: räcker för att profilen ska laddas och
    // sektionen expandera, men avbryter en sida som aldrig stabiliseras.
    expect(MAX_SCROLL_FRAMES).toBeGreaterThanOrEqual(20)
    expect(MAX_SCROLL_FRAMES).toBeLessThanOrEqual(120)
  })
})

describe('omsiktningsloopen — stilla ramar i rad', () => {
  /**
   * EN stilla ram räckte förut för att avsluta scrollen.
   *
   * Sektionen expanderar via en effekt, så de första ramarna kan vara helt
   * orörliga — målet har inte börjat flytta sig än. Loopen avbröt då på ram
   * 2 och lämnade användaren ovanför sektionen. Ibland landade samma klick
   * rätt, beroende på hur ramarna råkade falla, vilket är varför djuplänken
   * kändes opålitlig snarare än trasig.
   */
  function simulera(positioner: number[]) {
    let frames = 0
    let lastTop = -1
    let settledStreak = 0
    for (const top of positioner) {
      settledStreak = hasScrollSettled(lastTop, top) ? settledStreak + 1 : 0
      lastTop = top
      frames++
      if (settledStreak >= REQUIRED_SETTLED_FRAMES || frames >= MAX_SCROLL_FRAMES) break
    }
    return { frames, slutPosition: positioner[frames - 1] }
  }

  it('följer med när sidan växer efter ett par orörliga ramar', () => {
    // Ram 1-3 stilla (utfällningen har inte börjat), sedan hoppar målet.
    const positioner = [500, 500, 500, 820, 640, 610, 608, 608, 608, 608]
    const r = simulera(positioner)
    expect(r.slutPosition).toBe(608)
  })

  it('avslutar snabbt när sidan redan står still', () => {
    const r = simulera([600, 600, 600, 600, 600, 600])
    expect(r.frames).toBeLessThanOrEqual(REQUIRED_SETTLED_FRAMES + 1)
  })

  it('loopar inte på en sida som aldrig lugnar sig', () => {
    const rastlos = Array.from({ length: 200 }, (_, i) => 500 + (i % 2) * 40)
    expect(simulera(rastlos).frames).toBe(MAX_SCROLL_FRAMES)
  })

  it('kräver fler än en stilla ram', () => {
    // Skyddet mot exakt det som gjorde djuplänken opålitlig.
    expect(REQUIRED_SETTLED_FRAMES).toBeGreaterThan(1)
  })
})
