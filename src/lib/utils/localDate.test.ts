import { describe, it, expect } from 'vitest'
import { localDateString, localDateOffset } from './localDate'

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
