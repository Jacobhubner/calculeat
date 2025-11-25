/**
 * Recent Foods Card Component
 * Displays recently logged food items with quick-add functionality
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecentFoodItems } from '@/hooks/useRecentFoodItems'
import { useAddFoodToMeal, useCreateMealEntry } from '@/hooks/useDailyLogs'
import { Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface RecentFoodsCardProps {
  dailyLogId?: string
  onAddFood?: () => void
}

export default function RecentFoodsCard({ dailyLogId, onAddFood }: RecentFoodsCardProps) {
  const { data: recentFoods, isLoading } = useRecentFoodItems(6)
  const createMealEntry = useCreateMealEntry()
  const addFoodToMeal = useAddFoodToMeal()

  const handleQuickAdd = async (
    foodItemId: string,
    foodName: string,
    defaultAmount: number,
    defaultUnit: string
  ) => {
    if (!dailyLogId) {
      toast.error('Ingen daglig logg hittades')
      return
    }

    try {
      // Create a quick meal entry called "Snabbtillagt"
      const mealEntry = await createMealEntry.mutateAsync({
        dailyLogId,
        mealName: 'Snabbtillagt',
        mealOrder: 999, // Put at the end
      })

      // Add the food item with default amount
      await addFoodToMeal.mutateAsync({
        mealEntryId: mealEntry.id,
        foodItemId,
        amount: defaultAmount,
        unit: defaultUnit,
      })

      toast.success(`${foodName} har lagts till!`)
      onAddFood?.()
    } catch (error) {
      console.error('Error adding food:', error)
      toast.error('Kunde inte lägga till maten')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Senaste matvaror
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!recentFoods || recentFoods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Senaste matvaror
          </CardTitle>
          <CardDescription>Matvaror du loggat de senaste 7 dagarna visas här</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-neutral-400 text-sm">
            Inga matvaror loggade de senaste 7 dagarna
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary-600" />
          Senaste matvaror
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Klicka för att snabbt lägga till med standardportion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentFoods.map(food => (
          <div
            key={food.id}
            className="flex items-center justify-between gap-2 p-2 md:p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2">
                <p className="font-medium text-sm md:text-base text-neutral-900 truncate">
                  {food.name}
                </p>
                {food.brand && (
                  <span className="hidden md:inline text-xs text-neutral-500 truncate">
                    ({food.brand})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 md:gap-3 mt-1 text-xs text-neutral-600">
                <span>
                  {food.default_amount} {food.default_unit}
                </span>
                <span className="hidden md:inline">•</span>
                <span>{food.calories} kcal</span>
                <span className="hidden sm:flex items-center gap-1">
                  <span className="hidden md:inline">•</span>
                  P: {food.protein_g}g | K: {food.carb_g}g | F: {food.fat_g}g
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="ml-1 md:ml-2 shrink-0 h-8 w-8 md:h-9 md:w-9 p-0"
              onClick={() =>
                handleQuickAdd(food.id, food.name, food.default_amount, food.default_unit)
              }
              disabled={!dailyLogId || createMealEntry.isPending || addFoodToMeal.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
