import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
import {
  usePaginatedFoodItems,
  type FoodItem,
  type FoodTab,
  type FoodSource,
} from '@/hooks/useFoodItems'
import { useAddFoodToMeal, useCreateMealEntry, useUpdateMealItem } from '@/hooks/useDailyLogs'
import { useMealSettings } from '@/hooks/useMealSettings'
import { UnitSelector, getAvailableUnits, calculateNutritionForUnit } from './UnitSelector'
import { NutritionPreview } from './NutritionPreview'
import { toast } from 'sonner'

const SOURCE_BADGES: Record<FoodSource, { label: string; className: string }> = {
  user: { label: 'Min', className: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
  manual: { label: 'CalculEat', className: 'bg-purple-100 text-purple-700 border-purple-300' },
  livsmedelsverket: { label: 'SLV', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  usda: { label: 'USDA', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
}

const TABS: { key: FoodTab; label: string }[] = [
  { key: 'mina', label: 'Mina' },
  { key: 'slv', label: 'SLV' },
  { key: 'usda', label: 'USDA' },
]

const PAGE_SIZE = 50

interface PreselectedFood {
  food: FoodItem
  amount: number
  unit: string
}

interface EditItemData {
  itemId: string
  food: FoodItem
  amount: number
  unit: string
}

interface AddFoodToMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealName: string
  mealEntryId?: string
  dailyLogId: string
  onSuccess?: () => void
  preselectedFood?: PreselectedFood
  editItem?: EditItemData
}

export function AddFoodToMealModal({
  open,
  onOpenChange,
  mealName,
  mealEntryId,
  dailyLogId,
  onSuccess,
  preselectedFood,
  editItem,
}: AddFoodToMealModalProps) {
  const isEditMode = !!editItem

  // Food-selection state
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(
    editItem?.food ?? preselectedFood?.food ?? null
  )
  const [amount, setAmount] = useState<number | ''>(
    editItem?.amount ?? preselectedFood?.amount ?? 1
  )
  const [selectedUnit, setSelectedUnit] = useState<string>(
    editItem?.unit ?? preselectedFood?.unit ?? ''
  )
  const [selectedMealName, setSelectedMealName] = useState<string>(mealName)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Tab + pagination + filter state
  const [activeTab, setActiveTab] = useState<FoodTab>('mina')
  const [page, setPage] = useState(0)
  const [colorFilter, setColorFilter] = useState<'Green' | 'Yellow' | 'Orange' | null>(null)

  // Refs
  const isPreselectedRef = useRef(false)
  const prevOpenRef = useRef(open)

  // Hooks
  const { data: mealSettings } = useMealSettings()
  const addFoodToMeal = useAddFoodToMeal()
  const createMealEntry = useCreateMealEntry()
  const updateMealItem = useUpdateMealItem()

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page on tab/search/filter change
  /* eslint-disable react-hooks/set-state-in-effect -- Legitimate pattern for resetting pagination state */
  useEffect(() => {
    setPage(0)
  }, [activeTab, debouncedSearch, colorFilter])

  // Reset colorFilter on tab change
  useEffect(() => {
    setColorFilter(null)
  }, [activeTab])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Paginated data via RPC
  const { data: paginatedData, isLoading: foodsLoading } = usePaginatedFoodItems({
    tab: activeTab,
    page,
    pageSize: PAGE_SIZE,
    searchQuery: debouncedSearch || undefined,
    colorFilter: colorFilter || undefined,
  })

  const foods = paginatedData?.items ?? []
  const totalPages = paginatedData?.totalPages ?? 0

  // Page clamping
  /* eslint-disable react-hooks/set-state-in-effect -- Legitimate pattern for clamping page on data change */
  useEffect(() => {
    if (paginatedData && page >= paginatedData.totalPages && paginatedData.totalPages > 0) {
      setPage(paginatedData.totalPages - 1)
    }
  }, [paginatedData, page])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Reset form state
  const resetForm = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedFood(null)
    setAmount(1)
    setSelectedUnit('')
    setSelectedMealName('')
    setActiveTab('mina')
    setPage(0)
    setColorFilter(null)
    isPreselectedRef.current = false
  }, [])

  // Initialize form when modal opens
  const initializeForm = useCallback(() => {
    if (mealName) {
      setSelectedMealName(mealName)
    } else if (mealSettings && mealSettings.length > 0) {
      setSelectedMealName(mealSettings[0].meal_name)
    }

    if (editItem) {
      isPreselectedRef.current = true
      setSelectedFood(editItem.food)
      setAmount(editItem.amount)
      setSelectedUnit(editItem.unit)
      return
    }

    if (preselectedFood) {
      isPreselectedRef.current = true
      setSelectedFood(preselectedFood.food)
      setAmount(preselectedFood.amount)
      setSelectedUnit(preselectedFood.unit)
    }
  }, [mealName, mealSettings, preselectedFood, editItem])

  // Handle modal open/close
  /* eslint-disable react-hooks/set-state-in-effect -- Legitimate pattern for syncing state on open/close */
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      initializeForm()
    } else if (!open && prevOpenRef.current) {
      resetForm()
    }
    prevOpenRef.current = open
  }, [open, initializeForm, resetForm])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Nutrition preview
  const nutritionPreview = useMemo(() => {
    if (!selectedFood || amount === '' || amount <= 0) return null
    return calculateNutritionForUnit(selectedFood, amount, selectedUnit)
  }, [selectedFood, amount, selectedUnit])

  const handleSelectFood = (food: FoodItem) => {
    isPreselectedRef.current = false
    setSelectedFood(food)
    setSearchQuery('')

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

    if (!displayMode) {
      if (food.grams_per_piece && food.serving_unit && food.kcal_per_unit) {
        displayMode = 'serving'
      } else {
        displayMode = 'per100g'
      }
    }

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

    if (!availableUnits.includes(defaultUnit)) {
      defaultUnit = availableUnits[0]
      defaultAmount = food.default_amount
    }

    setSelectedUnit(defaultUnit)
    setAmount(defaultAmount)
  }

  const handleUnitChange = (newUnit: string) => {
    if (!selectedFood || amount === '' || amount <= 0) {
      setSelectedUnit(newUnit)
      return
    }

    const currentNutrition = calculateNutritionForUnit(selectedFood, amount, selectedUnit)
    if (!currentNutrition) {
      setSelectedUnit(newUnit)
      return
    }

    const currentCalories = currentNutrition.calories
    const caloriesPerNewUnit = calculateNutritionForUnit(selectedFood, 1, newUnit)

    if (!caloriesPerNewUnit || caloriesPerNewUnit.calories <= 0) {
      setSelectedUnit(newUnit)
      return
    }

    const newAmount = currentCalories / caloriesPerNewUnit.calories
    setSelectedUnit(newUnit)
    setAmount(Math.round(newAmount * 100) / 100)
  }

  const handleAddFood = async () => {
    if (!selectedFood || !nutritionPreview) return

    try {
      if (isEditMode && editItem) {
        await updateMealItem.mutateAsync({
          itemId: editItem.itemId,
          amount,
          unit: selectedUnit,
          weightGrams: nutritionPreview.weightGrams,
          calories: nutritionPreview.calories,
          protein_g: nutritionPreview.protein,
          carb_g: nutritionPreview.carbs,
          fat_g: nutritionPreview.fat,
        })
        toast.success('Mängd uppdaterad')
        onOpenChange(false)
        onSuccess?.()
        return
      }

      let targetMealEntryId = mealEntryId

      if (!targetMealEntryId) {
        const effectiveMealName = selectedMealName || mealName
        if (!effectiveMealName) {
          toast.error('Ingen måltid vald')
          return
        }
        const mealSetting = mealSettings?.find(m => m.meal_name === effectiveMealName)
        const newMealEntry = await createMealEntry.mutateAsync({
          dailyLogId,
          mealName: effectiveMealName,
          mealOrder: mealSetting?.meal_order ?? 0,
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
      toast.error(isEditMode ? 'Kunde inte uppdatera mängden' : 'Kunde inte lägga till livsmedel')
    }
  }

  const getColorBadge = (color?: string | null) => {
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
          <DialogTitle>{isEditMode ? 'Redigera livsmedel' : 'Lägg till livsmedel'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Ändra mängd och enhet för ${editItem?.food.name}`
              : mealName
                ? `Lägg till livsmedel till ${mealName}`
                : 'Välj måltid och lägg till livsmedel'}
          </DialogDescription>
        </DialogHeader>

        {/* Meal selector */}
        {!isEditMode && !mealName && mealSettings && mealSettings.length > 0 && (
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

        <div className="flex-1 overflow-y-auto space-y-3">
          {!selectedFood ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 border-b border-neutral-200">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key)
                      setPage(0)
                    }}
                    className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

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

              {/* Color filter pills */}
              <div className="flex gap-1">
                {([null, 'Green', 'Yellow', 'Orange'] as const).map(c => (
                  <button
                    key={c ?? 'all'}
                    onClick={() => {
                      setColorFilter(c)
                      setPage(0)
                    }}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                      colorFilter === c
                        ? c === 'Green'
                          ? 'bg-green-500 text-white border-green-600'
                          : c === 'Yellow'
                            ? 'bg-yellow-400 text-neutral-900 border-yellow-500'
                            : c === 'Orange'
                              ? 'bg-orange-500 text-white border-orange-600'
                              : 'bg-neutral-200 text-neutral-700 border-neutral-400'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {c === null
                      ? 'Alla'
                      : c === 'Green'
                        ? 'Grön'
                        : c === 'Yellow'
                          ? 'Gul'
                          : 'Orange'}
                  </button>
                ))}
              </div>

              {/* Food list */}
              <div className="space-y-1">
                {foodsLoading ? (
                  <p className="text-sm text-neutral-500 text-center py-4">Laddar livsmedel...</p>
                ) : foods.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    {searchQuery ? 'Inga livsmedel hittades' : 'Inga livsmedel'}
                  </p>
                ) : (
                  foods.map(food => (
                    <button
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left border border-transparent hover:border-neutral-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{food.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 h-4 shrink-0 ${SOURCE_BADGES[food.source].className}`}
                          >
                            {SOURCE_BADGES[food.source].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {food.calories} kcal / {food.default_amount} {food.default_unit}
                          {food.brand && ` • ${food.brand}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {getColorBadge(food.energy_density_color)}
                        <Plus className="h-4 w-4 text-neutral-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">
                    Sida {page + 1} av {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" /> Föreg
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      Nästa <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
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
                  {!isEditMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFood(null)}
                      className="text-neutral-500 hover:text-neutral-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
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
                    onChange={e => {
                      const val = e.target.value
                      setAmount(val === '' ? '' : parseFloat(val) || '')
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Enhet</Label>
                  <UnitSelector
                    food={selectedFood}
                    value={selectedUnit}
                    onChange={handleUnitChange}
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
              disabled={
                !nutritionPreview ||
                addFoodToMeal.isPending ||
                createMealEntry.isPending ||
                updateMealItem.isPending
              }
            >
              {isEditMode
                ? updateMealItem.isPending
                  ? 'Sparar...'
                  : 'Spara'
                : addFoodToMeal.isPending || createMealEntry.isPending
                  ? 'Lägger till...'
                  : 'Lägg till'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
