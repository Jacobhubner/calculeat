import { useState, useMemo } from 'react'
import { Lightbulb, Plus, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFoodSuggestions, type SuggestionSourceFilter } from '@/hooks/useFoodSuggestions'
import type { FoodItem } from '@/hooks/useFoodItems'
import type { FoodColor } from '@/lib/calculations/colorDensity'
import { useTranslation } from 'react-i18next'

interface FoodSuggestionsProps {
  onAddToMeal?: (food: FoodItem, amount: number, unit: string) => void
}

function ColorDot({ color }: { color?: string | null }) {
  if (!color) return null
  const colorClass = {
    Green: 'bg-green-500',
    Yellow: 'bg-yellow-500',
    Orange: 'bg-orange-500',
  }[color]
  return <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorClass}`} />
}

function ScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-neutral-500'
  return <span className={`text-xs font-medium ${colorClass}`}>{Math.round(score)}%</span>
}

export function FoodSuggestions({ onAddToMeal }: FoodSuggestionsProps) {
  const { t } = useTranslation('today')

  const [targetCalories, setTargetCalories] = useState<number | ''>('')
  const [primaryMacro, setPrimaryMacro] = useState<'protein' | 'carbs' | 'fat'>('protein')
  const [primaryMacroTarget, setPrimaryMacroTarget] = useState<number | ''>('')
  const [secondaryMacro, setSecondaryMacro] = useState<'protein' | 'carbs' | 'fat' | ''>('')
  const [secondaryMacroTarget, setSecondaryMacroTarget] = useState<number | ''>(0)
  const [count, setCount] = useState<number | ''>(10)

  const [showSettings, setShowSettings] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<SuggestionSourceFilter>('alla')
  const [recipesOnly, setRecipesOnly] = useState(false)
  const [nonRecipesOnly, setNonRecipesOnly] = useState(false)
  const [filterByColor, setFilterByColor] = useState(false)
  const [showGreen, setShowGreen] = useState(true)
  const [showYellow, setShowYellow] = useState(true)
  const [showOrange, setShowOrange] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'protein' | 'calories' | 'name'>('score')

  const colorFilter = useMemo(() => {
    if (!filterByColor) return undefined
    const colors: FoodColor[] = []
    if (showGreen) colors.push('Green')
    if (showYellow) colors.push('Yellow')
    if (showOrange) colors.push('Orange')
    return colors.length > 0 ? colors : undefined
  }, [filterByColor, showGreen, showYellow, showOrange])

  const isSearchValid =
    typeof targetCalories === 'number' &&
    targetCalories > 0 &&
    typeof primaryMacroTarget === 'number' &&
    primaryMacroTarget > 0

  const { suggestions: rawSuggestions, isLoading } = useFoodSuggestions(
    {
      targetCalories: typeof targetCalories === 'number' ? targetCalories : 0,
      primaryMacro,
      primaryMacroTarget: typeof primaryMacroTarget === 'number' ? primaryMacroTarget : 0,
      secondaryMacro: secondaryMacro || undefined,
      secondaryMacroTarget: secondaryMacro
        ? typeof secondaryMacroTarget === 'number'
          ? secondaryMacroTarget
          : 0
        : undefined,
      count: typeof count === 'number' ? count : 10,
      recipesOnly,
      nonRecipesOnly,
      energyDensityColors: colorFilter,
      sourceFilter,
    },
    isSearchValid
  )

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
    return sorted
  }, [rawSuggestions, sortBy])

  const handlePrimaryMacroChange = (value: 'protein' | 'carbs' | 'fat') => {
    setPrimaryMacro(value)
    setPrimaryMacroTarget('')
    if (secondaryMacro === value) {
      setSecondaryMacro('')
      setSecondaryMacroTarget(0)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary-600" />
            {t('foodSuggestions.title')}
          </CardTitle>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-neutral-100 text-neutral-500'
            }`}
            title={t('foodSuggestions.settingsTitle')}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="number"
            value={targetCalories}
            onChange={e => {
              const val = e.target.value
              setTargetCalories(val === '' ? '' : parseInt(val))
            }}
            className="h-8 w-20 text-center"
            min={0}
            placeholder="kcal"
          />
          <span className="text-xs text-neutral-500">kcal</span>
          <span className="text-neutral-300">+</span>
          <Input
            type="number"
            value={primaryMacroTarget}
            onChange={e => {
              const val = e.target.value
              setPrimaryMacroTarget(val === '' ? '' : parseInt(val))
            }}
            className="h-8 w-16 text-center"
            min={0}
            placeholder="g"
          />
          <span className="text-xs text-neutral-500">
            {t('foodSuggestions.macroUnit', { macro: t(`foodSuggestions.macro.${primaryMacro}`) })}
          </span>
          {!isSearchValid && (
            <span className="text-xs text-neutral-400 ml-auto">
              {t('foodSuggestions.enterGoal')}
            </span>
          )}
        </div>

        {showSettings && (
          <div className="p-3 bg-neutral-50 rounded-lg space-y-3 border">
            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">
                {t('foodSuggestions.settings.primaryMacro')}
              </Label>
              <select
                value={primaryMacro}
                onChange={e =>
                  handlePrimaryMacroChange(e.target.value as 'protein' | 'carbs' | 'fat')
                }
                className="h-7 text-xs px-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="fat">{t('foodSuggestions.macro.fat')}</option>
                <option value="carbs">{t('foodSuggestions.macro.carbs')}</option>
                <option value="protein">{t('foodSuggestions.macro.protein')}</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">
                {t('foodSuggestions.settings.secondaryMacro')}
              </Label>
              <select
                value={secondaryMacro}
                onChange={e =>
                  setSecondaryMacro(e.target.value as 'protein' | 'carbs' | 'fat' | '')
                }
                className="h-7 text-xs px-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="">{t('foodSuggestions.settings.secondaryNone')}</option>
                {primaryMacro !== 'fat' && (
                  <option value="fat">{t('foodSuggestions.macro.fat')}</option>
                )}
                {primaryMacro !== 'carbs' && (
                  <option value="carbs">{t('foodSuggestions.macro.carbs')}</option>
                )}
                {primaryMacro !== 'protein' && (
                  <option value="protein">{t('foodSuggestions.macro.protein')}</option>
                )}
              </select>
              {secondaryMacro && (
                <>
                  <Input
                    type="number"
                    value={secondaryMacroTarget}
                    onChange={e => {
                      const val = e.target.value
                      setSecondaryMacroTarget(val === '' ? '' : parseInt(val))
                    }}
                    className="h-7 w-16 text-xs text-center"
                    min={0}
                  />
                  <span className="text-xs text-neutral-500">g</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">{t('foodSuggestions.settings.count')}</Label>
              <Input
                type="number"
                value={count}
                onChange={e => {
                  const val = e.target.value
                  setCount(val === '' ? '' : parseInt(val))
                }}
                className="h-7 w-16 text-xs text-center"
                min={1}
                max={50}
              />
              <Label className="text-xs shrink-0">{t('foodSuggestions.settings.sort')}</Label>
              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(e.target.value as 'score' | 'protein' | 'calories' | 'name')
                }
                className="h-7 text-xs px-2 rounded-lg border border-neutral-300 bg-white"
              >
                <option value="score">{t('foodSuggestions.sort.score')}</option>
                <option value="protein">{t('foodSuggestions.sort.protein')}</option>
                <option value="calories">{t('foodSuggestions.sort.calories')}</option>
                <option value="name">{t('foodSuggestions.sort.name')}</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">{t('foodSuggestions.settings.source')}</Label>
              <div className="flex gap-1 flex-wrap">
                {(
                  [
                    { key: 'alla', labelKey: 'settings.sourceAll' },
                    { key: 'mina', labelKey: 'settings.sourceMine' },
                    { key: 'slv', labelKey: 'settings.sourceSlv' },
                  ] as const
                ).map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSourceFilter(s.key)}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                      sourceFilter === s.key
                        ? 'bg-primary-500 text-white border-primary-600'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {t(`foodSuggestions.${s.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">{t('foodSuggestions.settings.type')}</Label>
              <div className="flex gap-1 flex-wrap">
                {(
                  [
                    { key: 'alla', labelKey: 'settings.typeAll' },
                    { key: 'recept', labelKey: 'settings.typeRecipes' },
                    { key: 'livsmedel', labelKey: 'settings.typeFoods' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setRecipesOnly(item.key === 'recept')
                      setNonRecipesOnly(item.key === 'livsmedel')
                    }}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                      (item.key === 'recept' && recipesOnly) ||
                      (item.key === 'livsmedel' && nonRecipesOnly) ||
                      (item.key === 'alla' && !recipesOnly && !nonRecipesOnly)
                        ? 'bg-primary-500 text-white border-primary-600'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {t(`foodSuggestions.${item.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">{t('foodSuggestions.settings.color')}</Label>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setFilterByColor(false)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    !filterByColor
                      ? 'bg-primary-500 text-white border-primary-600'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {t('foodSuggestions.settings.colorAll')}
                </button>
                {(
                  [
                    {
                      key: 'green',
                      labelKey: 'settings.colorGreen',
                      dot: 'bg-green-500',
                      checked: showGreen,
                      set: setShowGreen,
                    },
                    {
                      key: 'yellow',
                      labelKey: 'settings.colorYellow',
                      dot: 'bg-yellow-400',
                      checked: showYellow,
                      set: setShowYellow,
                    },
                    {
                      key: 'orange',
                      labelKey: 'settings.colorOrange',
                      dot: 'bg-orange-500',
                      checked: showOrange,
                      set: setShowOrange,
                    },
                  ] as const
                ).map(c => (
                  <button
                    key={c.key}
                    onClick={() => {
                      const next = !c.checked
                      c.set(next)
                      setFilterByColor(
                        c.key === 'green'
                          ? next || showYellow || showOrange
                          : c.key === 'yellow'
                            ? showGreen || next || showOrange
                            : showGreen || showYellow || next
                      )
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors ${
                      filterByColor && c.checked
                        ? `${c.key === 'yellow' ? 'bg-yellow-400 border-yellow-500 text-neutral-900' : c.key === 'green' ? 'bg-green-500 border-green-600 text-white' : 'bg-orange-500 border-orange-600 text-white'}`
                        : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                    {t(`foodSuggestions.${c.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-neutral-500 text-center py-4">
            {t('foodSuggestions.searching')}
          </p>
        ) : !isSearchValid ? (
          <p className="text-xs text-neutral-400 text-center py-3">
            {t('foodSuggestions.enterGoalHint')}
          </p>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-600">{t('foodSuggestions.noMatches')}</p>
            <p className="text-xs text-neutral-400 mt-1">{t('foodSuggestions.noMatchesHint')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-neutral-500 border-b pb-1">
              <span>{t('foodSuggestions.resultsCount', { count: suggestions.length })}</span>
              <span>
                {t('foodSuggestions.sortedBy')} {t(`foodSuggestions.sort.${sortBy}`)}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto -mx-1">
              {suggestions.map((match, index) => {
                return (
                  <div
                    key={match.food.id}
                    className="px-1 py-1.5 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-neutral-400 w-4 text-center flex-shrink-0">
                        {index + 1}
                      </span>

                      <span className="text-sm text-neutral-900 flex-1 min-w-0 leading-tight">
                        {match.food.name}
                      </span>

                      <span className="text-xs font-medium text-primary-600 whitespace-nowrap flex-shrink-0">
                        {match.amount.toFixed(1).replace(/\.0$/, '')} {match.unit}
                      </span>

                      <span className="text-xs text-neutral-600 whitespace-nowrap w-14 text-right flex-shrink-0">
                        {Math.round(match.calories)} kcal
                      </span>

                      {onAddToMeal && (
                        <button
                          onClick={() => {
                            const displayMode = localStorage.getItem(
                              `food-display-mode:${match.food.id}`
                            )
                            let unit = match.unit
                            let amount = match.amount

                            if (
                              match.food.ml_per_gram &&
                              (displayMode === 'perVolume' || match.food.default_unit === 'ml')
                            ) {
                              if (unit === 'g') {
                                const ml = amount * match.food.ml_per_gram
                                unit = 'ml'
                                amount = Math.round(ml * 10) / 10
                              }
                            } else if (match.food.grams_per_piece && displayMode === 'serving') {
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
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 ml-9 text-xs">
                      <ColorDot color={match.food.energy_density_color} />
                      <ScoreBadge score={match.overallScore} />
                      <span className="text-neutral-300">•</span>
                      <span
                        className={primaryMacro === 'fat' ? 'font-semibold' : 'text-neutral-500'}
                        style={primaryMacro === 'fat' ? { color: '#f5c518' } : undefined}
                      >
                        F:{match.fat.toFixed(0)}g
                      </span>
                      <span
                        className={primaryMacro === 'carbs' ? 'font-semibold' : 'text-neutral-500'}
                        style={primaryMacro === 'carbs' ? { color: '#fb923c' } : undefined}
                      >
                        K:{match.carbs.toFixed(0)}g
                      </span>
                      <span
                        className={
                          primaryMacro === 'protein' ? 'font-semibold' : 'text-neutral-500'
                        }
                        style={primaryMacro === 'protein' ? { color: '#f43f5e' } : undefined}
                      >
                        P:{match.protein.toFixed(0)}g
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
