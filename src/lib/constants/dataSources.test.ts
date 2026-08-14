import { describe, it, expect } from 'vitest'
import { getDataSourceForLocale, getDataSourceForTimeZone } from './dataSources'

describe('getDataSourceForTimeZone', () => {
  it('pekar ut CoFID för brittiska zoner', () => {
    expect(getDataSourceForTimeZone('Europe/London')?.tabKey).toBe('cofid')
    expect(getDataSourceForTimeZone('Europe/Belfast')?.tabKey).toBe('cofid')
  })

  it('ger CoFID för Irland — ingen egen källa, närmare brittisk kost', () => {
    expect(getDataSourceForTimeZone('Europe/Dublin')?.tabKey).toBe('cofid')
  })

  it('pekar ut USDA för amerikanska zoner', () => {
    expect(getDataSourceForTimeZone('America/New_York')?.tabKey).toBe('usda')
    expect(getDataSourceForTimeZone('America/Los_Angeles')?.tabKey).toBe('usda')
    expect(getDataSourceForTimeZone('Pacific/Honolulu')?.tabKey).toBe('usda')
  })

  it('fångar hela America-trädet, inklusive Kanada och Latinamerika', () => {
    expect(getDataSourceForTimeZone('America/Toronto')?.tabKey).toBe('usda')
    expect(getDataSourceForTimeZone('America/Argentina/Buenos_Aires')?.tabKey).toBe('usda')
  })

  it('pekar ut SLV för svensk zon', () => {
    expect(getDataSourceForTimeZone('Europe/Stockholm')?.tabKey).toBe('slv')
  })

  it('ger undefined för zoner utan tydlig källa', () => {
    expect(getDataSourceForTimeZone('Asia/Tokyo')).toBeUndefined()
    expect(getDataSourceForTimeZone('Australia/Sydney')).toBeUndefined()
    expect(getDataSourceForTimeZone('Europe/Berlin')).toBeUndefined()
  })

  it('matchar på hela segment, inte tecken', () => {
    // 'Europe/Lon' är inte ett prefix av 'Europe/London' på segmentnivå.
    expect(getDataSourceForTimeZone('Europe/Lond')).toBeUndefined()
    // Men zonen själv ska förstås matcha.
    expect(getDataSourceForTimeZone('Europe/London')?.tabKey).toBe('cofid')
  })

  it('är skiftlägesokänslig', () => {
    expect(getDataSourceForTimeZone('europe/london')?.tabKey).toBe('cofid')
  })
})

describe('getDataSourceForLocale — oförändrat beteende', () => {
  it('sv → SLV', () => {
    expect(getDataSourceForLocale('sv')?.tabKey).toBe('slv')
    expect(getDataSourceForLocale('sv-SE')?.tabKey).toBe('slv')
  })

  it('en-GB → CoFID, mer specifikt än USDA:s en', () => {
    expect(getDataSourceForLocale('en-GB')?.tabKey).toBe('cofid')
  })

  it('en och en-US → USDA', () => {
    expect(getDataSourceForLocale('en')?.tabKey).toBe('usda')
    expect(getDataSourceForLocale('en-US')?.tabKey).toBe('usda')
  })

  it('okänt språk ger undefined — anroparen avgör fallback', () => {
    expect(getDataSourceForLocale('de-DE')).toBeUndefined()
  })
})
