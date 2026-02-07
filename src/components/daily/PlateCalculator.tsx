import { useState, useMemo } from 'react'
import { Search, Calculator, Plus, RotateCcw, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFoodItems, type FoodItem } from '@/hooks/useFoodItems'
import { calculatePlateAmount } from '@/lib/calculations/plateCalculator'

interface PlateCalculatorProps {
  defaultCalories?: number
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
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`} />
}

export function PlateCalculator({
  defaultCalories: _defaultCalories = 0,
  onAddToMeal,
}: PlateCalculatorProps) {
  const [targetCalories, setTargetCalories] = useState<number | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)

  const { data: foods } = useFoodItems()

  // Filtrera livsmedel
  const filteredFoods = useMemo(() => {
    if (!foods) return []

    if (!searchQuery.trim()) {
      return foods.slice(0, 15)
    }

    const query = searchQuery.toLowerCase()
    return foods
      .filter(
        food =>
          food.name.toLowerCase().includes(query) ||
          (food.brand && food.brand.toLowerCase().includes(query))
      )
      .slice(0, 12)
  }, [foods, searchQuery])

  // Beräkna portion
  const calculation = useMemo(() => {
    if (!selectedFood || typeof targetCalories !== 'number' || targetCalories <= 0) return null
    return calculatePlateAmount(selectedFood, targetCalories)
  }, [selectedFood, targetCalories])

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food)
    setSearchQuery('')
  }

  const handleAddToMeal = () => {
    if (selectedFood && calculation && onAddToMeal) {
      onAddToMeal(selectedFood, calculation.unitsNeeded, calculation.unitName)
    }
  }

  const handleReset = () => {
    setSelectedFood(null)
    setTargetCalories('')
    setSearchQuery('')
  }

  // Beräkna kcal/100g för visning
  const getKcalPer100g = (food: FoodItem) => {
    if (food.kcal_per_gram) return Math.round(food.kcal_per_gram * 100)
    if (food.weight_grams && food.weight_grams > 0) {
      return Math.round((food.calories / food.weight_grams) * 100)
    }
    return food.calories
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary-600" />
            Portionsberäknare
          </CardTitle>
          {(selectedFood || targetCalories !== '' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 px-2 text-xs text-neutral-500"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Återställ
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Kalori-input med snabbval - kompakt */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-neutral-600 font-medium">Mål:</span>
          <Input
            type="number"
            value={targetCalories}
            onChange={e =>
              setTargetCalories(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
            }
            className="h-8 w-20 text-center"
            min={0}
            placeholder="kcal"
          />
          <span className="text-xs text-neutral-500">kcal</span>
          <div className="flex gap-1 ml-auto">
            {[100, 200, 300, 500].map(cal => (
              <button
                key={cal}
                onClick={() => setTargetCalories(cal)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  targetCalories === cal
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cal}
              </button>
            ))}
          </div>
        </div>

        {/* Sök eller valt livsmedel */}
        {!selectedFood ? (
          <div>
            {/* Sökfält */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Sök livsmedel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* Söklista - KOMPAKT EN-RADS FORMAT */}
            {filteredFoods.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-52 overflow-y-auto">
                {filteredFoods.map(food => (
                  <div
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 transition-colors border-b last:border-b-0 flex items-center gap-2 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleSelectFood(food)}
                  >
                    {/* Namn - kan radbrytas */}
                    <span className="text-sm text-neutral-900 flex-1 min-w-0 leading-tight">
                      {food.name}
                    </span>

                    {/* Kalorier */}
                    <span className="text-xs text-neutral-500 whitespace-nowrap flex-shrink-0">
                      {getKcalPer100g(food)} kcal
                    </span>

                    {/* Färgprick */}
                    <ColorDot color={food.energy_density_color} />
                  </div>
                ))}
              </div>
            )}

            {/* Tom text */}
            {!searchQuery && filteredFoods.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-3">Sök efter ett livsmedel</p>
            )}
          </div>
        ) : (
          <div className="border-2 border-primary-200 rounded-lg p-2.5 bg-primary-50/50">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
              <span className="text-sm font-medium text-neutral-900 flex-1 min-w-0">
                {selectedFood.name}
              </span>
              <span className="text-xs text-neutral-500 flex-shrink-0">
                {selectedFood.calories} kcal/{selectedFood.default_amount}
                {selectedFood.default_unit}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFood(null)}
                className="text-xs h-6 px-2 flex-shrink-0"
              >
                Ändra
              </Button>
            </div>
          </div>
        )}

        {/* Resultat - kompakt och snygg */}
        {calculation && selectedFood && (
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-3">
            <p className="text-xs text-neutral-600 text-center mb-2">
              För {typeof targetCalories === 'number' ? targetCalories : 0} kcal:
            </p>

            {/* Stor resultat-display */}
            <div className="bg-white rounded-lg py-2 px-3 text-center shadow-sm mb-2">
              {calculation.unitName === 'g' ? (
                /* För gram-baserade: visa bara vikten direkt */
                <span className="text-2xl font-bold text-primary-600">
                  {calculation.weightGrams} g
                </span>
              ) : (
                /* För andra enheter: visa enheter + vikt */
                <>
                  <span className="text-2xl font-bold text-primary-600">
                    {calculation.unitsNeeded} {calculation.unitName}
                  </span>
                  <span className="text-sm text-neutral-500 ml-2">
                    ({calculation.weightGrams}g)
                  </span>
                </>
              )}
            </div>

            {/* Makros i rad - kompakt */}
            <div className="flex justify-center gap-3 text-xs mb-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="font-semibold text-blue-700">P:{calculation.protein}g</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="font-semibold text-green-700">K:{calculation.carbs}g</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-amber-700">F:{calculation.fat}g</span>
              </span>
            </div>

            {onAddToMeal && (
              <Button onClick={handleAddToMeal} className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Lägg till i måltid
              </Button>
            )}
          </div>
        )}

        {/* Hjälptext */}
        {!selectedFood && !calculation && (
          <p className="text-xs text-neutral-400 text-center">Välj kalorimål och livsmedel</p>
        )}
      </CardContent>
    </Card>
  )
}
