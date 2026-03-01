import type { FoodItem } from '@/hooks/useFoodItems'

interface CompactFoodItemProps {
  food: FoodItem
  onClick?: () => void
  rightContent?: React.ReactNode
  showDetails?: boolean
  details?: string
  highlighted?: boolean
  disabled?: boolean
}

// Färgprick för energitäthet
function ColorDot({ color }: { color?: string | null }) {
  if (!color) return null

  const colorClass = {
    Green: 'bg-green-500',
    Yellow: 'bg-yellow-500',
    Orange: 'bg-orange-500',
  }[color]

  const label = {
    Green: 'Grön',
    Yellow: 'Gul',
    Orange: 'Orange',
  }[color]

  return (
    <span
      className={`w-3 h-3 rounded-full flex-shrink-0 ${colorClass}`}
      title={`Energitäthet: ${label}`}
    />
  )
}

export function CompactFoodItem({
  food,
  onClick,
  rightContent,
  showDetails = true,
  details,
  highlighted = false,
  disabled = false,
}: CompactFoodItemProps) {
  const kcalPer100g = food.kcal_per_gram
    ? Math.round(food.kcal_per_gram * 100)
    : food.weight_grams && food.weight_grams > 0
      ? Math.round((food.calories / food.weight_grams) * 100)
      : food.calories

  const detailsText =
    details || [food.brand, food.is_recipe ? '👨‍🍳 Recept' : null].filter(Boolean).join(' • ')

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        flex items-start gap-2 p-2.5 rounded-lg transition-colors
        ${onClick && !disabled ? 'cursor-pointer hover:bg-neutral-100' : ''}
        ${highlighted ? 'bg-primary-50 border border-primary-200' : 'hover:bg-neutral-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Namn och detaljer */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-neutral-900 leading-tight break-words flex-1">
            {food.name}
          </span>
        </div>
        {showDetails && detailsText && (
          <div className="text-xs text-neutral-500 mt-0.5">{detailsText}</div>
        )}
      </div>

      {/* Kalorier per 100g */}
      <div className="text-xs text-neutral-600 whitespace-nowrap flex-shrink-0 mt-0.5">
        {kcalPer100g} kcal
      </div>

      {/* Färgprick */}
      <div className="flex-shrink-0 mt-1">
        <ColorDot color={food.energy_density_color} />
      </div>

      {/* Extra innehåll (t.ex. +knapp) */}
      {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
    </div>
  )
}

// Export ColorDot för användning i andra komponenter
export { ColorDot }
