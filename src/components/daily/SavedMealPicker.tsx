import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import EmptyState from '../EmptyState'
import { useSavedMeals, useLoadSavedMealToSlot } from '@/hooks/useSavedMeals'
import { calculateNutritionForUnit } from '@/lib/calculations/nutritionFromUnit'
import type { FoodItem } from '@/hooks/useFoodItems'

interface SavedMealPickerProps {
  /** Måltidsplatsen som den sparade måltiden laddas in i. */
  targetMealName: string
  targetMealOrder: number
  targetMealEntryId?: string
  dailyLogId: string
  /** Anropas när en måltid laddats — stänger den omgivande modalen. */
  onLoaded: () => void
}

/**
 * Väljare för sparade måltider, avsedd att ligga som ett läge inuti
 * AddFoodToMealModal.
 *
 * Sparade måltider gick tidigare bara att nå via LoadMealToSlotDialog, som
 * öppnades från en egen knapp i måltidsrubriken. Det innebar att den globala
 * "+"-knappen i mobilnavigeringen inte kunde ladda en måltid alls — bara
 * enskilda livsmedel. Genom att flytta in listan här får båda ingångarna
 * samma innehåll.
 *
 * Logiken är avsiktligt densamma som i LoadMealToSlotDialog (samma hook, samma
 * sortering) så att de två vyerna inte kan glida isär.
 */
export function SavedMealPicker({
  targetMealName,
  targetMealOrder,
  targetMealEntryId,
  dailyLogId,
  onLoaded,
}: SavedMealPickerProps) {
  const { t } = useTranslation('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMealId, setLoadingMealId] = useState<string | null>(null)

  const { data: savedMeals, isLoading } = useSavedMeals()
  const loadMeal = useLoadSavedMealToSlot()

  // Senast använda först — den måltid man åt igår är den troligaste kandidaten
  const sortedMeals = useMemo(() => {
    if (!savedMeals) return []
    const query = searchQuery.trim().toLowerCase()
    const filtered = query
      ? savedMeals.filter(meal => meal.name.toLowerCase().includes(query))
      : savedMeals

    return [...filtered].sort((a, b) => {
      if (a.last_used_at && b.last_used_at) {
        return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
      }
      if (a.last_used_at) return -1
      if (b.last_used_at) return 1
      return a.name.localeCompare(b.name, 'sv-SE')
    })
  }, [savedMeals, searchQuery])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMealTotals = (meal: any) => {
    if (!meal.items || meal.items.length === 0) return { calories: 0, itemCount: 0 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calories = meal.items.reduce((sum: number, item: any) => {
      const foodItem = item.food_item
      if (!foodItem) return sum
      const nutrition = calculateNutritionForUnit(foodItem as FoodItem, item.amount, item.unit)
      return sum + (nutrition?.calories ?? 0)
    }, 0)
    return { calories: Math.round(calories), itemCount: meal.items.length }
  }

  const handleLoadMeal = async (mealId: string, mealName: string) => {
    setLoadingMealId(mealId)
    try {
      const result = await loadMeal.mutateAsync({
        savedMealId: mealId,
        targetMealName,
        dailyLogId,
        targetMealEntryId,
        mealOrder: targetMealOrder,
      })

      if (result.missingCount > 0) {
        toast.warning(t('loadMeal.warningMissingItems', { count: result.missingCount }))
      }
      toast.success(
        t('loadMeal.successLoaded', {
          mealName,
          slotName: targetMealName,
          calories: result.totalCalories,
        })
      )
      onLoaded()
    } catch (error) {
      console.error('Error loading saved meal:', error)
      toast.error(t('loadMeal.errorLoadFailed'))
    } finally {
      setLoadingMealId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
        <Input
          placeholder={t('loadMealDialog.searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-300" />
        </div>
      ) : sortedMeals.length === 0 ? (
        <EmptyState
          icon={Search}
          title={
            searchQuery ? t('loadMealDialog.emptySearchTitle') : t('loadMealDialog.emptyTitle')
          }
          description={
            searchQuery
              ? t('loadMealDialog.emptySearchDescription')
              : t('loadMealDialog.emptyDescription')
          }
        />
      ) : (
        <div className="space-y-2">
          {sortedMeals.map(meal => {
            const { calories, itemCount } = getMealTotals(meal)
            const isLoadingThis = loadingMealId === meal.id

            return (
              <Card
                key={meal.id}
                className={`cursor-pointer transition-all hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${
                  isLoadingThis ? 'opacity-50 pointer-events-none' : ''
                }`}
                onClick={() => handleLoadMeal(meal.id, meal.name)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 truncate dark:text-neutral-100">
                        {meal.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="font-semibold text-primary-600 dark:text-primary-300">
                          {calories} kcal
                        </span>
                        <span>•</span>
                        <span>{t('loadMealDialog.itemCount', { count: itemCount })}</span>
                      </div>
                    </div>
                    {isLoadingThis && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary-600 shrink-0 dark:text-primary-300" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
