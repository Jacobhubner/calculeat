import { useTranslation } from 'react-i18next'
import { Plus, BookmarkPlus, FolderDown, Trash2, Coffee, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SwipeableItem } from '@/components/ui/SwipeableItem'
import { MealProgressBar } from '@/components/daily/RangeProgressBar'
import { MealMacroBreakdown } from '@/components/daily/MealMacroBreakdown'
import { cn } from '@/lib/utils'
import type { MealEntry, MealEntryItem } from '@/hooks/useDailyLogs'
import type { FoodItem } from '@/hooks/useFoodItems'

/**
 * Måltidsrubrikens tre åtgärdsknappar.
 *
 * På telefon står etiketten under ikonen; från md går knappen tillbaka till
 * ikon + text på rad. `h-auto` krävs eftersom size="sm" låser höjden till h-9,
 * vilket klipper den staplade texten.
 */
const STACKED_ACTION_CLASS =
  'h-auto flex-col gap-1 px-2 py-1.5 md:h-9 md:flex-row md:gap-1.5 md:px-3 md:py-0'

/** text-[11px] håller tre knappar inom ~390 px utan att radbrytas. */
const ACTION_LABEL_CLASS = 'text-[11px] leading-none font-medium md:text-sm'

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
    <Card variant="gradient">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {isFirst ? (
              <Coffee className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0" />
            ) : (
              <UtensilsCrossed className="h-5 w-5 text-accent-600 dark:text-accent-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-neutral-950 dark:text-neutral-100 truncate">
                {mealName}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                {hasItems
                  ? t('today.mealItemCount', { count: mealEntry?.items?.length ?? 0 })
                  : targetPct
                    ? t('today.mealPercentage', { pct: targetPct })
                    : t('adHoc.label')}
              </p>
            </div>
          </div>
          {/* Etiketterna staplas under ikonerna på telefon i stället för att
              döljas. Bookmark och nedåtpil är inte gissningsbara i en
              måltidsrubrik — pil-mot-linje läses som "ladda ner", inte som
              "hämta en sparad måltid hit". Från md ligger de på rad igen. */}
          <div className="flex items-start gap-1.5 md:gap-3 shrink-0">
            {hasItems && mealEntry && onSaveMeal && (
              <Button
                size="sm"
                variant="outline"
                className={STACKED_ACTION_CLASS}
                // Full text som tillgängligt namn — den synliga etiketten är
                // förkortad på telefon och "Spara" ensamt säger inte vad.
                aria-label={t('today.saveMeal')}
                onClick={() => onSaveMeal(mealEntry)}
              >
                <BookmarkPlus className="h-4 w-4 shrink-0" />
                <span className={ACTION_LABEL_CLASS}>
                  <span className="md:hidden">{t('today.saveMealShort')}</span>
                  <span className="hidden md:inline">{t('today.saveMeal')}</span>
                </span>
              </Button>
            )}
            {!isCompleted && onLoadMeal && (
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  STACKED_ACTION_CLASS,
                  'border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                )}
                aria-label={t('today.loadMeal')}
                onClick={() => onLoadMeal(mealName, mealOrder, mealEntry?.id)}
              >
                <FolderDown className="h-4 w-4 shrink-0" />
                <span className={ACTION_LABEL_CLASS}>
                  <span className="md:hidden">{t('today.loadMealShort')}</span>
                  <span className="hidden md:inline">{t('today.loadMeal')}</span>
                </span>
              </Button>
            )}
            {!isCompleted && (
              <Button
                size="sm"
                className={STACKED_ACTION_CLASS}
                // Sidan har flera måltider — "Lägg till" ensamt räcker inte
                // när en skärmläsare stegar mellan rubrikerna.
                aria-label={`${t('today.addFood')} — ${mealName}`}
                onClick={() => onAddFood(mealName, mealEntry?.id)}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className={ACTION_LABEL_CLASS}>{t('today.addFood')}</span>
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
          <div className="text-xs text-neutral-400 dark:text-neutral-400 mt-1">
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
                    className={`w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg group transition-colors text-left ${isCompleted ? 'cursor-default' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'}`}
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
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm md:text-base truncate min-w-0">
                          {foodItem?.name || t('today.unknownFood')}
                        </p>
                        {foodItem?.brand && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline shrink-0">
                            ({foodItem.brand})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-neutral-600 dark:text-neutral-300">
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
                        className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/25"
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
            <div className="pt-3 border-t dark:border-neutral-700 flex flex-wrap gap-x-4 gap-y-1 justify-between text-sm min-w-0">
              <span className="font-medium text-neutral-700 dark:text-neutral-300 shrink-0">
                {t('today.total')}
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-600 dark:text-neutral-300 min-w-0">
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
          <div className="text-center py-8 text-neutral-400 dark:text-neutral-400 text-sm">
            {t('today.noFoodItemsYet')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
