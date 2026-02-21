import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateBMRWithFormula, requiresBodyFat } from '@/lib/calculations/bmr'
import { BMR_FORMULA_DESCRIPTIONS } from '@/lib/calculations/bmrDescriptions'
import type { BMRFormula } from '@/lib/calculations/bmr'
import type { Gender } from '@/lib/types'

const ALL_FORMULAS: BMRFormula[] = [
  'Mifflin-St Jeor equation',
  'Revised Harris-Benedict equation',
  'Original Harris-Benedict equation',
  'Schofield equation',
  'Oxford/Henry equation',
  'MacroFactor standard equation',
  'Cunningham equation',
  'MacroFactor FFM equation',
  'MacroFactor athlete equation',
  'Fitness Stuff Podcast equation',
]

export default function ComparisonTab() {
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [expandedFormula, setExpandedFormula] = useState<BMRFormula | null>(null)

  const params = useMemo(() => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)
    const bf = bodyFat !== '' ? parseFloat(bodyFat) : undefined
    if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) return null
    return { weight: w, height: h, age: a, gender, bodyFatPercentage: bf }
  }, [weight, height, age, gender, bodyFat])

  const bmrResults = useMemo(() => {
    if (!params) return []
    return ALL_FORMULAS.map(formula => ({
      formula,
      result: calculateBMRWithFormula(formula, params),
      needsBodyFat: requiresBodyFat(formula),
      hasBodyFat: (params.bodyFatPercentage ?? 0) > 0,
    }))
  }, [params])

  const validValues = bmrResults.filter(r => r.result !== null).map(r => r.result as number)
  const minBMR = validValues.length > 0 ? Math.min(...validValues) : null
  const maxBMR = validValues.length > 0 ? Math.max(...validValues) : null
  const avgBMR =
    validValues.length > 0
      ? Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length)
      : null

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Dina uppgifter</CardTitle>
          <CardDescription>Fyll i dina värden för att jämföra alla BMR/RMR-formler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Kön */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Kön</label>
            <div className="flex gap-2">
              {(['male', 'female'] as Gender[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    gender === g
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-400'
                  }`}
                >
                  {g === 'male' ? 'Man' : 'Kvinna'}
                </button>
              ))}
            </div>
          </div>

          {/* Ålder / Vikt / Längd */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Ålder (år) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="30"
                min="10"
                max="120"
                step="1"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Vikt (kg) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="75"
                min="20"
                max="300"
                step="0.1"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Längd (cm) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="175"
                min="100"
                max="250"
                step="1"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Kroppsfett% */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Kroppsfett%{' '}
              <span className="text-neutral-500 font-normal">(valfri – krävs för 4 formler)</span>
            </label>
            <input
              type="number"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              placeholder="15"
              min="3"
              max="60"
              step="0.1"
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resultat */}
      {params && (
        <Card>
          <CardHeader>
            <CardTitle>BMR/RMR-jämförelse</CardTitle>
            <CardDescription>
              {validValues.length > 0
                ? `${validValues.length} av ${ALL_FORMULAS.length} formler beräknade`
                : 'Fyll i ålder, vikt och längd för att se resultat'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bmrResults.map(({ formula, result, needsBodyFat, hasBodyFat }) => {
                const desc = BMR_FORMULA_DESCRIPTIONS[formula]
                const isMin = result !== null && result === minBMR && validValues.length > 1
                const isMax = result !== null && result === maxBMR && validValues.length > 1
                const missingBodyFat = needsBodyFat && !hasBodyFat
                const isExpanded = expandedFormula === formula

                return (
                  <div
                    key={formula}
                    className={`rounded-xl border transition-colors ${
                      isMin
                        ? 'bg-green-50 border-green-200'
                        : isMax
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    {/* Rad med resultat och toggle */}
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      onClick={() => setExpandedFormula(isExpanded ? null : formula)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-900">{desc.name}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-neutral-100 text-neutral-600"
                          >
                            {desc.type}
                          </Badge>
                          {isMin && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-green-100 text-green-700 border-green-300"
                            >
                              Lägst
                            </Badge>
                          )}
                          {isMax && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-orange-100 text-orange-700 border-orange-300"
                            >
                              Högst
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {missingBodyFat ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                          >
                            Kräver kroppsfett%
                          </Badge>
                        ) : result !== null ? (
                          <span
                            className={`text-lg font-bold ${
                              isMin
                                ? 'text-green-700'
                                : isMax
                                  ? 'text-orange-700'
                                  : 'text-neutral-900'
                            }`}
                          >
                            {Math.round(result)}{' '}
                            <span className="text-xs font-normal text-neutral-500">kcal</span>
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-xs text-neutral-500">
                            —
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Expanderat informationskort */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-neutral-200 mt-0 pt-3">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                          {desc.name} — {desc.year}
                        </p>
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          {desc.description}
                        </p>
                        {desc.pros.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-1">Fördelar</p>
                            <ul className="space-y-1">
                              {desc.pros.map((pro, i) => (
                                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                                  <span className="text-green-600 font-bold shrink-0">•</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {desc.cons.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-amber-700 mb-1">
                              Nackdelar / Begränsningar
                            </p>
                            <ul className="space-y-1">
                              {desc.cons.map((con, i) => (
                                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                                  <span className="text-amber-600 font-bold shrink-0">•</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Sammanfattning */}
            {validValues.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Sammanfattning ({validValues.length} formler)
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Lägst</p>
                    <p className="text-xl font-bold text-green-700">
                      {minBMR !== null ? Math.round(minBMR) : '—'}
                    </p>
                    <p className="text-xs text-neutral-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Medelvärde</p>
                    <p className="text-2xl font-bold text-blue-700">{avgBMR ?? '—'}</p>
                    <p className="text-xs text-neutral-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Högst</p>
                    <p className="text-xl font-bold text-orange-700">
                      {maxBMR !== null ? Math.round(maxBMR) : '—'}
                    </p>
                    <p className="text-xs text-neutral-400">kcal</p>
                  </div>
                </div>
                {minBMR !== null && maxBMR !== null && (
                  <p className="mt-3 text-xs text-neutral-500 text-center border-t border-blue-200 pt-3">
                    Spann: {Math.round(maxBMR - minBMR)} kcal skillnad mellan lägst och högst
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
