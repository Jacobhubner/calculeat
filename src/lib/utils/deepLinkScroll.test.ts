import { describe, it, expect } from 'vitest'
import {
  shouldSkipScrollToTop,
  hasScrollSettled,
  DEEP_LINK_PARAMS,
  MAX_SCROLL_FRAMES,
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

describe('MAX_SCROLL_FRAMES', () => {
  it('ger tillräckligt med tid utan att kunna loopa', () => {
    // ~40 ramar ≈ 600 ms vid 60 fps: räcker för att profilen ska laddas och
    // sektionen expandera, men avbryter en sida som aldrig stabiliseras.
    expect(MAX_SCROLL_FRAMES).toBeGreaterThanOrEqual(20)
    expect(MAX_SCROLL_FRAMES).toBeLessThanOrEqual(120)
  })
})
