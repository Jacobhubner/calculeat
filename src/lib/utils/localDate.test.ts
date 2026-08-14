import { describe, it, expect } from 'vitest'
import {
  localDateString,
  localDateOffset,
  dateStringInZone,
  zonesDiffer,
  deviceTimeZone,
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
