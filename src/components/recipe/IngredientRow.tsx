import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FoodItem } from '@/hooks/useFoodItems'
import { SOURCE_BADGES, getListItemBadgeConfig } from '@/lib/constants/sourceBadges'

type SourceFilter = 'alla' | 'mina' | 'calculeat' | 'slv' | `list:${string}`

interface SharedListOption {
  id: string
  name: string
}

function matchesSourceFilter(food: FoodItem, filter: SourceFilter): boolean {
  if (filter === 'alla') return true
  if (filter === 'mina')
    return (food.source === 'user' || food.source === 'shared') && !food.shared_list_id
  if (filter === 'calculeat') return food.source === 'manual' && !food.shared_list_id
  if (filter === 'slv') return food.source === 'livsmedelsverket'
  if (filter.startsWith('list:')) {
    const listId = filter.slice(5)
    return food.shared_list_id === listId
  }
  return true
}
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
  sharedLists?: SharedListOption[]
  onChange: (updated: IngredientData) => void
  onRemove: () => void
}

export function IngredientRow({
  ingredient,
  availableFoods,
  sharedLists = [],
  onChange,
  onRemove,
}: IngredientRowProps) {
  const { t } = useTranslation('recipes')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('alla')
  const [amountInput, setAmountInput] = useState(
    ingredient.amount > 0 ? String(ingredient.amount) : ''
  )
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

  // Filter and sort foods based on search + source filter
  const allFilteredFoods = availableFoods
    .filter(food => {
      if (!matchesSourceFilter(food, sourceFilter)) return false
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        food.name.toLowerCase().includes(query) ||
        (food.brand && food.brand.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

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
    setAmountInput(value)
    const numValue = value === '' ? 0 : parseFloat(value.replace(',', '.'))
    if (!isNaN(numValue)) {
      onChange({ ...ingredient, amount: numValue })
    }
  }

  const handleUnitChange = (unit: string) => {
    onChange({ ...ingredient, unit })
  }

  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
      {/* Row 1: Food selector + amount + unit + delete */}
      <div className="flex items-center gap-2">
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
                placeholder={t('ingredient.searchPlaceholder')}
                value={searchQuery}
                onChange={e => {
                  handleSearchChange(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={handleOpenDropdown}
                onKeyDown={handleKeyDown}
                className="pl-9"
                aria-label={t('ingredient.searchLabel')}
                aria-expanded={isSearchOpen}
                aria-haspopup="listbox"
              />
            </div>
          )}

          {/* Dropdown */}
          {isSearchOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-72 flex flex-col w-[320px] max-w-[90vw]">
              {/* Sökinput (visas alltid när ett livsmedel redan är valt) */}
              {ingredient.foodItem && (
                <div className="p-2 border-b shrink-0">
                  <Input
                    placeholder={t('ingredient.searchPlaceholder')}
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="text-sm"
                    aria-label={t('ingredient.searchLabel')}
                  />
                </div>
              )}
              {/* Källfilter */}
              <div className="flex gap-1 px-2 py-1.5 border-b shrink-0 flex-wrap">
                {(
                  [
                    { key: 'alla' as SourceFilter, label: t('ingredient.filterAll') },
                    { key: 'mina' as SourceFilter, label: t('ingredient.filterMine') },
                    { key: 'calculeat' as SourceFilter, label: t('ingredient.filterCalculeat') },
                    { key: 'slv' as SourceFilter, label: t('ingredient.filterSlv') },
                    ...sharedLists.map(l => ({
                      key: `list:${l.id}` as SourceFilter,
                      label: l.name.length > 14 ? l.name.slice(0, 12) + '…' : l.name,
                    })),
                  ] as { key: SourceFilter; label: string }[]
                ).map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setSourceFilter(f.key)
                      setHighlightedIndex(0)
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      sourceFilter === f.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredFoods.length === 0 ? (
                  <div className="p-3 text-sm text-neutral-500 text-center">
                    {t('ingredient.noFoodsFound')}
                  </div>
                ) : (
                  <>
                    <div ref={listRef} role="listbox">
                      {filteredFoods.map((food, index) => {
                        const isHighlighted = index === highlightedIndex
                        const colorBadge = food.energy_density_color
                        const listForFood = food.shared_list_id
                          ? sharedLists.find(l => l.id === food.shared_list_id)
                          : null
                        const sourceBadge = listForFood
                          ? getListItemBadgeConfig(listForFood.name)
                          : SOURCE_BADGES[food.source]
                        return (
                          <div
                            key={food.id}
                            role="option"
                            aria-selected={isHighlighted}
                            className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-neutral-100 last:border-b-0 ${
                              isHighlighted ? 'bg-primary-50' : 'hover:bg-neutral-50'
                            }`}
                            onClick={() => handleFoodSelect(food)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-medium text-sm text-neutral-900 truncate">
                                  {food.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1 py-0 h-4 shrink-0 ${sourceBadge.className}`}
                                >
                                  {sourceBadge.label}
                                </Badge>
                              </div>
                              <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                {food.brand && <span>{food.brand} •</span>}
                                <span>
                                  {food.calories} kcal/{food.weight_grams || 100}g
                                </span>
                              </div>
                            </div>
                            {colorBadge && (
                              <Badge
                                variant="outline"
                                className={`text-xs flex-shrink-0 ${
                                  colorBadge === 'Green'
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : colorBadge === 'Yellow'
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                      : 'bg-orange-50 text-orange-700 border-orange-300'
                                }`}
                              >
                                {colorBadge === 'Green'
                                  ? t('card.colorGreen')
                                  : colorBadge === 'Yellow'
                                    ? t('card.colorYellow')
                                    : t('card.colorOrange')}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {totalMatches > 20 && (
                      <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-50 border-t text-center">
                        {t('ingredient.showingOf', { total: totalMatches })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Amount input */}
        <Input
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={e => handleAmountChange(e.target.value)}
          placeholder={t('ingredient.amountPlaceholder')}
          className="w-20 text-center"
        />

        {/* Unit selector */}
        <select
          value={ingredient.unit}
          onChange={e => handleUnitChange(e.target.value)}
          className="h-11 px-3 bg-white border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          aria-label={t('ingredient.selectUnit')}
        >
          {availableUnits.map(unit => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>

        {/* Remove button */}
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

      {/* Row 2: Macro display - always visible when food is selected */}
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
    </div>
  )
}
