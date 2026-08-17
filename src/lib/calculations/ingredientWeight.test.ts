/**
 * Recept måste spara ingrediensens gram-ekvivalent, inte bara mängd + enhet.
 *
 * BAKGRUND: receptredigeraren skickade aldrig `weight_grams`, så kolumnen var
 * NULL för allt som skapats via gränssnittet (145 av 145 privata rader).
 * Allt som räknar på recept i SQL fick då NULL — driftkontrollen visade tomt
 * och receptet såg åtgärdat ut fastän inget räknats om.
 *
 * Testerna låser fast att vikten går att härleda för de enheter som faktiskt
 * förekommer i databasen: g, st, msk, dl, ml.
 */

import { describe, it, expect } from 'vitest'
import { calculateIngredientNutrition } from './recipeCalculator'
import type { FoodItem } from '@/hooks/useFoodItems'

function makeFood(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    id: 'test-id',
    name: 'Testlivsmedel',
    calories: 400,
    protein_g: 10,
    carb_g: 50,
    fat_g: 15,
    default_amount: 100,
    default_unit: 'g',
    ...overrides,
  } as FoodItem
}

describe('calculateIngredientNutrition — vikt i gram', () => {
  it('gram: vikten är mängden', () => {
    const r = calculateIngredientNutrition(makeFood(), 250, 'g')
    expect(r.weightGrams).toBe(250)
  })

  it('kilogram räknas om till gram', () => {
    const r = calculateIngredientNutrition(makeFood(), 1.5, 'kg')
    expect(r.weightGrams).toBe(1500)
  })

  it('styck använder styckvikten', () => {
    const food = makeFood({ grams_per_piece: 60, default_unit: 'st' })
    const r = calculateIngredientNutrition(food, 3, 'st')
    expect(r.weightGrams).toBe(180)
  })

  it('matsked med densitet ger vikt, inte volym', () => {
    // ml_per_gram = 1.09 (olja): 15 ml ≈ 13,8 g
    const food = makeFood({ ml_per_gram: 1.09, default_unit: 'ml' })
    const r = calculateIngredientNutrition(food, 1, 'msk')
    expect(r.weightGrams).toBeGreaterThan(13)
    expect(r.weightGrams).toBeLessThan(14)
  })

  it('deciliter utan densitet behandlas som gram-ekvivalent', () => {
    const food = makeFood({ default_unit: 'ml' })
    const r = calculateIngredientNutrition(food, 2, 'dl')
    expect(r.weightGrams).toBe(200)
  })

  // Ett volymmått på ett gram-baserat livsmedel utan densitet GÅR inte att
  // räkna om — getVolumeToGrams returnerar NaN. Det är inte ett fel i sig,
  // men värdet får aldrig sparas: NULL är ärligare än ett skräptal.
  it('volym utan densitet ger ett ogiltigt värde som inte får lagras', () => {
    const r = calculateIngredientNutrition(makeFood(), 1, 'msk')
    expect(Number.isFinite(r.weightGrams)).toBe(false)
  })

  it('gram- och styckenheter ger alltid ett lagringsbart värde', () => {
    const food = makeFood({ grams_per_piece: 50, default_unit: 'st' })
    for (const [f, unit] of [
      [makeFood(), 'g'],
      [makeFood(), 'kg'],
      [food, 'st'],
    ] as const) {
      const r = calculateIngredientNutrition(f, 1, unit)
      expect(Number.isFinite(r.weightGrams)).toBe(true)
      expect(r.weightGrams).toBeGreaterThan(0)
    }
  })
})
