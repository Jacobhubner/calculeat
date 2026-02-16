/**
 * MealSettingsCard - Meal configuration component
 * Allows users to customize number of meals, names, and percentage distribution
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import { Plus, X, ChevronDown } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const activeProfile = useProfileStore(state => state.activeProfile)

  // Default meals
  const defaultMeals: Meal[] = [
    { name: 'Frukost', percentage: 25 },
    { name: 'Lunch', percentage: 30 },
    { name: 'Middag', percentage: 30 },
    { name: 'Mellanmål 1', percentage: 8 },
    { name: 'Mellanmål 2', percentage: 7 },
  ]

  const [meals, setMeals] = useState<Meal[]>(defaultMeals)
  const userHasInteracted = useRef(false)

  // Sync with active profile when it changes
  useEffect(() => {
    userHasInteracted.current = false
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

  // Notify parent component when meals change (only after user interaction)
  useEffect(() => {
    if (onMealChange && userHasInteracted.current) {
      onMealChange({ meals })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meals])

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return meals.reduce((sum, meal) => sum + meal.percentage, 0)
  }, [meals])

  // Detect duplicate meal names
  const duplicateNames = useMemo(() => {
    const nameCounts = new Map<string, number>()
    for (const meal of meals) {
      const lower = meal.name.trim().toLowerCase()
      nameCounts.set(lower, (nameCounts.get(lower) || 0) + 1)
    }
    return new Set([...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name))
  }, [meals])

  // Calculate calories for each meal
  const calculateCalories = (percentage: number) => {
    if (!tdee) return null
    return Math.round((tdee * percentage) / 100)
  }

  const handleMealNameChange = (index: number, newName: string) => {
    userHasInteracted.current = true
    setMeals(prev => prev.map((meal, i) => (i === index ? { ...meal, name: newName } : meal)))
  }

  const handleMealPercentageChange = (index: number, newPercentage: number) => {
    userHasInteracted.current = true
    setMeals(prev =>
      prev.map((meal, i) => (i === index ? { ...meal, percentage: newPercentage } : meal))
    )
  }

  const handleAddMeal = () => {
    userHasInteracted.current = true
    // Generate a unique default name to avoid UNIQUE constraint violations
    let counter = 1
    const existingNames = new Set(meals.map(m => m.name))
    while (existingNames.has(`Ny måltid ${counter}`)) {
      counter++
    }
    setMeals([...meals, { name: `Ny måltid ${counter}`, percentage: 0 }])
  }

  const handleRemoveMeal = (index: number) => {
    if (meals.length <= 1) return // Keep at least 1 meal
    userHasInteracted.current = true
    const updatedMeals = meals.filter((_, i) => i !== index)
    setMeals(updatedMeals)
  }

  const hasDuplicates = duplicateNames.size > 0
  const isValidTotal = totalPercentage === 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              Måltidsinställningar
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1 text-left">
              Anpassa hur många måltider du vill ha och hur kalorierna ska fördelas över dagen.
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* Meals List */}
          <div className="space-y-3">
            {meals.map((meal, index) => (
              <div
                key={index}
                className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-2"
              >
                {/* Meal Header */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const isDuplicate = duplicateNames.has(meal.name.trim().toLowerCase())
                    return (
                      <input
                        type="text"
                        value={meal.name}
                        onChange={e => handleMealNameChange(index, e.target.value)}
                        className={`flex-1 px-2 py-1.5 text-sm rounded-lg shadow-sm bg-white ${
                          isDuplicate
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                            : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
                        }`}
                        placeholder="Måltidsnamn"
                      />
                    )
                  })()}

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
            {hasDuplicates && (
              <p className="text-[10px] text-red-700 mt-1.5">
                Varje måltid måste ha ett unikt namn. Byt namn på dubbletter.
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
      )}
    </Card>
  )
}
