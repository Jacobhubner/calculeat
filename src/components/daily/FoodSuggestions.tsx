import { useState, useMemo } from 'react'
import { Lightbulb, Plus, Settings2, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useFoodSuggestions } from '@/hooks/useFoodSuggestions'
import { useFavoriteFoods, useToggleFavorite } from '@/hooks/useFavoriteFoods'
import type { FoodItem } from '@/hooks/useFoodItems'
import type { FoodColor } from '@/lib/calculations/colorDensity'

interface FoodSuggestionsProps {
  remainingCalories?: number
  remainingProtein?: number
  remainingCarbs?: number
  remainingFat?: number
  onAddToMeal?: (food: FoodItem, amount: number, unit: string) => void
}

// Färgprick komponent
function ColorDot({ color }: { color?: string }) {
  if (!color) return null
  const colorClass = {
    Green: 'bg-green-500',
    Yellow: 'bg-yellow-500',
    Orange: 'bg-orange-500',
  }[color]
  const title = {
    Green: 'Grön - Låg energitäthet',
    Yellow: 'Gul - Medium energitäthet',
    Orange: 'Orange - Hög energitäthet',
  }[color]
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`} title={title} />
}

// Score badge - kompakt
function ScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-neutral-500'
  return (
    <span className={`text-xs font-medium ${colorClass}`} title="Matchningspoäng">
      {Math.round(score)}%
    </span>
  )
}

export function FoodSuggestions({
  remainingCalories: _remainingCalories = 0,
  remainingProtein: _remainingProtein = 0,
  remainingCarbs: _remainingCarbs = 0,
  remainingFat: _remainingFat = 0,
  onAddToMeal,
}: FoodSuggestionsProps) {
  // Form state
  const [targetCalories, setTargetCalories] = useState<number | ''>('')
  const [primaryMacro, setPrimaryMacro] = useState<'protein' | 'carbs' | 'fat'>('protein')
  const [primaryMacroTarget, setPrimaryMacroTarget] = useState<number | ''>('')
  const [secondaryMacro, setSecondaryMacro] = useState<'protein' | 'carbs' | 'fat' | ''>('')
  const [secondaryMacroTarget, setSecondaryMacroTarget] = useState<number>(0)
  const [count, setCount] = useState<number>(10)

  // Filter state
  const [showSettings, setShowSettings] = useState(false)
  const [recipesOnly, setRecipesOnly] = useState(false)
  const [nonRecipesOnly, setNonRecipesOnly] = useState(false)
  const [filterByColor, setFilterByColor] = useState(false)
  const [showGreen, setShowGreen] = useState(true)
  const [showYellow, setShowYellow] = useState(true)
  const [showOrange, setShowOrange] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'protein' | 'calories' | 'name'>('score')

  // Favorites
  const { data: favorites } = useFavoriteFoods()
  const { toggle: toggleFavorite, isPending: isTogglingFavorite } = useToggleFavorite()

  // Build color filter array
  const colorFilter = useMemo(() => {
    if (!filterByColor) return undefined
    const colors: FoodColor[] = []
    if (showGreen) colors.push('Green')
    if (showYellow) colors.push('Yellow')
    if (showOrange) colors.push('Orange')
    return colors.length > 0 ? colors : undefined
  }, [filterByColor, showGreen, showYellow, showOrange])

  // Check if search is valid
  const isSearchValid =
    typeof targetCalories === 'number' &&
    targetCalories > 0 &&
    typeof primaryMacroTarget === 'number' &&
    primaryMacroTarget > 0

  // Get suggestions
  const { suggestions: rawSuggestions, isLoading } = useFoodSuggestions(
    {
      targetCalories: typeof targetCalories === 'number' ? targetCalories : 0,
      primaryMacro,
      primaryMacroTarget: typeof primaryMacroTarget === 'number' ? primaryMacroTarget : 0,
      secondaryMacro: secondaryMacro || undefined,
      secondaryMacroTarget: secondaryMacro ? secondaryMacroTarget : undefined,
      count,
      recipesOnly,
      nonRecipesOnly,
      energyDensityColors: colorFilter,
    },
    isSearchValid
  )

  // Sort suggestions
  const suggestions = useMemo(() => {
    const sorted = [...rawSuggestions]
    switch (sortBy) {
      case 'score':
        sorted.sort((a, b) => b.overallScore - a.overallScore)
        break
      case 'protein':
        sorted.sort((a, b) => b.protein - a.protein)
        break
      case 'calories':
        sorted.sort((a, b) => a.calories - b.calories)
        break
      case 'name':
        sorted.sort((a, b) => a.food.name.localeCompare(b.food.name, 'sv'))
        break
    }
    // Favorites first
    if (favorites) {
      return sorted.sort((a, b) => {
        const aIsFav = favorites.has(a.food.id)
        const bIsFav = favorites.has(b.food.id)
        if (aIsFav && !bIsFav) return -1
        if (!aIsFav && bIsFav) return 1
        return 0
      })
    }
    return sorted
  }, [rawSuggestions, sortBy, favorites])

  const handlePrimaryMacroChange = (value: 'protein' | 'carbs' | 'fat') => {
    setPrimaryMacro(value)
    setPrimaryMacroTarget('')
    if (secondaryMacro === value) {
      setSecondaryMacro('')
      setSecondaryMacroTarget(0)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: string) => {
    e.stopPropagation()
    await toggleFavorite(foodId)
  }

  const macroLabel = {
    protein: 'P',
    carbs: 'K',
    fat: 'F',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary-600" />
            Vad ska jag äta?
          </CardTitle>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-500'
            }`}
            title="Inställningar"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* QuickTargetBar - Inline inputs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="number"
            value={targetCalories}
            onChange={e =>
              setTargetCalories(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
            }
            className="h-8 w-20 text-center"
            min={0}
            placeholder="kcal"
          />
          <span className="text-xs text-neutral-500">kcal</span>
          <span className="text-neutral-300">+</span>
          <Input
            type="number"
            value={primaryMacroTarget}
            onChange={e =>
              setPrimaryMacroTarget(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
            }
            className="h-8 w-16 text-center"
            min={0}
            placeholder="g"
          />
          <span className="text-xs text-neutral-500">g {primaryMacro === 'protein' ? 'protein' : primaryMacro === 'carbs' ? 'kolhydrater' : 'fett'}</span>
          {!isSearchValid && <span className="text-xs text-neutral-400 ml-auto">Ange mål</span>}
        </div>

        {/* Settings panel - collapsed by default */}
        {showSettings && (
          <div className="p-3 bg-neutral-50 rounded-lg space-y-3 border">
            {/* Primary macro selector */}
            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">Primär makro</Label>
              <select
                value={primaryMacro}
                onChange={e =>
                  handlePrimaryMacroChange(e.target.value as 'protein' | 'carbs' | 'fat')
                }
                className="h-7 text-xs px-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="protein">Protein</option>
                <option value="carbs">Kolhydrater</option>
                <option value="fat">Fett</option>
              </select>
            </div>

            {/* Secondary macro */}
            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">Sekundär</Label>
              <select
                value={secondaryMacro}
                onChange={e =>
                  setSecondaryMacro(e.target.value as 'protein' | 'carbs' | 'fat' | '')
                }
                className="h-7 text-xs px-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="">Ingen</option>
                {primaryMacro !== 'protein' && <option value="protein">Protein</option>}
                {primaryMacro !== 'carbs' && <option value="carbs">Kolhydrater</option>}
                {primaryMacro !== 'fat' && <option value="fat">Fett</option>}
              </select>
              {secondaryMacro && (
                <>
                  <Input
                    type="number"
                    value={secondaryMacroTarget}
                    onChange={e => setSecondaryMacroTarget(parseInt(e.target.value) || 0)}
                    className="h-7 w-16 text-xs text-center"
                    min={0}
                  />
                  <span className="text-xs text-neutral-500">g</span>
                </>
              )}
            </div>

            {/* Count and Sort */}
            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">Antal</Label>
              <Input
                type="number"
                value={count}
                onChange={e => setCount(parseInt(e.target.value) || 10)}
                className="h-7 w-16 text-xs text-center"
                min={1}
                max={50}
              />
              <Label className="text-xs shrink-0">Sortera</Label>
              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(e.target.value as 'score' | 'protein' | 'calories' | 'name')
                }
                className="h-7 text-xs px-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="score">Matchning</option>
                <option value="protein">Protein</option>
                <option value="calories">Kalorier</option>
                <option value="name">Namn</option>
              </select>
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={recipesOnly}
                  onCheckedChange={v => {
                    setRecipesOnly(v as boolean)
                    if (v) setNonRecipesOnly(false)
                  }}
                />
                Recept
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={nonRecipesOnly}
                  onCheckedChange={v => {
                    setNonRecipesOnly(v as boolean)
                    if (v) setRecipesOnly(false)
                  }}
                />
                Livsmedel
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={filterByColor}
                  onCheckedChange={v => setFilterByColor(v as boolean)}
                />
                Färgfilter
              </label>
              {filterByColor && (
                <>
                  <label className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={showGreen}
                      onCheckedChange={v => setShowGreen(v as boolean)}
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={showYellow}
                      onCheckedChange={v => setShowYellow(v as boolean)}
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={showOrange}
                      onCheckedChange={v => setShowOrange(v as boolean)}
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <p className="text-xs text-neutral-500 text-center py-4">Söker...</p>
        ) : !isSearchValid ? (
          <p className="text-xs text-neutral-400 text-center py-3">
            Ange kalorimål och makromål för att se förslag
          </p>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-600">Inga matchningar</p>
            <p className="text-xs text-neutral-400 mt-1">Prova ändra målen eller ta bort filter</p>
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between text-xs text-neutral-500 border-b pb-1">
              <span>{suggestions.length} förslag</span>
              <span>
                Sorterat:{' '}
                {sortBy === 'score'
                  ? 'Matchning'
                  : sortBy === 'protein'
                    ? 'Protein'
                    : sortBy === 'calories'
                      ? 'Kalorier'
                      : 'Namn'}
              </span>
            </div>

            {/* Compact table list */}
            <div className="max-h-72 overflow-y-auto -mx-1">
              {suggestions.map((match, index) => {
                const isFavorite = favorites?.has(match.food.id) ?? false
                return (
                  <div
                    key={match.food.id}
                    className="px-1 py-1.5 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                  >
                    {/* Row 1: Index, Heart, Name, Amount, Kcal, Add */}
                    <div className="flex items-center gap-1.5">
                      {/* Favorite button */}
                      <button
                        onClick={e => handleToggleFavorite(e, match.food.id)}
                        disabled={isTogglingFavorite}
                        className="p-0.5 rounded hover:bg-neutral-100 flex-shrink-0"
                        title={isFavorite ? 'Ta bort favorit' : 'Lägg till favorit'}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-300'
                          }`}
                        />
                      </button>

                      {/* Rank */}
                      <span className="text-xs text-neutral-400 w-4 text-center flex-shrink-0">
                        {index + 1}
                      </span>

                      {/* Food name - can wrap */}
                      <span className="text-sm text-neutral-900 flex-1 min-w-0 leading-tight">
                        {match.food.name}
                      </span>

                      {/* Amount */}
                      <span className="text-xs font-medium text-primary-600 whitespace-nowrap flex-shrink-0">
                        {match.amount.toFixed(0)}
                        {match.unit}
                      </span>

                      {/* Calories */}
                      <span className="text-xs text-neutral-600 whitespace-nowrap w-14 text-right flex-shrink-0">
                        {Math.round(match.calories)} kcal
                      </span>

                      {/* Add button */}
                      {onAddToMeal && (
                        <button
                          onClick={() => {
                            // Use preferred unit based on display mode
                            const displayMode = localStorage.getItem(
                              `food-display-mode:${match.food.id}`
                            )
                            let unit = match.unit
                            let amount = match.amount

                            // If food has volume data and user prefers volume
                            if (
                              match.food.ml_per_gram &&
                              (displayMode === 'perVolume' || match.food.default_unit === 'ml')
                            ) {
                              // Convert to ml if not already
                              if (unit === 'g') {
                                const ml = amount * match.food.ml_per_gram
                                unit = 'ml'
                                amount = Math.round(ml * 10) / 10
                              }
                            } else if (match.food.grams_per_piece && displayMode === 'serving') {
                              // Convert to serving unit if user prefers it
                              const servingUnit = match.food.serving_unit || 'st'
                              if (unit === 'g') {
                                const pieces = amount / match.food.grams_per_piece
                                unit = servingUnit
                                amount = Math.round(pieces * 100) / 100
                              }
                            }

                            onAddToMeal(match.food, amount, unit)
                          }}
                          className="p-1 rounded bg-primary-600 text-white hover:bg-primary-700 transition-colors flex-shrink-0"
                          title="Lägg till i måltid"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Row 2: Score, Color dot, Macros */}
                    <div className="flex items-center gap-2 mt-0.5 ml-9 text-xs">
                      <ColorDot color={match.food.energy_density_color} />
                      <ScoreBadge score={match.overallScore} />
                      <span className="text-neutral-300">•</span>
                      <span
                        className={
                          primaryMacro === 'protein'
                            ? 'font-semibold text-blue-600'
                            : 'text-neutral-500'
                        }
                      >
                        P:{match.protein.toFixed(0)}g
                      </span>
                      <span
                        className={
                          primaryMacro === 'carbs'
                            ? 'font-semibold text-green-600'
                            : 'text-neutral-500'
                        }
                      >
                        K:{match.carbs.toFixed(0)}g
                      </span>
                      <span
                        className={
                          primaryMacro === 'fat'
                            ? 'font-semibold text-amber-600'
                            : 'text-neutral-500'
                        }
                      >
                        F:{match.fat.toFixed(0)}g
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
