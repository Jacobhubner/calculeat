import { useState, useMemo } from 'react'
import { Search, Calculator, Plus, RotateCcw, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { FoodItem } from '@/hooks/useFoodItems'
import { calculatePlateAmount, calculatePlateForMacro } from '@/lib/calculations/plateCalculator'
import { AddFoodToMealModal } from '@/components/daily/AddFoodToMealModal'
import { useTranslation } from 'react-i18next'

type GoalType = 'kcal' | 'carbs' | 'fat' | 'protein'

const PRESETS: Record<GoalType, number[]> = {
  kcal: [100, 200, 300, 500],
  carbs: [50, 100, 150, 200, 300],
  fat: [20, 40, 60, 80, 100],
  protein: [30, 60, 90, 120, 150],
}

const GOAL_UNITS: Record<GoalType, string> = {
  kcal: 'kcal',
  carbs: 'g',
  fat: 'g',
  protein: 'g',
}

interface PlateCalculatorProps {
  onAddToMeal?: (food: FoodItem, amount: number, unit: string) => void
}

export function PlateCalculator({ onAddToMeal }: PlateCalculatorProps) {
  const { t } = useTranslation('today')
  const [goalType, setGoalType] = useState<GoalType>('kcal')
  const [targetAmount, setTargetAmount] = useState<number | ''>('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const calculation = useMemo(() => {
    if (!selectedFood || typeof targetAmount !== 'number' || targetAmount <= 0) return null

    if (goalType === 'kcal') {
      return calculatePlateAmount(selectedFood, targetAmount)
    } else {
      return calculatePlateForMacro(selectedFood, targetAmount, goalType)
    }
  }, [selectedFood, targetAmount, goalType])

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food)
  }

  const handleAddToMeal = () => {
    if (selectedFood && calculation && onAddToMeal) {
      const displayMode = localStorage.getItem(`food-display-mode:${selectedFood.id}`)
      const preferVolume = displayMode === 'perVolume' || selectedFood.default_unit === 'ml'
      const ml = selectedFood.ml_per_gram
        ? Math.round(calculation.weightGrams * selectedFood.ml_per_gram * 10) / 10
        : null

      if (calculation.unitName === 'g' && ml && preferVolume) {
        onAddToMeal(selectedFood, ml, 'ml')
      } else if (calculation.unitName === 'g' && ml && !preferVolume) {
        onAddToMeal(selectedFood, calculation.weightGrams, 'g')
      } else {
        onAddToMeal(selectedFood, calculation.unitsNeeded, calculation.unitName)
      }
    }
  }

  const handlePresetClick = (value: number) => {
    setTargetAmount(value)
  }

  const handleReset = () => {
    setSelectedFood(null)
    setTargetAmount('')
    setGoalType('kcal')
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary-600" />
            {t('plateCalculator.title')}
          </CardTitle>
          {(selectedFood || targetAmount !== '') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 px-2 text-xs text-neutral-500"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('plateCalculator.reset')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
          {(['kcal', 'fat', 'carbs', 'protein'] as GoalType[]).map(type => (
            <button
              key={type}
              onClick={() => setGoalType(type)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                goalType === type
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t(`plateCalculator.goalType.${type}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-neutral-600 font-medium">
            {t('plateCalculator.goalLabel')}
          </span>
          <Input
            type="number"
            value={targetAmount}
            onChange={e => {
              const val = e.target.value
              setTargetAmount(val === '' ? '' : parseFloat(val))
            }}
            className="h-8 w-20 text-center"
            min={0}
            placeholder={GOAL_UNITS[goalType]}
          />
          <span className="text-xs text-neutral-500">{GOAL_UNITS[goalType]}</span>
          <div className="flex gap-1 ml-auto flex-wrap">
            {PRESETS[goalType].map(value => (
              <button
                key={value}
                onClick={() => handlePresetClick(value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  targetAmount === value
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {!selectedFood ? (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-300"
            onClick={() => setPickerOpen(true)}
          >
            <Search className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            <span className="text-neutral-400 text-sm">
              {t('plateCalculator.searchPlaceholder')}
            </span>
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
                {t('plateCalculator.change')}
              </Button>
            </div>
          </div>
        )}

        {calculation && selectedFood && (
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-3">
            <p className="text-xs text-neutral-600 text-center mb-2">
              {t('plateCalculator.forAmount', {
                amount: typeof targetAmount === 'number' ? targetAmount : 0,
                unit: GOAL_UNITS[goalType],
              })}
              {goalType !== 'kcal' && ` (${calculation.calories} kcal)`}:
            </p>

            <div className="bg-white rounded-lg py-2 px-3 text-center shadow-sm mb-2">
              {(() => {
                const displayMode = localStorage.getItem(`food-display-mode:${selectedFood.id}`)
                const preferVolume =
                  displayMode === 'perVolume' || selectedFood.default_unit === 'ml'

                const mlFromGrams = selectedFood.ml_per_gram
                  ? Math.round(calculation.weightGrams * selectedFood.ml_per_gram * 10) / 10
                  : null

                const isVolumeUnit = ['ml', 'dl', 'msk', 'tsk'].includes(calculation.unitName)

                if (calculation.unitName === 'g') {
                  return (
                    <span className="text-2xl font-bold text-primary-600">
                      {mlFromGrams && preferVolume ? (
                        <>
                          {mlFromGrams} ml{' '}
                          <span className="text-sm text-neutral-500">
                            ({calculation.weightGrams}g)
                          </span>
                        </>
                      ) : (
                        <>
                          {calculation.weightGrams} g
                          {mlFromGrams && (
                            <span className="text-sm text-neutral-500 ml-2">
                              ({mlFromGrams} ml)
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  )
                } else if (isVolumeUnit && mlFromGrams) {
                  return (
                    <span className="text-2xl font-bold text-primary-600">
                      {preferVolume ? (
                        <>
                          {mlFromGrams} ml{' '}
                          <span className="text-sm text-neutral-500">
                            ({calculation.weightGrams}g)
                          </span>
                        </>
                      ) : (
                        <>
                          {calculation.weightGrams} g{' '}
                          <span className="text-sm text-neutral-500">({mlFromGrams} ml)</span>
                        </>
                      )}
                    </span>
                  )
                } else {
                  return (
                    <>
                      <span className="text-2xl font-bold text-primary-600">
                        {calculation.unitsNeeded} {calculation.unitName}
                      </span>
                      <span className="text-sm text-neutral-500 ml-2">
                        ({calculation.weightGrams}g{mlFromGrams && `, ${mlFromGrams} ml`})
                      </span>
                    </>
                  )
                }
              })()}
            </div>

            <div className="flex justify-center gap-3 text-xs mb-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f5c518' }} />
                <span className="font-semibold" style={{ color: '#f5c518' }}>
                  F:{calculation.fat}g
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#fb923c' }} />
                <span className="font-semibold" style={{ color: '#fb923c' }}>
                  K:{calculation.carbs}g
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f43f5e' }} />
                <span className="font-semibold" style={{ color: '#f43f5e' }}>
                  P:{calculation.protein}g
                </span>
              </span>
            </div>

            {onAddToMeal && (
              <Button onClick={handleAddToMeal} className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" />
                {t('plateCalculator.addToMeal')}
              </Button>
            )}
          </div>
        )}

        {!selectedFood && !calculation && (
          <p className="text-xs text-neutral-400 text-center">{t('plateCalculator.helpText')}</p>
        )}
      </CardContent>

      <AddFoodToMealModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mealName=""
        dailyLogId=""
        onFoodSelect={handleSelectFood}
      />
    </Card>
  )
}
