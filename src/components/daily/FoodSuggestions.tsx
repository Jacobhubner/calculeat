import { useState, useMemo } from 'react'
import { Lightbulb, ChevronDown, ChevronUp, Plus, Filter, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
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

export function FoodSuggestions({
  remainingCalories = 0,
  remainingProtein = 0,
  remainingCarbs = 0,
  remainingFat = 0,
  onAddToMeal,
}: FoodSuggestionsProps) {
  // Form state
  const [targetCalories, setTargetCalories] = useState<number>(remainingCalories || 200)
  const [primaryMacro, setPrimaryMacro] = useState<'protein' | 'carbs' | 'fat'>('protein')
  const [primaryMacroTarget, setPrimaryMacroTarget] = useState<number>(remainingProtein || 20)
  const [secondaryMacro, setSecondaryMacro] = useState<'protein' | 'carbs' | 'fat' | ''>('')
  const [secondaryMacroTarget, setSecondaryMacroTarget] = useState<number>(0)
  const [count, setCount] = useState<number>(10)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
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

  // Get suggestions
  const { suggestions: rawSuggestions, isLoading } = useFoodSuggestions(
    {
      targetCalories,
      primaryMacro,
      primaryMacroTarget,
      secondaryMacro: secondaryMacro || undefined,
      secondaryMacroTarget: secondaryMacro ? secondaryMacroTarget : undefined,
      count,
      recipesOnly,
      nonRecipesOnly,
      energyDensityColors: colorFilter,
    },
    targetCalories > 0 && primaryMacroTarget > 0
  )

  // Sort suggestions based on selected sort order, with favorites always first
  const suggestions = useMemo(() => {
    const sorted = [...rawSuggestions]

    // First, sort by the selected criteria
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

    // Then, sort favorites to the top while preserving the internal sort order
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

  // Note: Initial values from remainingCalories/remainingProtein are set in useState initializers above
  // User can manually adjust targets via the form inputs

  const handlePrimaryMacroChange = (value: 'protein' | 'carbs' | 'fat') => {
    setPrimaryMacro(value)
    // Update default target based on remaining
    switch (value) {
      case 'protein':
        setPrimaryMacroTarget(remainingProtein || 20)
        break
      case 'carbs':
        setPrimaryMacroTarget(remainingCarbs || 50)
        break
      case 'fat':
        setPrimaryMacroTarget(remainingFat || 15)
        break
    }
    // Clear secondary if same
    if (secondaryMacro === value) {
      setSecondaryMacro('')
      setSecondaryMacroTarget(0)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, foodId: string) => {
    e.stopPropagation() // Prevent any parent click handlers
    await toggleFavorite(foodId)
  }

  const getColorBadge = (color?: string) => {
    if (!color) return null
    return (
      <Badge
        variant="outline"
        className={
          color === 'Green'
            ? 'bg-green-50 text-green-700 border-green-300 text-xs'
            : color === 'Yellow'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-300 text-xs'
              : 'bg-orange-50 text-orange-700 border-orange-300 text-xs'
        }
      >
        {color === 'Green' ? 'Grön' : color === 'Yellow' ? 'Gul' : 'Orange'}
      </Badge>
    )
  }

  const getScoreBadge = (score: number) => {
    const color =
      score >= 80
        ? 'bg-green-100 text-green-700'
        : score >= 60
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-neutral-100 text-neutral-700'
    return (
      <Badge
        variant="outline"
        className={`${color} text-xs cursor-help`}
        title="Matchningspoäng: Hur väl livsmedlet matchar dina mål (kalorier + makros). Högre är bättre."
      >
        {Math.round(score)}%
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary-600" />
          Vad ska jag äta?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Målkalorier</Label>
            <div className="flex gap-1 mt-1">
              <Input
                type="number"
                value={targetCalories}
                onChange={e => setTargetCalories(parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
                min={0}
              />
              <span className="self-center text-xs text-neutral-500">kcal</span>
            </div>
          </div>
          <div>
            <Label className="text-xs">Antal förslag</Label>
            <Input
              type="number"
              value={count}
              onChange={e => setCount(parseInt(e.target.value) || 10)}
              className="h-8 text-sm mt-1"
              min={1}
              max={50}
            />
          </div>
        </div>

        {/* Primary macro */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Primär makro</Label>
            <Select
              value={primaryMacro}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handlePrimaryMacroChange(e.target.value as 'protein' | 'carbs' | 'fat')
              }
              className="h-8 text-sm mt-1"
            >
              <option value="protein">Protein</option>
              <option value="carbs">Kolhydrater</option>
              <option value="fat">Fett</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Målmängd</Label>
            <div className="flex gap-1 mt-1">
              <Input
                type="number"
                value={primaryMacroTarget}
                onChange={e => setPrimaryMacroTarget(parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
                min={0}
              />
              <span className="self-center text-xs text-neutral-500">g</span>
            </div>
          </div>
        </div>

        {/* Secondary macro (optional) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Sekundär makro (valfritt)</Label>
            <Select
              value={secondaryMacro}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSecondaryMacro(e.target.value as 'protein' | 'carbs' | 'fat' | '')
              }
              className="h-8 text-sm mt-1"
            >
              <option value="">Ingen</option>
              {primaryMacro !== 'protein' && <option value="protein">Protein</option>}
              {primaryMacro !== 'carbs' && <option value="carbs">Kolhydrater</option>}
              {primaryMacro !== 'fat' && <option value="fat">Fett</option>}
            </Select>
          </div>
          {secondaryMacro && (
            <div>
              <Label className="text-xs">Målmängd</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  type="number"
                  value={secondaryMacroTarget}
                  onChange={e => setSecondaryMacroTarget(parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                  min={0}
                />
                <span className="self-center text-xs text-neutral-500">g</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-900"
        >
          <Filter className="h-3 w-3" />
          <span>Filter</span>
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Filter options */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={recipesOnly}
                  onCheckedChange={v => {
                    setRecipesOnly(v as boolean)
                    if (v) setNonRecipesOnly(false)
                  }}
                />
                Endast recept
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={nonRecipesOnly}
                  onCheckedChange={v => {
                    setNonRecipesOnly(v as boolean)
                    if (v) setRecipesOnly(false)
                  }}
                />
                Endast livsmedel
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs mb-2">
                <Checkbox
                  checked={filterByColor}
                  onCheckedChange={v => setFilterByColor(v as boolean)}
                />
                Filtrera på energitäthet
              </label>
              {filterByColor && (
                <>
                  <div className="flex gap-3 ml-5">
                    <label className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={showGreen}
                        onCheckedChange={v => setShowGreen(v as boolean)}
                      />
                      <span className="text-green-600">Grön</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={showYellow}
                        onCheckedChange={v => setShowYellow(v as boolean)}
                      />
                      <span className="text-yellow-600">Gul</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={showOrange}
                        onCheckedChange={v => setShowOrange(v as boolean)}
                      />
                      <span className="text-orange-600">Orange</span>
                    </label>
                  </div>
                  {!showGreen && !showYellow && !showOrange && (
                    <p className="text-xs text-amber-600 ml-5 mt-1">⚠️ Välj minst en färg</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="border-t pt-3">
          {/* Sorting and results count */}
          {suggestions.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-neutral-500">Visar {suggestions.length} förslag</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-neutral-600">Sortera:</Label>
                <Select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSortBy(e.target.value as 'score' | 'protein' | 'calories' | 'name')
                  }
                  className="h-7 text-xs"
                >
                  <option value="score">Matchning (högst först)</option>
                  <option value="protein">Protein (högst först)</option>
                  <option value="calories">Kalorier (lägst först)</option>
                  <option value="name">Namn (A-Ö)</option>
                </Select>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-xs text-neutral-500 text-center py-4">Söker...</p>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-neutral-600">
                {targetCalories > 0 && primaryMacroTarget > 0
                  ? 'Inga matchningar hittades'
                  : 'Ange målkalorier och makro för att se förslag'}
              </p>
              {targetCalories > 0 && primaryMacroTarget > 0 && (
                <div className="text-xs text-neutral-500 mt-2 space-y-1">
                  <p className="font-medium">Försök:</p>
                  <p>• Öka toleransen (justera målvärden)</p>
                  <p>• Ta bort färgfilter</p>
                  <p>• Sänk makromålen</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suggestions.map((match, index) => {
                const isFavorite = favorites?.has(match.food.id) ?? false
                return (
                  <div
                    key={match.food.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">#{index + 1}</span>
                        <p className="text-sm font-medium truncate flex items-center gap-1">
                          {match.food.name}
                          {isFavorite && <span className="text-xs text-red-500">★</span>}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {match.amount.toFixed(1)} {match.unit} ({Math.round(match.calories)} kcal)
                      </p>
                      <p className="text-xs text-neutral-400">
                        <span
                          className={
                            primaryMacro === 'protein'
                              ? 'font-bold text-blue-600'
                              : secondaryMacro === 'protein'
                                ? 'font-semibold text-blue-500'
                                : ''
                          }
                        >
                          P: {match.protein.toFixed(1)}g
                        </span>
                        {' | '}
                        <span
                          className={
                            primaryMacro === 'carbs'
                              ? 'font-bold text-green-600'
                              : secondaryMacro === 'carbs'
                                ? 'font-semibold text-green-500'
                                : ''
                          }
                        >
                          K: {match.carbs.toFixed(1)}g
                        </span>
                        {' | '}
                        <span
                          className={
                            primaryMacro === 'fat'
                              ? 'font-bold text-amber-600'
                              : secondaryMacro === 'fat'
                                ? 'font-semibold text-amber-500'
                                : ''
                          }
                        >
                          F: {match.fat.toFixed(1)}g
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {/* Favorite button */}
                      <button
                        onClick={e => handleToggleFavorite(e, match.food.id)}
                        disabled={isTogglingFavorite}
                        className="h-7 w-7 p-0 flex items-center justify-center hover:bg-neutral-100 rounded transition-colors"
                        title={isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFavorite
                              ? 'fill-red-500 text-red-500'
                              : 'text-neutral-300 hover:text-red-400'
                          }`}
                        />
                      </button>
                      {getScoreBadge(match.overallScore)}
                      {getColorBadge(match.food.energy_density_color)}
                      {onAddToMeal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onAddToMeal(match.food, match.amount, match.unit)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
