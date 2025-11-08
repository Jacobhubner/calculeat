/**
 * Utility Functions Export
 */

// Food Finder - Basic search and filtering
export {
  findFoods,
  findFoodsByMacroTarget,
  suggestFoodsForRemainingMacros,
  calculateFoodSimilarity,
  findSubstitutes,
  type FoodFinderParams,
} from './foodFinder'

// Find Best Foods for Goals - Advanced goal-based matching
export {
  findBestFoodsForGoals,
  findFoodsForRemainingMacros,
  findHighProteinFoods,
  findLowCalorieFoods,
  findFoodsByNoomColors,
  findRecipeFoods,
  type FindBestFoodsParams,
  type FoodGoalMatch,
} from './findBestFoodsForGoals'

// Macro Modes - Predefined nutrition profiles
export { nnrMode, offSeasonMode, onSeasonMode, applyMacroMode, type MacroMode } from './macroModes'
