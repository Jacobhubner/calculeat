import { useState, useCallback, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Search, GripVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FoodItem } from '@/hooks/useFoodItems'
import { AddFoodItemModal } from '@/components/food/AddFoodItemModal'
import { AddFoodToMealModal } from '@/components/daily/AddFoodToMealModal'

import {
  calculateIngredientNutrition,
  calculateIngredientWeight,
  getAvailableUnits,
  getDefaultRecipeUnit,
} from '@/lib/calculations/recipeCalculator'
import { convertWeightToUnit } from '@/lib/utils/unitConversion'

// Isolated amount input — local state never causes IngredientRow to re-render.
// Re-mount via key when parent value changes (e.g. unit conversion) to sync initialValue.
const AmountInput = memo(function AmountInput({
  initialValue,
  placeholder,
  onCommit,
}: {
  initialValue: number
  placeholder: string
  onCommit: (value: number) => void
}) {
  const [raw, setRaw] = useState(initialValue > 0 ? String(initialValue) : '')

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={e => setRaw(e.target.value)}
      onBlur={() => {
        const num = raw === '' ? 0 : parseFloat(raw.replace(',', '.'))
        if (!isNaN(num)) {
          onCommit(num)
        } else {
          setRaw(initialValue > 0 ? String(initialValue) : '')
        }
      }}
      placeholder={placeholder}
      className="w-24 text-center"
    />
  )
})

export interface IngredientData {
  id: string
  foodItem: FoodItem | null
  amount: number
  unit: string
  snapshotCalories?: number | null
}

interface IngredientRowProps {
  ingredient: IngredientData
  availableFoods?: FoodItem[]
  sharedLists?: { id: string; name: string }[]
  onChange: (updated: IngredientData) => void
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function IngredientRow({
  ingredient,
  onChange,
  onRemove,
  dragHandleProps,
}: IngredientRowProps) {
  const { t } = useTranslation('recipes')
  const [addFoodItemModalOpen, setAddFoodItemModalOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Get available units for selected food
  const availableUnits = useMemo(
    () => (ingredient.foodItem ? getAvailableUnits(ingredient.foodItem) : ['g']),
    [ingredient.foodItem]
  )

  // Calculate nutrition for current ingredient — only when ingredient prop changes, not on local amountInput changes
  const nutrition = useMemo(
    () =>
      ingredient.foodItem && ingredient.amount > 0
        ? calculateIngredientNutrition(ingredient.foodItem, ingredient.amount, ingredient.unit)
        : null,
    [ingredient.foodItem, ingredient.amount, ingredient.unit]
  )

  const handleFoodSelect = useCallback(
    (food: FoodItem) => {
      const defaultUnit = getDefaultRecipeUnit(food)
      onChange({
        ...ingredient,
        foodItem: food,
        unit: defaultUnit,
        amount: ingredient.amount || 1,
      })
    },
    [ingredient, onChange]
  )

  const handleAmountCommit = useCallback(
    (numValue: number) => {
      onChange({ ...ingredient, amount: numValue })
    },
    [ingredient, onChange]
  )

  const handleUnitChange = (newUnit: string) => {
    if (!ingredient.foodItem || ingredient.amount <= 0) {
      onChange({ ...ingredient, unit: newUnit })
      return
    }
    // Convert current amount to grams using the old unit, then to the new unit
    const weightGrams = calculateIngredientWeight(
      ingredient.foodItem,
      ingredient.amount,
      ingredient.unit
    )
    const convertedAmount = convertWeightToUnit(
      weightGrams,
      newUnit,
      ingredient.foodItem.ml_per_gram ?? undefined
    )
    // For piece/serving units (st, portion, custom) there's no round-trip formula — keep amount as-is
    const isConvertible =
      newUnit === 'g' ||
      newUnit === 'kg' ||
      newUnit === 'dl' ||
      newUnit === 'msk' ||
      newUnit === 'tsk'
    const newAmount = isConvertible ? Math.round(convertedAmount * 100) / 100 : ingredient.amount
    onChange({ ...ingredient, unit: newUnit, amount: newAmount })
  }

  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
      {/* Row 1: Grip + food selector + delete */}
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        {/* Food selector — opens full food picker modal */}
        <div className="flex-1">
          <div
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-300"
            onClick={e => {
              e.stopPropagation()
              setPickerOpen(true)
            }}
          >
            {ingredient.foodItem ? (
              <>
                <span className="font-medium text-neutral-900 truncate">
                  {ingredient.foodItem.name}
                </span>
                {ingredient.foodItem.brand && (
                  <span className="text-xs text-neutral-500">({ingredient.foodItem.brand})</span>
                )}
              </>
            ) : (
              <>
                <Search className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                <span className="text-neutral-400 text-sm">
                  {t('ingredient.searchPlaceholder')}
                </span>
              </>
            )}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setAddFoodItemModalOpen(true)}
          className="h-8 w-8 p-0 flex-shrink-0"
          aria-label={t('ingredient.scanBarcode')}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
          aria-label={t('ingredient.removeIngredient')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Row 2: Amount + unit */}
      <div className="flex items-center gap-2 pl-7">
        <AmountInput
          key={ingredient.amount}
          initialValue={ingredient.amount}
          placeholder={t('ingredient.amountPlaceholder')}
          onCommit={handleAmountCommit}
        />
        <select
          value={ingredient.unit}
          onChange={e => handleUnitChange(e.target.value)}
          className="flex-1 h-11 px-3 bg-white border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          aria-label={t('ingredient.selectUnit')}
        >
          {availableUnits.map(unit => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>

      {/* Row 3: Macro display - always visible when food is selected */}
      {nutrition && nutrition.calories > 0 && (
        <div className="flex items-center gap-4 text-sm pt-2 border-t border-neutral-200">
          <span className="font-semibold text-primary-600">
            {Math.round(nutrition.calories)} kcal
          </span>
          <span style={{ color: '#f5c518' }}>F: {nutrition.fat.toFixed(1)}g</span>
          <span style={{ color: '#fb923c' }}>K: {nutrition.carbs.toFixed(1)}g</span>
          <span style={{ color: '#f43f5e' }}>P: {nutrition.protein.toFixed(1)}g</span>
        </div>
      )}

      <AddFoodItemModal
        open={addFoodItemModalOpen}
        onOpenChange={setAddFoodItemModalOpen}
        onSuccess={newFood => {
          if (newFood) {
            handleFoodSelect(newFood)
          }
        }}
      />

      <AddFoodToMealModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mealName=""
        dailyLogId=""
        onFoodSelect={food => handleFoodSelect(food)}
      />
    </div>
  )
}
