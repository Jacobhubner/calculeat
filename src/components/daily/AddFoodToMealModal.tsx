import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useFoodItems, type FoodItem } from '@/hooks/useFoodItems'
import { useAddFoodToMeal, useCreateMealEntry } from '@/hooks/useDailyLogs'
import { useMealSettings } from '@/hooks/useMealSettings'
import { UnitSelector, getAvailableUnits, calculateNutritionForUnit } from './UnitSelector'
import { NutritionPreview } from './NutritionPreview'
import { toast } from 'sonner'

interface PreselectedFood {
  food: FoodItem
  amount: number
  unit: string
}

interface AddFoodToMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealName: string
  mealEntryId?: string // If provided, add to existing meal entry
  dailyLogId: string
  onSuccess?: () => void
  preselectedFood?: PreselectedFood // Pre-fill form with food from sidebar tools
}

export function AddFoodToMealModal({
  open,
  onOpenChange,
  mealName,
  mealEntryId,
  dailyLogId,
  onSuccess,
  preselectedFood,
}: AddFoodToMealModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState<number>(1)
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [selectedMealName, setSelectedMealName] = useState<string>(mealName)

  // Track if food was preselected to avoid overwriting amount/unit
  const isPreselectedRef = useRef(false)
  const prevOpenRef = useRef(open)

  const { data: foods, isLoading } = useFoodItems()
  const { data: mealSettings } = useMealSettings()
  const addFoodToMeal = useAddFoodToMeal()
  const createMealEntry = useCreateMealEntry()

  // Filter foods based on search query
  const filteredFoods = useMemo(() => {
    if (!foods) return []
    if (!searchQuery.trim()) return foods.slice(0, 20) // Show first 20 foods when no search

    const query = searchQuery.toLowerCase()
    return foods
      .filter(
        food =>
          food.name.toLowerCase().includes(query) ||
          (food.brand && food.brand.toLowerCase().includes(query))
      )
      .slice(0, 20)
  }, [foods, searchQuery])

  // Reset form state - memoized to avoid recreation
  const resetForm = useCallback(() => {
    setSearchQuery('')
    setSelectedFood(null)
    setAmount(1)
    setSelectedUnit('')
    setSelectedMealName('')
    isPreselectedRef.current = false
  }, [])

  // Initialize form when modal opens
  const initializeForm = useCallback(() => {
    // Set meal name from prop or first available meal
    if (mealName) {
      setSelectedMealName(mealName)
    } else if (mealSettings && mealSettings.length > 0) {
      setSelectedMealName(mealSettings[0].meal_name)
    }

    // Pre-fill form with preselected food from sidebar tools
    if (preselectedFood) {
      isPreselectedRef.current = true
      setSelectedFood(preselectedFood.food)
      setAmount(preselectedFood.amount)
      setSelectedUnit(preselectedFood.unit)
    }
  }, [mealName, mealSettings, preselectedFood])

  // Handle modal open/close state changes
  /* eslint-disable react-hooks/set-state-in-effect -- Legitimate pattern for syncing state on open/close */
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Modal just opened
      initializeForm()
    } else if (!open && prevOpenRef.current) {
      // Modal just closed
      resetForm()
    }
    prevOpenRef.current = open
  }, [open, initializeForm, resetForm])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Calculate nutrition preview
  const nutritionPreview = useMemo(() => {
    if (!selectedFood || amount <= 0) return null
    return calculateNutritionForUnit(selectedFood, amount, selectedUnit)
  }, [selectedFood, amount, selectedUnit])

  const handleSelectFood = (food: FoodItem) => {
    isPreselectedRef.current = false // Reset flag for manual selection
    setSelectedFood(food)
    setSearchQuery('')

    // Determine display mode: first check localStorage, then use same default logic as FoodItemsPage
    const availableUnits = getAvailableUnits(food)
    let displayMode: string | null = null

    try {
      const savedMode = localStorage.getItem(`food-display-mode:${food.id}`)
      if (savedMode) {
        displayMode = (JSON.parse(savedMode) as { mode: string }).mode
      }
    } catch {
      // Ignore localStorage errors
    }

    // If no saved mode, determine default (same logic as FoodItemsPage getDefaultDisplayMode)
    if (!displayMode) {
      if (food.grams_per_piece && food.serving_unit && food.kcal_per_unit) {
        displayMode = 'serving'
      } else {
        displayMode = 'per100g'
      }
    }

    // Map display mode to unit and amount
    let defaultUnit: string
    let defaultAmount: number
    if (displayMode === 'serving') {
      defaultUnit = food.serving_unit || 'st'
      defaultAmount = 1
    } else if (displayMode === 'perVolume') {
      defaultUnit = 'ml'
      defaultAmount = 100
    } else {
      defaultUnit = 'g'
      defaultAmount = 100
    }

    // Ensure selected unit is available, fallback to first available
    if (!availableUnits.includes(defaultUnit)) {
      defaultUnit = availableUnits[0]
      defaultAmount = food.default_amount
    }

    setSelectedUnit(defaultUnit)
    setAmount(defaultAmount)
  }

  const handleAddFood = async () => {
    if (!selectedFood || !nutritionPreview || !selectedMealName) return

    try {
      let targetMealEntryId = mealEntryId

      // If no meal entry exists, create one
      if (!targetMealEntryId) {
        const mealSetting = mealSettings?.find(m => m.meal_name === selectedMealName)
        const newMealEntry = await createMealEntry.mutateAsync({
          dailyLogId,
          mealName: selectedMealName,
          mealOrder: mealSetting?.meal_order || 0,
        })
        targetMealEntryId = newMealEntry.id
      }

      await addFoodToMeal.mutateAsync({
        mealEntryId: targetMealEntryId,
        foodItemId: selectedFood.id,
        amount,
        unit: selectedUnit,
        weightGrams: nutritionPreview.weightGrams,
        calories: nutritionPreview.calories,
        protein_g: nutritionPreview.protein,
        carb_g: nutritionPreview.carbs,
        fat_g: nutritionPreview.fat,
      })

      toast.success(`${selectedFood.name} har lagts till i ${selectedMealName}`)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add food:', error)
      toast.error('Kunde inte lägga till livsmedel')
    }
  }

  const getColorBadge = (color?: string) => {
    if (!color) return null
    return (
      <Badge
        variant="outline"
        className={
          color === 'Green'
            ? 'bg-green-50 text-green-700 border-green-300'
            : color === 'Yellow'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
              : 'bg-orange-50 text-orange-700 border-orange-300'
        }
      >
        {color === 'Green' ? 'Grön' : color === 'Yellow' ? 'Gul' : 'Orange'}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Lägg till livsmedel</DialogTitle>
          <DialogDescription>
            {mealName
              ? `Lägg till livsmedel till ${mealName}`
              : 'Välj måltid och lägg till livsmedel'}
          </DialogDescription>
        </DialogHeader>

        {/* Meal selector - show when mealName is not provided (from sidebar tools) */}
        {!mealName && mealSettings && mealSettings.length > 0 && (
          <div className="space-y-2">
            <Label>Välj måltid</Label>
            <Select
              value={selectedMealName}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedMealName(e.target.value)
              }
            >
              {mealSettings.map(meal => (
                <option key={meal.id} value={meal.meal_name}>
                  {meal.meal_name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4">
          {!selectedFood ? (
            <>
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Sök livsmedel..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Food list */}
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  <p className="text-sm text-neutral-500 text-center py-4">Laddar livsmedel...</p>
                ) : filteredFoods.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    {searchQuery ? 'Inga livsmedel hittades' : 'Inga livsmedel'}
                  </p>
                ) : (
                  filteredFoods.map(food => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left border border-transparent hover:border-neutral-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{food.name}</p>
                        <p className="text-xs text-neutral-500">
                          {food.calories} kcal / {food.default_amount} {food.default_unit}
                          {food.brand && ` • ${food.brand}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {getColorBadge(food.energy_density_color)}
                        <Plus className="h-4 w-4 text-neutral-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected food header */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{selectedFood.name}</p>
                  <p className="text-xs text-neutral-500">
                    {selectedFood.calories} kcal / {selectedFood.default_amount}{' '}
                    {selectedFood.default_unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getColorBadge(selectedFood.energy_density_color)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFood(null)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Amount and unit selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Mängd</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Enhet</Label>
                  <UnitSelector
                    food={selectedFood}
                    value={selectedUnit}
                    onChange={setSelectedUnit}
                    className="mt-1 w-full"
                  />
                </div>
              </div>

              {/* Nutrition preview */}
              {nutritionPreview && (
                <NutritionPreview
                  calories={nutritionPreview.calories}
                  protein={nutritionPreview.protein}
                  carbs={nutritionPreview.carbs}
                  fat={nutritionPreview.fat}
                  weightGrams={nutritionPreview.weightGrams}
                  energyDensityColor={selectedFood.energy_density_color}
                />
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          {selectedFood && (
            <Button
              onClick={handleAddFood}
              disabled={!nutritionPreview || addFoodToMeal.isPending || createMealEntry.isPending}
            >
              {addFoodToMeal.isPending || createMealEntry.isPending
                ? 'Lägger till...'
                : 'Lägg till'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
