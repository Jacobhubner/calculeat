import { describe, expect, it } from 'vitest'
import { pickDefaultMealIndex } from './defaultMealForTime'

/** Hjälpare: ett datum med given timme, datumet i sig spelar ingen roll. */
const at = (hour: number) => new Date(2026, 0, 15, hour, 0, 0)

describe('pickDefaultMealIndex', () => {
  // Standarduppsättningen: Frukost, Lunch, Mellanmål, Middag
  const FOUR = 4

  it('väljer frukost på morgonen', () => {
    expect(pickDefaultMealIndex(FOUR, at(7))).toBe(0)
    expect(pickDefaultMealIndex(FOUR, at(8))).toBe(0)
  })

  it('väljer lunch mitt på dagen', () => {
    expect(pickDefaultMealIndex(FOUR, at(12))).toBe(1)
  })

  it('väljer middag på kvällen', () => {
    expect(pickDefaultMealIndex(FOUR, at(19))).toBe(3)
    expect(pickDefaultMealIndex(FOUR, at(21))).toBe(3)
  })

  it('lägger nattätande på dagens sista måltid, inte morgondagens första', () => {
    expect(pickDefaultMealIndex(FOUR, at(23))).toBe(FOUR - 1)
    expect(pickDefaultMealIndex(FOUR, at(2))).toBe(FOUR - 1)
  })

  it('går aldrig utanför antalet måltider', () => {
    for (let count = 1; count <= 10; count++) {
      for (let hour = 0; hour < 24; hour++) {
        const index = pickDefaultMealIndex(count, at(hour))
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(count)
      }
    }
  })

  it('klarar tomma och enstaka måltidslistor', () => {
    expect(pickDefaultMealIndex(0, at(12))).toBe(0)
    expect(pickDefaultMealIndex(1, at(12))).toBe(0)
  })

  it('går framåt över dagen — aldrig bakåt', () => {
    let previous = -1
    for (let hour = 6; hour < 22; hour++) {
      const index = pickDefaultMealIndex(FOUR, at(hour))
      expect(index).toBeGreaterThanOrEqual(previous)
      previous = index
    }
  })
})
