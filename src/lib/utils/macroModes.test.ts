import { describe, it, expect } from 'vitest'
import { applyMacroMode, MODE_CALORIE_MULTIPLIERS, type MacroModeId } from './macroModes'

/**
 * MODE_CALORIE_MULTIPLIERS är en spegling av värdena inuti lägesfunktionerna.
 * Utan det här testet kan de glida isär, och då börjar kostlägeskorten visa
 * en veckotakt som inte hör ihop med lägets faktiska kaloriunderskott — vilket
 * var precis den buggen tabellen infördes för att stänga.
 */

const MODES: MacroModeId[] = ['nnr', 'weightloss', 'active', 'offseason', 'onseason']

describe('MODE_CALORIE_MULTIPLIERS', () => {
  it.each(MODES)('%s speglar lägesfunktionens multiplikatorer', mode => {
    const applied = applyMacroMode(mode, {
      weight: 80,
      fatFreeMass: 64, // onseason kräver FFM
      caloriesMin: 2000,
      caloriesMax: 2200,
    })
    expect(MODE_CALORIE_MULTIPLIERS[mode].min).toBe(applied.calorieMinMultiplier)
    expect(MODE_CALORIE_MULTIPLIERS[mode].max).toBe(applied.calorieMaxMultiplier)
  })

  it('Viktminskning och Deff har samma underskott', () => {
    // Båda är 20–25 % underskott. De visade tidigare olika veckotakt
    // (0,23–0,46 vs 0,46–0,68) trots identiska multiplikatorer.
    expect(MODE_CALORIE_MULTIPLIERS.weightloss).toEqual(MODE_CALORIE_MULTIPLIERS.onseason)
  })

  it('min är alltid lägre än max', () => {
    for (const mode of MODES) {
      const { min, max } = MODE_CALORIE_MULTIPLIERS[mode]
      expect(min).toBeLessThan(max)
    }
  })

  it('underhållslägen ligger kring 1.0', () => {
    for (const mode of ['nnr', 'active'] as MacroModeId[]) {
      const { min, max } = MODE_CALORIE_MULTIPLIERS[mode]
      expect(min).toBeLessThan(1)
      expect(max).toBeGreaterThan(1)
    }
  })
})
