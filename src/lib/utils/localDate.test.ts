import { describe, it, expect } from 'vitest'
import {
  localDateString,
  localDateOffset,
  dateStringInZone,
  zonesDiffer,
  deviceTimeZone,
  msUntilNextLocalMidnight,
} from './localDate'

describe('localDateString', () => {
  it('ger lokalt datum, inte UTC-datum', () => {
    // 01:00 svensk sommartid = 23:00 UTC dagen innan. Det är exakt det fall
    // där toISOString() gav fel dag och mat hamnade på gårdagen.
    const d = new Date(2026, 7, 14, 1, 0, 0) // 14 aug 2026, 01:00 lokal tid
    expect(localDateString(d)).toBe('2026-08-14')
  })

  it('nollpaddar månad och dag', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('hanterar sista sekunden på dygnet', () => {
    expect(localDateString(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31')
  })
})

describe('localDateOffset', () => {
  it('räknar bakåt', () => {
    expect(localDateOffset(-1, new Date(2026, 7, 14))).toBe('2026-08-13')
  })

  it('hanterar månadsskifte bakåt', () => {
    expect(localDateOffset(-1, new Date(2026, 7, 1))).toBe('2026-07-31')
  })

  it('hanterar årsskifte bakåt', () => {
    expect(localDateOffset(-1, new Date(2026, 0, 1))).toBe('2025-12-31')
  })

  it('räknar framåt', () => {
    expect(localDateOffset(1, new Date(2026, 7, 14))).toBe('2026-08-15')
  })

  it('muterar inte indatumet', () => {
    const from = new Date(2026, 7, 14)
    localDateOffset(-30, from)
    expect(localDateString(from)).toBe('2026-08-14')
  })
})

describe('dateStringInZone', () => {
  it('ger olika datum för samma ögonblick i olika zoner', () => {
    // 2026-08-14 23:30 UTC: redan den 15:e i Stockholm, fortfarande den 14:e i New York.
    const t = new Date('2026-08-14T23:30:00Z')
    expect(dateStringInZone(t, 'Europe/Stockholm')).toBe('2026-08-15')
    expect(dateStringInZone(t, 'Europe/London')).toBe('2026-08-15')
    expect(dateStringInZone(t, 'America/New_York')).toBe('2026-08-14')
    expect(dateStringInZone(t, 'Pacific/Auckland')).toBe('2026-08-15')
  })

  it('hanterar sommartid', () => {
    // Januari: Stockholm är UTC+1, inte +2.
    const winter = new Date('2026-01-14T23:30:00Z')
    expect(dateStringInZone(winter, 'Europe/Stockholm')).toBe('2026-01-15')
    const t = new Date('2026-01-14T22:30:00Z')
    expect(dateStringInZone(t, 'Europe/Stockholm')).toBe('2026-01-14')
  })

  it('faller tillbaka på enhetens tid vid ogiltig zon i stället för att kasta', () => {
    const t = new Date(2026, 7, 14, 12, 0, 0)
    expect(dateStringInZone(t, 'Inte/EnZon')).toBe('2026-08-14')
  })
})

describe('localDateString med zon', () => {
  it('respekterar angiven zon', () => {
    const t = new Date('2026-08-14T23:30:00Z')
    expect(localDateString(t, 'America/Los_Angeles')).toBe('2026-08-14')
  })

  it('utan zon används enhetens tid', () => {
    const t = new Date(2026, 7, 14, 1, 0, 0)
    expect(localDateString(t)).toBe('2026-08-14')
  })
})

describe('localDateOffset med zon', () => {
  it('räknar bakåt i angiven zon', () => {
    const t = new Date('2026-08-14T23:30:00Z') // 15:e i Stockholm
    expect(localDateOffset(-1, t, 'Europe/Stockholm')).toBe('2026-08-14')
  })
})

describe('msUntilNextLocalMidnight', () => {
  const MINUTE = 60_000
  const HOUR = 60 * MINUTE

  /** Datumet timern landar på ska alltid vara dagen efter startdatumet. */
  const landsOnNextDay = (from: Date, tz?: string) => {
    const landing = new Date(from.getTime() + msUntilNextLocalMidnight(from, tz))
    return {
      before: localDateString(from, tz),
      after: localDateString(landing, tz),
    }
  }

  it('fyrar strax efter midnatt, inte precis på', () => {
    // 23:00 lokal tid → drygt en timme kvar, med marginal efter skiftet.
    const from = new Date(2026, 7, 14, 23, 0, 0)
    const ms = msUntilNextLocalMidnight(from)
    expect(ms).toBeGreaterThan(HOUR)
    expect(ms).toBeLessThan(HOUR + 2 * MINUTE)
  })

  it('landar alltid på nästa dag', () => {
    const { before, after } = landsOnNextDay(new Date(2026, 7, 14, 23, 59, 0))
    expect(before).toBe('2026-08-14')
    expect(after).toBe('2026-08-15')
  })

  it('räknar mot angiven zon, inte enhetens', () => {
    // 2026-08-14 23:30 UTC är redan den 15:e i Stockholm men den 14:e i New York.
    // Zonerna har därför olika lång tid kvar till sitt nästa dygnsskifte.
    const t = new Date('2026-08-14T23:30:00Z')
    const sthlm = msUntilNextLocalMidnight(t, 'Europe/Stockholm')
    const ny = msUntilNextLocalMidnight(t, 'America/New_York')
    expect(sthlm).not.toBe(ny)

    expect(landsOnNextDay(t, 'Europe/Stockholm')).toEqual({
      before: '2026-08-15',
      after: '2026-08-16',
    })
    expect(landsOnNextDay(t, 'America/New_York')).toEqual({
      before: '2026-08-14',
      after: '2026-08-15',
    })
  })

  it('hanterar sommartidens start (23-timmarsdygn)', () => {
    // Sverige ställer fram 29 mars 2026, 02:00 → 03:00.
    const from = new Date('2026-03-28T22:00:00Z') // 23:00 svensk tid, 28 mars
    expect(landsOnNextDay(from, 'Europe/Stockholm')).toEqual({
      before: '2026-03-28',
      after: '2026-03-29',
    })
  })

  it('hanterar sommartidens slut (25-timmarsdygn)', () => {
    // Sverige ställer tillbaka 25 oktober 2026, 03:00 → 02:00.
    const from = new Date('2026-10-24T21:00:00Z') // 23:00 svensk tid, 24 okt
    expect(landsOnNextDay(from, 'Europe/Stockholm')).toEqual({
      before: '2026-10-24',
      after: '2026-10-25',
    })
  })

  it('ger nästan ett helt dygn strax efter midnatt', () => {
    const from = new Date(2026, 7, 14, 0, 1, 0)
    const ms = msUntilNextLocalMidnight(from)
    expect(ms).toBeGreaterThan(23 * HOUR)
    expect(ms).toBeLessThanOrEqual(24 * HOUR)
  })

  it('faller tillbaka på enhetens tid vid ogiltig zon i stället för att kasta', () => {
    const from = new Date(2026, 7, 14, 23, 0, 0)
    expect(msUntilNextLocalMidnight(from, 'Inte/EnZon')).toBe(msUntilNextLocalMidnight(from))
  })

  it('returnerar alltid ett positivt värde inom ett dygn med marginal', () => {
    for (const hour of [0, 1, 6, 12, 18, 22, 23]) {
      const ms = msUntilNextLocalMidnight(new Date(2026, 7, 14, hour, 30, 0))
      expect(ms).toBeGreaterThan(0)
      expect(ms).toBeLessThanOrEqual(26 * HOUR)
    }
  })
})

describe('zonesDiffer', () => {
  it('samma zon skiljer sig aldrig', () => {
    expect(zonesDiffer('Europe/Stockholm', 'Europe/Stockholm')).toBe(false)
  })

  it('olika namn men samma faktiska tid räknas som lika', () => {
    // Annars hade användaren fått en meningslös fråga vid en resa Stockholm–Oslo.
    expect(zonesDiffer('Europe/Stockholm', 'Europe/Oslo')).toBe(false)
  })

  it('upptäcker verklig skillnad', () => {
    expect(zonesDiffer('Europe/Stockholm', 'America/New_York')).toBe(true)
  })

  it('upptäcker skillnad även när datumet råkar vara detsamma', () => {
    // Mitt på dagen i Sverige är det samma datum i London men en timme tidigare.
    const noon = new Date('2026-08-14T12:00:00Z')
    expect(zonesDiffer('Europe/Stockholm', 'Europe/London', noon)).toBe(true)
  })

  it('ogiltig zon ger false i stället för att kasta', () => {
    expect(zonesDiffer('Europe/Stockholm', 'Inte/EnZon')).toBe(false)
  })
})

describe('deviceTimeZone', () => {
  it('ger en IANA-liknande sträng', () => {
    const tz = deviceTimeZone()
    expect(tz).toBeTruthy()
    expect(tz).toMatch(/^[A-Za-z_]+\/[A-Za-z0-9_+-]+/)
  })
})
