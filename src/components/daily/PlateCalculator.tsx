import { useState, useMemo } from 'react'
import { Search, Calculator, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFoodItems, type FoodItem } from '@/hooks/useFoodItems'
import { calculatePlateAmount } from '@/lib/calculations/plateCalculator'

interface PlateCalculatorProps {
  defaultCalories?: number
  onAddToMeal?: (food: FoodItem, amount: number, unit: string) => void
}

export function PlateCalculator({ defaultCalories = 0, onAddToMeal }: PlateCalculatorProps) {
  const [targetCalories, setTargetCalories] = useState<number>(defaultCalories || 300)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)

  const { data: foods } = useFoodItems()

  // Filter foods based on search
  const filteredFoods = useMemo(() => {
    if (!foods) return []
    // Show first 10 foods when no search query
    if (!searchQuery.trim()) return foods.slice(0, 10)
    const query = searchQuery.toLowerCase()
    return foods
      .filter(
        food =>
          food.name.toLowerCase().includes(query) ||
          (food.brand && food.brand.toLowerCase().includes(query))
      )
      .slice(0, 8)
  }, [foods, searchQuery])

  // Calculate plate amount
  const calculation = useMemo(() => {
    if (!selectedFood || targetCalories <= 0) return null
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary-600" />
          Portionsberäknare
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target calories input */}
        <div>
          <Label htmlFor="target-calories" className="text-sm">
            Målkalorier
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="target-calories"
              type="number"
              value={targetCalories}
              onChange={e => setTargetCalories(parseFloat(e.target.value) || 0)}
              className="flex-1"
              min={0}
            />
            <span className="self-center text-sm text-neutral-500">kcal</span>
          </div>
        </div>

        {/* Food search */}
        {!selectedFood ? (
          <div>
            <Label className="text-sm">Välj livsmedel</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Sök livsmedel..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search results */}
            {filteredFoods.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                {filteredFoods.map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full p-2 text-left hover:bg-neutral-50 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{food.name}</p>
                      <p className="text-xs text-neutral-500">
                        {food.calories} kcal / {food.default_amount} {food.default_unit}
                      </p>
                    </div>
                    {getColorBadge(food.energy_density_color)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Valt livsmedel</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFood(null)}
                className="text-xs h-6 px-2"
              >
                Ändra
              </Button>
            </div>
            <div className="mt-1 p-2 bg-neutral-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedFood.name}</p>
                <p className="text-xs text-neutral-500">
                  {selectedFood.calories} kcal / {selectedFood.default_amount}{' '}
                  {selectedFood.default_unit}
                </p>
              </div>
              {getColorBadge(selectedFood.energy_density_color)}
            </div>
          </div>
        )}

        {/* Calculation result */}
        {calculation && selectedFood && (
          <div className="border-t pt-4 space-y-3">
            <div className="text-center">
              <p className="text-sm text-neutral-600">För att få {targetCalories} kcal behöver du:</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {calculation.unitsNeeded} {calculation.unitName}
              </p>
              <p className="text-sm text-neutral-500">({calculation.weightGrams}g)</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-xs text-blue-600">Protein</p>
                <p className="font-semibold text-blue-700">{calculation.protein}g</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-green-600">Kolhydrater</p>
                <p className="font-semibold text-green-700">{calculation.carbs}g</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="text-xs text-amber-600">Fett</p>
                <p className="font-semibold text-amber-700">{calculation.fat}g</p>
              </div>
            </div>

            {onAddToMeal && (
              <Button onClick={handleAddToMeal} className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Lägg till i måltid
              </Button>
            )}
          </div>
        )}

        {/* Help text when no food selected */}
        {!selectedFood && !searchQuery && (
          <p className="text-xs text-neutral-500 text-center">
            Sök och välj ett livsmedel för att beräkna portionsstorlek
          </p>
        )}
      </CardContent>
    </Card>
  )
}
