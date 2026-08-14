import { describe, it, expect } from 'vitest'
import { resolveSource } from './useFoodSource'

/**
 * Tidszonen används bara när språket inte kan avgöra. Testerna nedan är
 * uppdelade efter det: först att inget tidigare beteende ändrats, sedan vad
 * zonen faktiskt tillför.
 */
describe('resolveSource — explicit val vinner alltid', () => {
  it('en satt preferens ignorerar både språk och zon', () => {
    expect(resolveSource('cofid', 'sv', 'Europe/Stockholm')).toBe('cofid')
    expect(resolveSource('slv', 'en', 'America/New_York')).toBe('slv')
    expect(resolveSource('usda', 'en', 'Europe/London')).toBe('usda')
  })
})

describe('resolveSource — språk med region går före zon', () => {
  it('en-GB ger CoFID även från en amerikansk zon', () => {
    expect(resolveSource('auto', 'en-GB', 'America/New_York')).toBe('cofid')
  })

  it('en-US ger USDA även från en brittisk zon', () => {
    expect(resolveSource('auto', 'en-US', 'Europe/London')).toBe('usda')
  })

  it('sv-SE ger SLV oavsett zon', () => {
    expect(resolveSource('auto', 'sv-SE', 'America/New_York')).toBe('slv')
  })
})

describe('resolveSource — zonen avgör när språket är bara "en"', () => {
  it('britt får CoFID (kärnfallet: i18next normaliserar en-GB → en)', () => {
    expect(resolveSource('auto', 'en', 'Europe/London')).toBe('cofid')
  })

  it('amerikan får USDA', () => {
    expect(resolveSource('auto', 'en', 'America/New_York')).toBe('usda')
  })

  it('irländare får CoFID', () => {
    expect(resolveSource('auto', 'en', 'Europe/Dublin')).toBe('cofid')
  })

  it('svensk med engelskt gränssnitt får SLV — bor i Sverige, äter svensk mat', () => {
    expect(resolveSource('auto', 'en', 'Europe/Stockholm')).toBe('slv')
  })

  it('zon utan tydlig källa faller tillbaka på språket', () => {
    expect(resolveSource('auto', 'en', 'Asia/Tokyo')).toBe('usda')
    expect(resolveSource('auto', 'en', 'Australia/Sydney')).toBe('usda')
  })

  it('utan zon alls gäller språket', () => {
    expect(resolveSource('auto', 'en')).toBe('usda')
  })
})

describe('resolveSource — zonen får inte flytta icke-engelska användare', () => {
  it('svensk på resa i New York behåller SLV', () => {
    // Språket är det stabila svaret; zonen ändras av en semester.
    expect(resolveSource('auto', 'sv', 'America/New_York')).toBe('slv')
  })

  it('svensk i London behåller SLV', () => {
    expect(resolveSource('auto', 'sv', 'Europe/London')).toBe('slv')
  })

  it('svensk hemma får SLV', () => {
    expect(resolveSource('auto', 'sv', 'Europe/Stockholm')).toBe('slv')
  })
})

describe('resolveSource — fallback', () => {
  it('okänt språk utan zonträff ger USDA', () => {
    expect(resolveSource('auto', 'de-DE', 'Europe/Berlin')).toBe('usda')
  })

  it('okänt språk flyttas inte av zonen — bara engelska konsulterar zonen', () => {
    // En tysk i London ska inte få CoFID: 'de' är inte tvetydigt på samma sätt
    // som 'en', och vi har ingen grund att anta att hen bor i Storbritannien.
    expect(resolveSource('auto', 'de-DE', 'Europe/London')).toBe('usda')
  })

  it('tomt språk ger fallback', () => {
    expect(resolveSource('auto', '')).toBe('usda')
  })
})
