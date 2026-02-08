import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { MealEntry } from '@/hooks/useDailyLogs'
import { useCreateSavedMeal, useSavedMeals, useDeleteSavedMeal } from '@/hooks/useSavedMeals'
import { generateDefaultMealName, transformMealToSavedMeal } from '@/lib/meal-utils'

interface SaveMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealEntry: MealEntry
}

export default function SaveMealDialog({ open, onOpenChange, mealEntry }: SaveMealDialogProps) {
  const [mealName, setMealName] = useState('')
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [duplicateMealId, setDuplicateMealId] = useState<string | null>(null)

  const createSavedMeal = useCreateSavedMeal()
  const deleteSavedMeal = useDeleteSavedMeal()
  const { data: existingMeals } = useSavedMeals()

  // Generate default name when dialog opens
  useEffect(() => {
    if (open && mealEntry) {
      setMealName(generateDefaultMealName(mealEntry.meal_name))
      setShowDuplicateWarning(false)
      setDuplicateMealId(null)
    }
  }, [open, mealEntry])

  const handleSave = async () => {
    const trimmedName = mealName.trim()

    // Validation: empty name
    if (!trimmedName) {
      toast.error('Ange ett namn på måltiden')
      return
    }

    // Validation: name too long
    if (trimmedName.length > 50) {
      toast.error('Namnet får vara max 50 tecken')
      return
    }

    // Check for duplicate name (case-insensitive)
    const duplicateMeal = existingMeals?.find(
      meal => meal.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (duplicateMeal && !showDuplicateWarning) {
      // Show warning first time
      setShowDuplicateWarning(true)
      setDuplicateMealId(duplicateMeal.id)
      return
    }

    // Save the meal
    try {
      // If replacing, delete old meal first
      if (showDuplicateWarning && duplicateMealId) {
        await deleteSavedMeal.mutateAsync(duplicateMealId)
      }

      // Transform and create new meal
      const input = transformMealToSavedMeal(mealEntry, trimmedName)
      await createSavedMeal.mutateAsync(input)

      toast.success(`${trimmedName} har sparats!`)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving meal:', error)
      toast.error('Kunde inte spara måltiden. Försök igen.')
    }
  }

  const handleChooseDifferentName = () => {
    setShowDuplicateWarning(false)
    setDuplicateMealId(null)
    // Focus input for editing
  }

  const handleCancel = () => {
    setShowDuplicateWarning(false)
    setDuplicateMealId(null)
    onOpenChange(false)
  }

  const isLoading = createSavedMeal.isPending || deleteSavedMeal.isPending
  const hasItems = mealEntry?.items && mealEntry.items.length > 0

  // Calculate totals
  const totals = {
    calories: mealEntry?.meal_calories || 0,
    protein: mealEntry?.meal_protein_g || 0,
    carbs: mealEntry?.meal_carb_g || 0,
    fat: mealEntry?.meal_fat_g || 0,
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-lg md:max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Spara måltid</DialogTitle>
          <DialogDescription>
            Spara denna måltid för snabb loggning i framtiden
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="meal-name" className="block text-sm font-medium text-neutral-700 mb-2">
              Namn på måltiden
            </label>
            <Input
              id="meal-name"
              type="text"
              value={mealName}
              onChange={e => setMealName(e.target.value)}
              placeholder="T.ex. Proteinfrukost, Chipotle bowl, Smoothie"
              maxLength={50}
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Duplicate Warning */}
          {showDuplicateWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    En måltid med namnet &quot;{mealName.trim()}&quot; finns redan
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Vill du ersätta den befintliga måltiden med denna?
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Food Items Preview */}
          <div>
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Matvaror ({mealEntry?.items?.length || 0})
            </h3>
            <div className="border rounded-lg bg-neutral-50 max-h-60 overflow-y-auto">
              {hasItems ? (
                <div className="divide-y">
                  {mealEntry.items.map(item => {
                    const foodItem = item.food_item
                    return (
                      <div key={item.id} className="p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 truncate">
                              {foodItem?.name || 'Okänd matvara'}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {item.amount} {item.unit}
                            </p>
                          </div>
                          <span className="text-xs text-neutral-600 shrink-0">
                            {item.calories} kcal
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-400 text-sm">
                  Inga matvaror i måltiden
                </div>
              )}
            </div>
          </div>

          {/* Totals Summary */}
          {hasItems && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-700">Totalt:</span>
                <div className="flex gap-3 text-neutral-600">
                  <span className="font-semibold text-primary-600">{Math.round(totals.calories)} kcal</span>
                  <span>P: {totals.protein.toFixed(1)}g</span>
                  <span>K: {totals.carbs.toFixed(1)}g</span>
                  <span>F: {totals.fat.toFixed(1)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t">
          {showDuplicateWarning ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Avbryt
              </Button>
              <Button variant="outline" onClick={handleChooseDifferentName} disabled={isLoading}>
                Välj annat namn
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Ersätter...' : 'Ersätt'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !hasItems}>
                {isLoading ? 'Sparar...' : 'Spara'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
