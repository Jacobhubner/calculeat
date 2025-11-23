/**
 * MealSettingsCard - Meal configuration component
 * Allows users to customize number of meals, names, and percentage distribution
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import { Plus, X } from 'lucide-react'
import { useProfileStore } from '@/stores/profileStore'

interface Meal {
  name: string
  percentage: number
}

interface MealSettingsCardProps {
  tdee?: number
  onMealChange?: (settings: { meals: Meal[] }) => void
}

export default function MealSettingsCard({ tdee, onMealChange }: MealSettingsCardProps) {
  const activeProfile = useProfileStore(state => state.activeProfile)

  // Default meals
  const defaultMeals: Meal[] = [
    { name: 'Frukost', percentage: 30 },
    { name: 'Lunch', percentage: 30 },
    { name: 'Mellanmål', percentage: 10 },
    { name: 'Middag', percentage: 30 },
  ]

  const [meals, setMeals] = useState<Meal[]>(defaultMeals)

  // Sync with active profile when it changes
  useEffect(() => {
    if (activeProfile?.meals_config) {
      try {
        const config = activeProfile.meals_config as { meals: Meal[] }
        if (config.meals && Array.isArray(config.meals)) {
          setMeals(config.meals)
        }
      } catch (error) {
        console.error('Error parsing meals_config:', error)
        setMeals(defaultMeals)
      }
    } else {
      setMeals(defaultMeals)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id])

  // Notify parent component when meals change
  useEffect(() => {
    if (onMealChange) {
      onMealChange({ meals })
    }
  }, [meals, onMealChange])

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return meals.reduce((sum, meal) => sum + meal.percentage, 0)
  }, [meals])

  // Calculate calories for each meal
  const calculateCalories = (percentage: number) => {
    if (!tdee) return null
    return Math.round((tdee * percentage) / 100)
  }

  const handleMealNameChange = (index: number, newName: string) => {
    const updatedMeals = [...meals]
    updatedMeals[index].name = newName
    setMeals(updatedMeals)
  }

  const handleMealPercentageChange = (index: number, newPercentage: number) => {
    const updatedMeals = [...meals]
    updatedMeals[index].percentage = newPercentage
    setMeals(updatedMeals)
  }

  const handleAddMeal = () => {
    setMeals([...meals, { name: 'Ny måltid', percentage: 0 }])
  }

  const handleRemoveMeal = (index: number) => {
    if (meals.length <= 1) return // Keep at least 1 meal
    const updatedMeals = meals.filter((_, i) => i !== index)
    setMeals(updatedMeals)
  }

  const isValidTotal = totalPercentage === 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          Måltidsinställningar
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Anpassa hur många måltider du vill ha och hur kalorierna ska fördelas över dagen.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meals List */}
        <div className="space-y-3">
          {meals.map((meal, index) => (
            <div
              key={index}
              className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-2"
            >
              {/* Meal Header */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={meal.name}
                  onChange={e => handleMealNameChange(index, e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white"
                  placeholder="Måltidsnamn"
                />

                {/* Remove button (disabled if only 1 meal) */}
                <button
                  onClick={() => handleRemoveMeal(index)}
                  disabled={meals.length === 1}
                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={meals.length === 1 ? 'Du måste ha minst en måltid' : 'Ta bort måltid'}
                >
                  <X className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>

              {/* Percentage Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-neutral-600">Procent</span>
                  <div className="text-xs font-semibold text-primary-600">
                    {meal.percentage}%
                    {tdee && (
                      <span className="text-neutral-500 font-normal ml-1.5">
                        ({calculateCalories(meal.percentage)} kcal)
                      </span>
                    )}
                  </div>
                </div>
                <Slider
                  value={[meal.percentage]}
                  onValueChange={([value]) => handleMealPercentageChange(index, value)}
                  min={0}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Meal Button */}
        <Button
          onClick={handleAddMeal}
          variant="outline"
          className="w-full border-dashed border-2 hover:bg-primary-50 hover:border-primary-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          Lägg till måltid
        </Button>

        {/* Total Summary */}
        <div
          className={`p-3 rounded-lg border ${
            isValidTotal ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Total fördelning:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-base font-bold ${
                  isValidTotal ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {totalPercentage}%
              </span>
              <span className="text-xs text-neutral-600">{isValidTotal ? '✓' : '⚠️'}</span>
            </div>
          </div>
          {!isValidTotal && (
            <p className="text-[10px] text-amber-700 mt-1.5">
              Totalen måste vara exakt 100%. Justera procentsatserna ovan.
            </p>
          )}
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-neutral-700 leading-relaxed">
            💡 <strong>Tips:</strong> Fördela dina kalorier över dagen baserat på dina vanor. En
            typisk fördelning är 30% frukost, 30% lunch, 10% mellanmål och 30% middag.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
