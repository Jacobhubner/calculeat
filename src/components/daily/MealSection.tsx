import { useTranslation } from 'react-i18next'
import { Plus, Bookmark, ArrowDownToLine, Trash2, Coffee, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SwipeableItem } from '@/components/ui/SwipeableItem'
import { MealProgressBar } from '@/components/daily/RangeProgressBar'
import { MealMacroBreakdown } from '@/components/daily/MealMacroBreakdown'
import type { MealEntry, MealEntryItem } from '@/hooks/useDailyLogs'
import type { FoodItem } from '@/hooks/useFoodItems'

interface EditItem {
  itemId: string
  food: FoodItem
  amount: number
  unit: string
}

interface MealSectionProps {
  mealEntry?: MealEntry
  mealName: string
  isFirst?: boolean
  targetPct?: number
  goalCaloriesMin: number
  goalCalories: number
  isCompleted: boolean
  onAddFood: (mealName: string, mealEntryId?: string) => void
  onSaveMeal?: (mealEntry: MealEntry) => void
  onLoadMeal?: (mealName: string, mealOrder: number, mealEntryId?: string) => void
  mealOrder: number
  onRemoveFood: (itemId: string, foodName: string) => void
  onEditItem: (item: EditItem) => void
  removeFoodPending: boolean
}

export function MealSection({
  mealEntry,
  mealName,
  isFirst = false,
  targetPct,
  goalCaloriesMin,
  goalCalories,
  isCompleted,
  onAddFood,
  onSaveMeal,
  onLoadMeal,
  mealOrder,
  onRemoveFood,
  onEditItem,
  removeFoodPending,
}: MealSectionProps) {
  const { t } = useTranslation('today')

  const hasItems = Boolean(mealEntry?.items && mealEntry.items.length > 0)
  const mealCurrentCalories = mealEntry?.meal_calories || 0
  const mealTotalWeight =
    mealEntry?.items?.reduce(
      (sum: number, item: MealEntryItem) => sum + (item.weight_grams || 0),
      0
    ) || 0

  const mealTargetMin = targetPct ? Math.round((goalCaloriesMin * targetPct) / 100) : undefined
  const mealTargetMax = targetPct ? Math.round((goalCalories * targetPct) / 100) : undefined

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {isFirst ? (
              <Coffee className="h-5 w-5 text-primary-600 shrink-0" />
            ) : (
              <UtensilsCrossed className="h-5 w-5 text-accent-600 shrink-0" />
            )}
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{mealName}</CardTitle>
              <CardDescription className="truncate">
                {hasItems
                  ? t('today.mealItemCount', { count: mealEntry?.items?.length ?? 0 })
                  : targetPct
                    ? t('today.mealPercentage', { pct: targetPct })
                    : t('adHoc.label')}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            {hasItems && mealEntry && onSaveMeal && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 px-2 md:px-3"
                onClick={() => onSaveMeal(mealEntry)}
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden md:inline">{t('today.saveMeal')}</span>
              </Button>
            )}
            {!isCompleted && onLoadMeal && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 px-2 md:px-3 border-primary-300 text-primary-700"
                onClick={() => onLoadMeal(mealName, mealOrder, mealEntry?.id)}
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span className="hidden md:inline">{t('today.loadMeal')}</span>
              </Button>
            )}
            {!isCompleted && (
              <Button
                size="sm"
                className="gap-1.5 px-2 md:px-3"
                onClick={() => onAddFood(mealName, mealEntry?.id)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('today.addFood')}</span>
              </Button>
            )}
          </div>
        </div>
        {mealTargetMin != null && mealTargetMax != null ? (
          <MealProgressBar
            current={mealCurrentCalories}
            targetMin={mealTargetMin}
            targetMax={mealTargetMax}
          />
        ) : (
          // Ad hoc: visa enkel kcal-summering istället för progress bar
          <div className="text-xs text-neutral-400 mt-1">
            {mealCurrentCalories > 0 && `${mealCurrentCalories} kcal`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="space-y-2">
            {(mealEntry!.items ?? []).map((item: MealEntryItem) => {
              const foodItem = item.food_item as FoodItem | null
              return (
                <SwipeableItem
                  key={item.id}
                  onSwipeLeft={
                    isCompleted
                      ? undefined
                      : () => onRemoveFood(item.id, foodItem?.name || t('today.defaultFoodName'))
                  }
                >
                  <div
                    className={`w-full flex items-center justify-between p-3 bg-neutral-50 rounded-lg group transition-colors text-left ${isCompleted ? 'cursor-default' : 'hover:bg-neutral-100 cursor-pointer'}`}
                    onClick={() => {
                      if (foodItem && !isCompleted) {
                        onEditItem({
                          itemId: item.id,
                          food: foodItem,
                          amount: item.amount,
                          unit: item.unit,
                        })
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-neutral-900 text-sm md:text-base truncate min-w-0">
                          {foodItem?.name || t('today.unknownFood')}
                        </p>
                        {foodItem?.brand && (
                          <span className="text-xs text-neutral-500 hidden sm:inline shrink-0">
                            ({foodItem.brand})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-neutral-600">
                        <span>
                          {item.amount} {item.unit}
                        </span>
                        <span>•</span>
                        <span>{item.calories} kcal</span>
                        <span>•</span>
                        <span>
                          F: {item.fat_g}g | K: {item.carb_g}g | P: {item.protein_g}g
                        </span>
                      </div>
                    </div>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={e => {
                          e.stopPropagation()
                          onRemoveFood(item.id, foodItem?.name || t('today.defaultFoodName'))
                        }}
                        disabled={removeFoodPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </SwipeableItem>
              )
            })}
            <div className="pt-3 border-t flex flex-wrap gap-x-4 gap-y-1 justify-between text-sm min-w-0">
              <span className="font-medium text-neutral-700 shrink-0">{t('today.total')}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-600 min-w-0">
                <span>{mealEntry!.meal_calories} kcal</span>
                <span>F: {mealEntry!.meal_fat_g}g</span>
                <span>K: {mealEntry!.meal_carb_g}g</span>
                <span>P: {mealEntry!.meal_protein_g}g</span>
              </div>
            </div>
            {mealEntry!.meal_calories > 0 && (
              <MealMacroBreakdown
                fat={mealEntry!.meal_fat_g || 0}
                carbs={mealEntry!.meal_carb_g || 0}
                protein={mealEntry!.meal_protein_g || 0}
                totalWeight={mealTotalWeight}
                className="mt-2"
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400 text-sm">
            {t('today.noFoodItemsYet')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
