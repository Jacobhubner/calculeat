import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { RecipeNutrition } from '@/lib/calculations/recipeCalculator'
import { useShowEnergyDensity } from '@/hooks/useShowEnergyDensity'
import { MACRO_COLORS } from '@/lib/constants/macroColors'

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
  const showEnergyDensity = useShowEnergyDensity()

  if (!nutrition || nutrition.totalCalories === 0) {
    return (
      <div className="bg-neutral-50 rounded-xl p-6 text-center dark:bg-neutral-900">
        <p className="text-neutral-500 text-sm dark:text-neutral-400">{t('nutrition.empty')}</p>
      </div>
    )
  }

  const colorBadgeClass = {
    Green:
      'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/25 dark:text-green-300 dark:border-green-800',
    Yellow:
      'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/25 dark:text-yellow-300 dark:border-yellow-800',
    Orange:
      'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/25 dark:text-orange-300 dark:border-orange-800',
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
          fiber: nutrition.per100g.fiber,
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
          fiber: nutrition.perServing.fiber,
          weight: nutrition.perServing.weight,
        }

  const totalMacroCalories =
    displayValues.protein * 4 + displayValues.carbs * 4 + displayValues.fat * 9
  const proteinPercent =
    totalMacroCalories > 0 ? ((displayValues.protein * 4) / totalMacroCalories) * 100 : 0
  const carbPercent =
    totalMacroCalories > 0 ? ((displayValues.carbs * 4) / totalMacroCalories) * 100 : 0
  const fatPercent =
    totalMacroCalories > 0 ? ((displayValues.fat * 9) / totalMacroCalories) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 dark:from-primary-900/30 dark:to-accent-900/20">
      {/* Sparas som - main highlighted section */}
      {/* bg-white/80 saknade mörk variant — panelen låg som en ljus platta
          ovanpå den mörka gradienten, med mörkanpassad text i sig. */}
      <div className="bg-white/80 rounded-xl p-4 border-2 border-primary-200 dark:bg-neutral-900/60 dark:border-primary-800">
        <h4 className="text-sm font-semibold text-primary-700 mb-3 uppercase tracking-wide flex items-center gap-2 dark:text-primary-300">
          <span>📦</span> {t('nutrition.savedAs')} {displayValues.label}
        </h4>

        {/* Calories - big display */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-primary-600 dark:text-primary-300">
            {Math.round(displayValues.calories)}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">kcal</div>
        </div>

        {/* Macros grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-50 rounded-lg p-3 text-center dark:bg-primary-900/25">
            <div className="text-lg font-semibold" style={{ color: MACRO_COLORS.fat }}>
              {displayValues.fat.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('nutrition.fat')}
            </div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center dark:bg-primary-900/25">
            <div className="text-lg font-semibold" style={{ color: MACRO_COLORS.carbs }}>
              {displayValues.carbs.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('nutrition.carbs')}
            </div>
          </div>
          <div className="bg-primary-50 rounded-lg p-3 text-center dark:bg-primary-900/25">
            <div className="text-lg font-semibold" style={{ color: MACRO_COLORS.protein }}>
              {displayValues.protein.toFixed(1)}g
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('nutrition.protein')}
            </div>
          </div>
        </div>

        {/* Macro distribution bars */}
        {totalMacroCalories > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-neutral-500 mb-1 dark:text-neutral-400">
              {t('nutrition.macroDistribution')}
            </p>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: MACRO_COLORS.fat }}>{t('nutrition.fat')}</span>
                <span className="font-medium">{Math.round(fatPercent)}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden dark:bg-neutral-700">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${fatPercent}%`, backgroundColor: MACRO_COLORS.fat }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: MACRO_COLORS.carbs }}>{t('nutrition.carbs')}</span>
                <span className="font-medium">{Math.round(carbPercent)}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden dark:bg-neutral-700">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${carbPercent}%`, backgroundColor: MACRO_COLORS.carbs }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: MACRO_COLORS.protein }}>{t('nutrition.protein')}</span>
                <span className="font-medium">{Math.round(proteinPercent)}%</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden dark:bg-neutral-700">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${proteinPercent}%`, backgroundColor: MACRO_COLORS.protein }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Optional sub-nutrients */}
        {(displayValues.saturatedFat != null ||
          displayValues.sugars != null ||
          displayValues.salt != null ||
          displayValues.fiber != null) && (
          <div className="space-y-1 text-sm mt-1">
            {displayValues.saturatedFat != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400 dark:text-neutral-500">
                  {t('nutrition.saturatedFat')}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {displayValues.saturatedFat.toFixed(1)}g
                </span>
              </div>
            )}
            {displayValues.sugars != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400 dark:text-neutral-500">
                  {t('nutrition.sugars')}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {displayValues.sugars.toFixed(1)}g
                </span>
              </div>
            )}
            {displayValues.fiber != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400 dark:text-neutral-500">
                  {t('nutrition.fiber')}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {displayValues.fiber.toFixed(1)}g
                </span>
              </div>
            )}
            {displayValues.salt != null && (
              <div className="flex justify-between pl-3">
                <span className="text-neutral-400 dark:text-neutral-500">
                  {t('nutrition.salt')}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {displayValues.salt.toFixed(1)}g
                </span>
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
            <span className="text-neutral-600 dark:text-neutral-400">
              {t('nutrition.altPer100g')}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {Math.round(nutrition.per100g.calories)} kcal
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              {t('nutrition.altPerServing')}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {Math.round(nutrition.perServing.calories)} kcal (
              {Math.round(nutrition.perServing.weight)}g)
            </span>
          </div>
        )}

        {/* Total weight */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            {t('nutrition.totalWeight')}
          </span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {Math.round(nutrition.totalWeight)}g
          </span>
        </div>

        {/* Number of servings */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            {t('nutrition.servingsCount')}
          </span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{servings}</span>
        </div>

        {/* Energy density color */}
        {showEnergyDensity && nutrition.energyDensityColor && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              {t('nutrition.energyDensity')}
            </span>
            <Badge variant="outline" className={colorBadgeClass[nutrition.energyDensityColor]}>
              {colorLabel[nutrition.energyDensityColor]}
            </Badge>
          </div>
        )}
      </div>

      {/* Total section */}
      <div className="bg-white/40 rounded-lg p-4 dark:bg-neutral-900/40">
        <h5 className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide dark:text-neutral-400">
          {t('nutrition.totalSection')}
        </h5>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-primary-600 dark:text-primary-300">
              {Math.round(nutrition.totalCalories)}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">kcal</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: MACRO_COLORS.fat }}>
              {nutrition.totalFat.toFixed(1)}g
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">F</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: MACRO_COLORS.carbs }}>
              {nutrition.totalCarbs.toFixed(1)}g
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">K</div>
          </div>
          <div>
            <div className="font-semibold" style={{ color: MACRO_COLORS.protein }}>
              {nutrition.totalProtein.toFixed(1)}g
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">P</div>
          </div>
        </div>
      </div>
    </div>
  )
}
