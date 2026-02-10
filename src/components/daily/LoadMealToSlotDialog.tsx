import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSavedMeals, useLoadSavedMealToSlot } from '@/hooks/useSavedMeals'
import EmptyState from '../EmptyState'

interface LoadMealToSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetMealName: string
  targetMealOrder: number
  dailyLogId: string
  targetMealEntryId?: string
}

export default function LoadMealToSlotDialog({
  open,
  onOpenChange,
  targetMealName,
  targetMealOrder,
  dailyLogId,
  targetMealEntryId,
}: LoadMealToSlotDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMealId, setLoadingMealId] = useState<string | null>(null)

  const { data: savedMeals, isLoading: mealsLoading } = useSavedMeals()
  const loadMeal = useLoadSavedMealToSlot()

  // Filter saved meals by search query
  const filteredMeals = useMemo(() => {
    if (!savedMeals) return []
    if (!searchQuery.trim()) return savedMeals

    const query = searchQuery.toLowerCase()
    return savedMeals.filter(meal => meal.name.toLowerCase().includes(query))
  }, [savedMeals, searchQuery])

  // Sort by last used date (most recent first), then alphabetically
  const sortedMeals = useMemo(() => {
    return [...filteredMeals].sort((a, b) => {
      // Sort by last_used_at (most recent first)
      if (a.last_used_at && b.last_used_at) {
        return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime()
      }
      if (a.last_used_at) return -1
      if (b.last_used_at) return 1

      // Then alphabetically
      return a.name.localeCompare(b.name, 'sv-SE')
    })
  }, [filteredMeals])

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

      // Success feedback
      if (result.missingCount > 0) {
        toast.warning(
          `${result.missingCount} matvara${result.missingCount > 1 ? 'r' : ''} kunde inte hittas och hoppades över`
        )
      }

      toast.success(`${mealName} laddad till ${targetMealName}! (+${result.totalCalories} kcal)`)

      // Close modal
      onOpenChange(false)

      // Scroll to meal card (optional enhancement)
      setTimeout(() => {
        const mealCard = document.querySelector(`[data-meal-name="${targetMealName}"]`)
        if (mealCard) {
          mealCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    } catch (error) {
      console.error('Error loading saved meal:', error)
      toast.error('Kunde inte ladda måltid. Försök igen.')
    } finally {
      setLoadingMealId(null)
    }
  }

  // Calculate meal totals for display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMealTotals = (meal: any) => {
    if (!meal.items || meal.items.length === 0) {
      return { calories: 0, itemCount: 0 }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calories = meal.items.reduce((sum: number, item: any) => {
      const foodItem = item.food_item
      if (!foodItem) return sum
      const caloriesPer100g = foodItem.calories || 0
      const grams = item.weight_grams || item.amount * 100
      return sum + (caloriesPer100g * grams) / 100
    }, 0)

    return {
      calories: Math.round(calories),
      itemCount: meal.items.length,
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl md:max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ladda måltid till {targetMealName}</DialogTitle>
          <DialogDescription>Välj en sparad måltid att lägga till</DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Sök efter sparade måltider..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Saved Meals List */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {mealsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : sortedMeals.length === 0 ? (
            <EmptyState
              icon={Search}
              title={searchQuery ? 'Inga måltider hittades' : 'Inga sparade måltider ännu'}
              description={
                searchQuery
                  ? 'Försök med ett annat sökord'
                  : 'Spara en måltid från Dagens logg för att komma igång'
              }
            />
          ) : (
            <div className="space-y-2">
              {sortedMeals.map(meal => {
                const { calories, itemCount } = getMealTotals(meal)
                const isLoading = loadingMealId === meal.id

                return (
                  <Card
                    key={meal.id}
                    className={`cursor-pointer transition-all hover:border-primary-300 hover:bg-primary-50 ${
                      isLoading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                    onClick={() => handleLoadMeal(meal.id, meal.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 truncate">{meal.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                            <span className="font-semibold text-primary-600">{calories} kcal</span>
                            <span>•</span>
                            <span>
                              {itemCount} matvara{itemCount !== 1 ? 'r' : ''}
                            </span>
                            {meal.last_used_at && (
                              <>
                                <span>•</span>
                                <span className="text-xs text-neutral-500">
                                  Senast använd:{' '}
                                  {new Date(meal.last_used_at).toLocaleDateString('sv-SE', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {isLoading && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary-600 ml-3 shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
