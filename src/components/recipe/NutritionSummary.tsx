import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('recipes')

  if (!nutrition || nutrition.totalCalories === 0) {
    return (
      <div className="bg-neutral-50 rounded-xl p-6 text-center">
        <p className="text-neutral-500 text-sm">{t('nutrition.empty')}</p>
      </div>
    )
  }

  const colorBadgeClass = {
    Green: 'bg-green-100 text-green-700 border-green-300',
    Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Orange: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const colorLabel = {
    Green: t('nutrition.colorGreen'),
    Yellow: t('nutrition.colorYellow'),
    Orange: t('nutrition.colorOrange'),
  }

  // Get display values based on saveAs selection
  const displayValues =
    saveAs === '100g'
      ? {
          label: t('nutrition.per100g'),
          calories: nutrition.per100g.calories,
          protein: nutrition.per100g.protein,
          carbs: nutrition.per100g.carbs,
          fat: nutrition.per100g.fat,
          saturatedFat: nutrition.per100g.saturatedFat,
          sugars: nutrition.per100g.sugars,
          salt: nutrition.per100g.salt,
          weight: 100,
        }
      : {
          label: t('nutrition.perServing', { weight: Math.round(nutrition.perServing.weight) }),
          calories: nutrition.perServing.calories,
          protein: nutrition.perServing.protein,
          carbs: nutrition.perServing.carbs,
          fat: nutrition.perServing.fat,
          saturatedFat: nutrition.perServing.saturatedFat,
          sugars: nutrition.perServing.sugars,
          salt: nutrition.perServing.salt,
          weight: nutrition.perServing.weight,
        }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Sparas som - main highlighted section */}
      <div className="bg-white/80 rounded-xl p-4 border-2 border-primary-200">
        <h4 className="text-sm font-semibold text-primary-700 mb-3 uppercase tracking-wide flex items-center gap-2">
          <span>📦</span> {t('nutrition.savedAs')} {displayValues.label}
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
            <div className="text-lg font-semibold" style={{ color: '#f5c518' }}>
              {displayValues.fat.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500">{t('nutrition.fat')}</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold" style={{ color: '#fb923c' }}>
              {displayValues.carbs.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500">{t('nutrition.carbs')}</div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold" style={{ color: '#f43f5e' }}>
              {displayValues.protein.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500">{t('nutrition.protein')}</div>
          </div>
        </div>

        {/* Optional sub-nutrients */}
        {(displayValues.saturatedFat != null ||
          displayValues.sugars != null ||
          displayValues.salt != null) && (
          <div className="space-y-1 text-sm mt-1">
            {displayValues.saturatedFat != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400">{t('nutrition.saturatedFat')}</span>
                <span className="text-neutral-600">{displayValues.saturatedFat.toFixed(1)}g</span>
              </div>
            )}
            {displayValues.sugars != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400">{t('nutrition.sugars')}</span>
                <span className="text-neutral-600">{displayValues.sugars.toFixed(1)}g</span>
              </div>
            )}
            {displayValues.salt != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400">{t('nutrition.salt')}</span>
                <span className="text-neutral-600">{displayValues.salt.toFixed(1)}g</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional info */}
      <div className="space-y-3">
        {/* Show the alternative format */}
        {saveAs === 'portion' ? (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">{t('nutrition.altPer100g')}</span>
            <span className="font-medium text-neutral-900">
              {Math.round(nutrition.per100g.calories)} kcal
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">{t('nutrition.altPerServing')}</span>
            <span className="font-medium text-neutral-900">
              {Math.round(nutrition.perServing.calories)} kcal (
              {Math.round(nutrition.perServing.weight)}g)
            </span>
          </div>
        )}

        {/* Total weight */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600">{t('nutrition.totalWeight')}</span>
          <span className="font-medium text-neutral-900">{Math.round(nutrition.totalWeight)}g</span>
        </div>

        {/* Number of servings */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600">{t('nutrition.servingsCount')}</span>
          <span className="font-medium text-neutral-900">{servings}</span>
        </div>

        {/* Energy density color */}
        {nutrition.energyDensityColor && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">{t('nutrition.energyDensity')}</span>
            <Badge variant="outline" className={colorBadgeClass[nutrition.energyDensityColor]}>
              {colorLabel[nutrition.energyDensityColor]}
            </Badge>
          </div>
        )}
      </div>

      {/* Total section */}
      <div className="bg-white/40 rounded-lg p-4">
        <h5 className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
          {t('nutrition.totalSection')}
        </h5>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-primary-600">
              {Math.round(nutrition.totalCalories)}
            </div>
            <div className="text-neutral-500">kcal</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#f5c518' }}>
              {nutrition.totalFat.toFixed(1)}g
            </div>
            <div className="text-neutral-500">F</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#fb923c' }}>
              {nutrition.totalCarbs.toFixed(1)}g
            </div>
            <div className="text-neutral-500">K</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: '#f43f5e' }}>
              {nutrition.totalProtein.toFixed(1)}g
            </div>
            <div className="text-neutral-500">P</div>
          </div>
        </div>
      </div>
    </div>
  )
}
