import { describe, it, expect } from 'vitest'
import {
  shouldScrollOnListChange,
  shouldFollowBottomOnResize,
  FOLLOW_BOTTOM_THRESHOLD_PX,
} from './chatScroll'

/**
 * Låser beteendet för de två skrollbuggar som faktiskt uppstod:
 *  1. Efter sändning stod vyn kvar — skrollningen skedde innan det nya
 *     meddelandet hunnit hämtas om och renderas.
 *  2. "Ladda äldre" fick INTE kasta ner användaren till botten.
 */

describe('shouldScrollOnListChange', () => {
  const base = {
    prevCount: 5,
    nextCount: 5,
    prevLastId: 'm5',
    nextLastId: 'm5',
    hasScrolledInitially: true,
  }

  it('skrollar när ett nytt meddelande lagts till sist', () => {
    expect(shouldScrollOnListChange({ ...base, nextCount: 6, nextLastId: 'm6' })).toBe(true)
  })

  it('skrollar INTE när äldre meddelanden lagts till i början', () => {
    // Listan växer, men sista meddelandet är oförändrat
    expect(
      shouldScrollOnListChange({ ...base, prevCount: 5, nextCount: 55, nextLastId: 'm5' })
    ).toBe(false)
  })

  it('skrollar inte när inget ändrats', () => {
    expect(shouldScrollOnListChange(base)).toBe(false)
  })

  it('skrollar inte när listan krympt (raderat meddelande)', () => {
    expect(shouldScrollOnListChange({ ...base, nextCount: 4, nextLastId: 'm4' })).toBe(false)
  })

  it('väntar tills den första skrollningen gjorts', () => {
    // Annars konkurrerar den med mount-skrollningen och kan låsa positionen
    expect(
      shouldScrollOnListChange({
        ...base,
        nextCount: 6,
        nextLastId: 'm6',
        hasScrolledInitially: false,
      })
    ).toBe(false)
  })
})

describe('shouldFollowBottomOnResize', () => {
  it('följer med ner när användaren står vid botten', () => {
    expect(
      shouldFollowBottomOnResize({ scrollHeight: 1000, clientHeight: 400, scrollTop: 600 })
    ).toBe(true)
  })

  it('följer med ner när användaren är strax ovanför botten', () => {
    expect(
      shouldFollowBottomOnResize({ scrollHeight: 1000, clientHeight: 400, scrollTop: 500 })
    ).toBe(true)
  })

  it('stör INTE den som skrollat upp för att läsa', () => {
    expect(
      shouldFollowBottomOnResize({ scrollHeight: 5000, clientHeight: 400, scrollTop: 0 })
    ).toBe(false)
  })

  it('gränsen går vid tröskeln', () => {
    const scrollHeight = 1000
    const clientHeight = 400
    const atThreshold = scrollHeight - clientHeight - FOLLOW_BOTTOM_THRESHOLD_PX
    expect(shouldFollowBottomOnResize({ scrollHeight, clientHeight, scrollTop: atThreshold })).toBe(
      false
    )
    expect(
      shouldFollowBottomOnResize({ scrollHeight, clientHeight, scrollTop: atThreshold + 1 })
    ).toBe(true)
  })
})
