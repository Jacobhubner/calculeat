import { useState, useRef, useEffect, useCallback } from 'react'
import { Trash2, Search, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { FoodItem } from '@/hooks/useFoodItems'
import {
  calculateIngredientNutrition,
  getAvailableUnits,
  getDefaultRecipeUnit,
} from '@/lib/calculations/recipeCalculator'

export interface IngredientData {
  id: string
  foodItem: FoodItem | null
  amount: number
  unit: string
}

interface IngredientRowProps {
  ingredient: IngredientData
  availableFoods: FoodItem[]
  favorites?: Set<string>
  onChange: (updated: IngredientData) => void
  onRemove: () => void
  onToggleFavorite?: (foodId: string) => void
}

export function IngredientRow({
  ingredient,
  availableFoods,
  favorites,
  onChange,
  onRemove,
  onToggleFavorite,
}: IngredientRowProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handler to update search and reset highlighted index
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setHighlightedIndex(0)
  }, [])

  // Handler to open dropdown and reset highlighted index
  const handleOpenDropdown = useCallback(() => {
    setIsSearchOpen(true)
    setHighlightedIndex(0)
  }, [])

  // Filter and sort foods based on search
  const allFilteredFoods = availableFoods
    .filter(food => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        food.name.toLowerCase().includes(query) ||
        (food.brand && food.brand.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      // Sort favorites first
      const aIsFav = favorites?.has(a.id) || false
      const bIsFav = favorites?.has(b.id) || false
      if (aIsFav && !bIsFav) return -1
      if (!aIsFav && bIsFav) return 1
      return a.name.localeCompare(b.name, 'sv')
    })

  const totalMatches = allFilteredFoods.length
  const filteredFoods = allFilteredFoods.slice(0, 20)

  // Get available units for selected food
  const availableUnits = ingredient.foodItem ? getAvailableUnits(ingredient.foodItem) : ['g']

  // Calculate nutrition for current ingredient
  const nutrition =
    ingredient.foodItem && ingredient.amount > 0
      ? calculateIngredientNutrition(ingredient.foodItem, ingredient.amount, ingredient.unit)
      : null

  const handleFoodSelect = useCallback(
    (food: FoodItem) => {
      const defaultUnit = getDefaultRecipeUnit(food)
      onChange({
        ...ingredient,
        foodItem: food,
        unit: defaultUnit,
        amount: ingredient.amount || 1,
      })
      setSearchQuery('')
      setIsSearchOpen(false)
    },
    [ingredient, onChange]
  )

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isSearchOpen) return

      switch (e.key) {
        case 'Escape': {
          e.preventDefault()
          setIsSearchOpen(false)
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          setHighlightedIndex(prev => {
            const newIndex = Math.min(prev + 1, filteredFoods.length - 1)
            const nextItem = listRef.current?.children[newIndex] as HTMLElement
            nextItem?.scrollIntoView({ block: 'nearest' })
            return newIndex
          })
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setHighlightedIndex(prev => {
            const newIndex = Math.max(prev - 1, 0)
            const prevItem = listRef.current?.children[newIndex] as HTMLElement
            prevItem?.scrollIntoView({ block: 'nearest' })
            return newIndex
          })
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (filteredFoods[highlightedIndex]) {
            handleFoodSelect(filteredFoods[highlightedIndex])
          }
          break
        }
      }
    },
    [isSearchOpen, filteredFoods, highlightedIndex, handleFoodSelect]
  )

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    onChange({ ...ingredient, amount: numValue })
  }

  const handleUnitChange = (unit: string) => {
    onChange({ ...ingredient, unit })
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
      {/* Food selector */}
      <div className="flex-1 relative" ref={searchRef}>
        {ingredient.foodItem ? (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-300"
            onClick={handleOpenDropdown}
          >
            <span className="font-medium text-neutral-900 truncate">
              {ingredient.foodItem.name}
            </span>
            {ingredient.foodItem.brand && (
              <span className="text-xs text-neutral-500">({ingredient.foodItem.brand})</span>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Sök livsmedel..."
              value={searchQuery}
              onChange={e => {
                handleSearchChange(e.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={handleOpenDropdown}
              onKeyDown={handleKeyDown}
              className="pl-9"
              aria-label="Sök livsmedel"
              aria-expanded={isSearchOpen}
              aria-haspopup="listbox"
            />
          </div>
        )}

        {/* Dropdown */}
        {isSearchOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {ingredient.foodItem && (
              <div className="p-2 border-b">
                <Input
                  placeholder="Sök livsmedel..."
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="text-sm"
                  aria-label="Sök livsmedel"
                />
              </div>
            )}
            {filteredFoods.length === 0 ? (
              <div className="p-3 text-sm text-neutral-500 text-center">
                Inga livsmedel hittades
              </div>
            ) : (
              <>
                <div ref={listRef} role="listbox">
                  {filteredFoods.map((food, index) => {
                    const isFavorite = favorites?.has(food.id) || false
                    const isHighlighted = index === highlightedIndex
                    return (
                      <div
                        key={food.id}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                          isHighlighted ? 'bg-primary-50' : 'hover:bg-neutral-50'
                        }`}
                        onClick={() => handleFoodSelect(food)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              onToggleFavorite(food.id)
                            }}
                            className="flex-shrink-0"
                            aria-label={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                isFavorite
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-neutral-300 hover:text-red-400'
                              }`}
                            />
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-neutral-900 truncate">
                            {food.name}
                          </div>
                          {food.brand && (
                            <div className="text-xs text-neutral-500 truncate">{food.brand}</div>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 flex-shrink-0">
                          {food.calories} kcal/{food.weight_grams || 100}g
                        </div>
                      </div>
                    )
                  })}
                </div>
                {totalMatches > 20 && (
                  <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-50 border-t text-center">
                    Visar 20 av {totalMatches} träffar – sök för fler
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Amount input */}
      <Input
        type="number"
        value={ingredient.amount || ''}
        onChange={e => handleAmountChange(e.target.value)}
        placeholder="Mängd"
        className="w-20 text-center"
        min={0}
        step="any"
      />

      {/* Unit selector */}
      <select
        value={ingredient.unit}
        onChange={e => handleUnitChange(e.target.value)}
        className="h-11 px-3 bg-white border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        aria-label="Välj enhet"
      >
        {availableUnits.map(unit => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>

      {/* Nutrition display */}
      {nutrition && nutrition.calories > 0 ? (
        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-600 min-w-[140px]">
          <span className="font-semibold text-primary-600">
            {Math.round(nutrition.calories)} kcal
          </span>
          <span className="text-green-600">{nutrition.protein.toFixed(1)}g P</span>
        </div>
      ) : (
        <div className="hidden sm:block min-w-[140px]" />
      )}

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        aria-label="Ta bort ingrediens"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
