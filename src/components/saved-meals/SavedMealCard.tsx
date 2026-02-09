import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarPlus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { SavedMeal } from '@/hooks/useSavedMeals'
import { useDeleteSavedMeal } from '@/hooks/useSavedMeals'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SavedMealCardProps {
  meal: SavedMeal
  onUseToday: (mealId: string) => void
  onEdit?: (mealId: string) => void
}

export default function SavedMealCard({ meal, onUseToday, onEdit }: SavedMealCardProps) {
  const [showItems, setShowItems] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteMeal = useDeleteSavedMeal()

  // Calculate totals
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    itemCount: meal.items?.length || 0,
  }

  if (meal.items && meal.items.length > 0) {
    meal.items.forEach(item => {
      const foodItem = item.food_item
      if (!foodItem) return

      const caloriesPer100g = foodItem.calories || 0
      const proteinPer100g = foodItem.protein_g || 0
      const carbsPer100g = foodItem.carb_g || 0
      const fatPer100g = foodItem.fat_g || 0

      const grams = item.weight_grams || item.amount * 100
      const multiplier = grams / 100

      totals.calories += caloriesPer100g * multiplier
      totals.protein += proteinPer100g * multiplier
      totals.carbs += carbsPer100g * multiplier
      totals.fat += fatPer100g * multiplier
    })
  }

  const handleDelete = async () => {
    try {
      await deleteMeal.mutateAsync(meal.id)
      toast.success(`${meal.name} har tagits bort`)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting meal:', error)
      toast.error('Kunde inte ta bort måltiden. Försök igen.')
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg truncate flex-1">{meal.name}</CardTitle>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onEdit(meal.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="flex items-center gap-3 text-sm text-neutral-600 mt-2">
            <span className="font-semibold text-primary-600">
              {Math.round(totals.calories)} kcal
            </span>
            <span>•</span>
            <span>{totals.itemCount} matvara{totals.itemCount !== 1 ? 'r' : ''}</span>
          </div>

          {/* Macros */}
          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
            <span>P: {totals.protein.toFixed(1)}g</span>
            <span>K: {totals.carbs.toFixed(1)}g</span>
            <span>F: {totals.fat.toFixed(1)}g</span>
          </div>

          {/* Last Used */}
          {meal.last_used_at && (
            <p className="text-xs text-neutral-400 mt-2">
              Senast använd:{' '}
              {new Date(meal.last_used_at).toLocaleDateString('sv-SE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* Use Today Button */}
          <Button
            className="w-full gap-2 bg-gradient-to-r from-primary-600 to-primary-500 mb-3"
            size="sm"
            onClick={() => onUseToday(meal.id)}
          >
            <CalendarPlus className="h-4 w-4" />
            Använd idag
          </Button>

          {/* Toggle Items */}
          {totals.itemCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-neutral-600"
              onClick={() => setShowItems(!showItems)}
            >
              {showItems ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Dölj matvaror
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Visa matvaror ({totals.itemCount})
                </>
              )}
            </Button>
          )}

          {/* Items List */}
          {showItems && meal.items && meal.items.length > 0 && (
            <div className="mt-3 border-t pt-3 space-y-2 max-h-60 overflow-y-auto">
              {meal.items.map(item => {
                const foodItem = item.food_item
                return (
                  <div
                    key={item.id}
                    className="p-2 bg-neutral-50 rounded text-sm flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {foodItem?.name || 'Okänd matvara'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.amount} {item.unit}
                      </p>
                    </div>
                    {foodItem && (
                      <span className="text-xs text-neutral-600 shrink-0 ml-2">
                        {Math.round(
                          (foodItem.calories * (item.weight_grams || item.amount * 100)) / 100
                        )}{' '}
                        kcal
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort sparad måltid?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort &quot;{meal.name}&quot;? Detta går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMeal.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMeal.isPending ? 'Tar bort...' : 'Ta bort'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
