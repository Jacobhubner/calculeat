import { Heart } from 'lucide-react'
import type { FoodItem } from '@/hooks/useFoodItems'

interface CompactFoodItemProps {
  food: FoodItem
  isFavorite: boolean
  onToggleFavorite: (e: React.MouseEvent) => void
  onClick?: () => void
  rightContent?: React.ReactNode
  showDetails?: boolean
  details?: string
  highlighted?: boolean
  disabled?: boolean
}

// Färgprick för energitäthet
function ColorDot({ color }: { color?: string }) {
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
  isFavorite,
  onToggleFavorite,
  onClick,
  rightContent,
  showDetails = true,
  details,
  highlighted = false,
  disabled = false,
}: CompactFoodItemProps) {
  // Beräkna kcal/100g för visning
  const kcalPer100g = food.kcal_per_gram
    ? Math.round(food.kcal_per_gram * 100)
    : food.weight_grams && food.weight_grams > 0
      ? Math.round((food.calories / food.weight_grams) * 100)
      : food.calories

  // Bygg detaljer-text
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
      {/* Favorit-knapp */}
      <button
        onClick={onToggleFavorite}
        disabled={disabled}
        className="mt-0.5 p-0.5 rounded hover:bg-neutral-200 transition-colors flex-shrink-0"
        title={isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
      >
        <Heart
          className={`h-4 w-4 ${
            isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-300 hover:text-red-400'
          }`}
        />
      </button>

      {/* Namn och detaljer */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-neutral-900 leading-tight break-words flex-1">
            {food.name}
            {isFavorite && <span className="text-red-500 ml-1 text-xs">★</span>}
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
