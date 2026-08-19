import { describe, it, expect } from 'vitest'
import {
  DEFICIT_LEVELS,
  deficitLevelIdToLabel,
  deficitLevelIdFromLabel,
  multipliersForDeficitLevel,
} from '@/lib/utils/deficitLevels'
import { ratePercentForDeficitLevel } from '@/lib/calculations/contestPrep'
import { dailyCalorieDeltaToKgPerWeek } from '@/lib/calculations/weeklyRate'

describe('underskottsnivåer', () => {
  it('visar samma kg/vecka som Energimål', () => {
    // Nivåväljaren i perioder och EnergyGoalReferenceTable beskriver samma
    // sak för användaren. Skulle de räkna olika skulle appen ge två svar på
    // samma fråga — det här testet gör att de inte kan glida isär.
    for (const tdee of [2200, 2500, 2800, 3000, 3400]) {
      for (const level of DEFICIT_LEVELS) {
        const energiMin = dailyCalorieDeltaToKgPerWeek(tdee - tdee * level.factorMax).toFixed(2)
        const energiMax = dailyCalorieDeltaToKgPerWeek(tdee - tdee * level.factorMin).toFixed(2)

        const r = ratePercentForDeficitLevel({ level: level.id, tdee, weightKg: 85 })!
        expect(r.kgMin.toFixed(2)).toBe(energiMin)
        expect(r.kgMax.toFixed(2)).toBe(energiMax)
      }
    }
  })

  it('rundtur mellan id och lagrat värde', () => {
    for (const level of DEFICIT_LEVELS) {
      expect(deficitLevelIdFromLabel(deficitLevelIdToLabel(level.id))).toBe(level.id)
    }
  })

  it('gissar inte vid okänt värde', () => {
    // Anroparen ska välja förval själv — en tyst gissning här skulle sätta
    // någons kalorimål utan att de valt det.
    expect(deficitLevelIdFromLabel(null)).toBeNull()
    expect(deficitLevelIdFromLabel(undefined)).toBeNull()
  })

  it('har multiplikatorer som ger djupare underskott per steg', () => {
    const c = multipliersForDeficitLevel('cautious')!
    const n = multipliersForDeficitLevel('normal')!
    const a = multipliersForDeficitLevel('aggressive')!
    expect(c.min).toBeGreaterThan(n.min)
    expect(n.min).toBeGreaterThan(a.min)
  })
})
