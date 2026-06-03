import { useMemo } from 'react'
import { Select } from '@/components/ui/select'
import type { FoodItem } from '@/hooks/useFoodItems'
import { getAvailableUnits, calculateNutritionForUnit } from '@/lib/calculations/nutritionFromUnit'

export { getAvailableUnits, calculateNutritionForUnit }

const UNIT_LABELS: Record<string, string> = {
  g: 'gram',
  ml: 'ml',
  dl: 'dl',
  msk: 'msk',
  tsk: 'tsk',
  st: 'st',
}

interface UnitSelectorProps {
  food: FoodItem
  value: string
  onChange: (unit: string) => void
  className?: string
}

export function UnitSelector({ food, value, onChange, className }: UnitSelectorProps) {
  const availableUnits = useMemo(() => getAvailableUnits(food), [food])

  // Ensure current value is in the list
  const currentValue = availableUnits.includes(value) ? value : availableUnits[0]

  return (
    <Select
      value={currentValue}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={className}
    >
      {availableUnits.map(unit => (
        <option key={unit} value={unit}>
          {UNIT_LABELS[(unit ?? 'g').toLowerCase()] || unit}
        </option>
      ))}
    </Select>
  )
}
