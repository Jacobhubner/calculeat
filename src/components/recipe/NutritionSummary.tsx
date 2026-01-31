import { Badge } from '@/components/ui/badge'
import type { RecipeNutrition } from '@/lib/calculations/recipeCalculator'

interface NutritionSummaryProps {
  nutrition: RecipeNutrition | null
  servings: number
  saveAs?: '100g' | 'portion'
}

export function NutritionSummary({
  nutrition,
  servings,
  saveAs = 'portion',
}: NutritionSummaryProps) {
  if (!nutrition || nutrition.totalCalories === 0) {
    return (
      <div className="bg-neutral-50 rounded-xl p-6 text-center">
        <p className="text-neutral-500 text-sm">Lägg till ingredienser för att se näringsvärden</p>
      </div>
    )
  }

  const colorBadgeClass = {
    Green: 'bg-green-100 text-green-700 border-green-300',
    Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Orange: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const colorLabel = {
    Green: 'Grön',
    Yellow: 'Gul',
    Orange: 'Orange',
  }

  // Get display values based on saveAs selection
  const displayValues =
    saveAs === '100g'
      ? {
          label: 'Per 100g',
          calories: nutrition.per100g.calories,
          protein: nutrition.per100g.protein,
          carbs: nutrition.per100g.carbs,
          fat: nutrition.per100g.fat,
          weight: 100,
        }
      : {
          label: `Per portion (${Math.round(nutrition.perServing.weight)}g)`,
          calories: nutrition.perServing.calories,
          protein: nutrition.perServing.protein,
          carbs: nutrition.perServing.carbs,
          fat: nutrition.perServing.fat,
          weight: nutrition.perServing.weight,
        }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 space-y-6">
      {/* Sparas som - main highlighted section */}
      <div className="bg-white/80 rounded-xl p-4 border-2 border-primary-200">
        <h4 className="text-sm font-semibold text-primary-700 mb-3 uppercase tracking-wide flex items-center gap-2">
          <span>📦</span> Sparas som: {displayValues.label}
        </h4>

        {/* Calories - big display */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-primary-600">
            {Math.round(displayValues.calories)}
          </div>
          <div className="text-sm text-neutral-500">kcal</div>
        </div>

        {/* Macros grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-green-600">
              {displayValues.protein.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500">Protein</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-blue-600">
              {displayValues.carbs.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500">Kolhydrater</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-amber-600">
              {displayValues.fat.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500">Fett</div>
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="space-y-3">
        {/* Show the alternative format */}
        {saveAs === 'portion' ? (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">Per 100g:</span>
            <span className="font-medium text-neutral-900">
              {Math.round(nutrition.per100g.calories)} kcal
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">Per portion:</span>
            <span className="font-medium text-neutral-900">
              {Math.round(nutrition.perServing.calories)} kcal (
              {Math.round(nutrition.perServing.weight)}g)
            </span>
          </div>
        )}

        {/* Total weight */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600">Totalvikt:</span>
          <span className="font-medium text-neutral-900">{Math.round(nutrition.totalWeight)}g</span>
        </div>

        {/* Number of servings */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600">Antal portioner:</span>
          <span className="font-medium text-neutral-900">{servings}</span>
        </div>

        {/* Energy density color */}
        {nutrition.energyDensityColor && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">Energitäthet:</span>
            <Badge variant="outline" className={colorBadgeClass[nutrition.energyDensityColor]}>
              {colorLabel[nutrition.energyDensityColor]}
            </Badge>
          </div>
        )}
      </div>

      {/* Total section */}
      <div className="bg-white/40 rounded-lg p-4">
        <h5 className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
          Totalt (hela receptet)
        </h5>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-primary-600">
              {Math.round(nutrition.totalCalories)}
            </div>
            <div className="text-neutral-500">kcal</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{nutrition.totalProtein.toFixed(1)}g</div>
            <div className="text-neutral-500">P</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{nutrition.totalCarbs.toFixed(1)}g</div>
            <div className="text-neutral-500">K</div>
          </div>
          <div>
            <div className="font-semibold text-amber-600">{nutrition.totalFat.toFixed(1)}g</div>
            <div className="text-neutral-500">F</div>
          </div>
        </div>
      </div>
    </div>
  )
}
