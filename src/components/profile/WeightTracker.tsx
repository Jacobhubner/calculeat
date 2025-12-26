/**
 * WeightTracker - Viktspårning med linjediagram
 * Visar viktförändring över tid jämfört med startvikt
 *
 * Använder pending changes - ny vikt sparas inte förrän disketten klickas
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingDown, TrendingUp, Minus, Plus } from 'lucide-react'
import { useWeightHistory } from '@/hooks'
import type { Profile } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface WeightTrackerProps {
  profile: Profile
  onWeightChange: (weight: number) => void
}

export default function WeightTracker({ profile, onWeightChange }: WeightTrackerProps) {
  const [currentWeight, setCurrentWeight] = useState(profile.weight_kg?.toString() || '')
  const [showAddWeight, setShowAddWeight] = useState(false)
  const { data: weightHistory = [] } = useWeightHistory(profile.id)

  const initialWeight = profile.initial_weight_kg || 0
  const weight = profile.weight_kg || initialWeight
  const weightChange = weight - initialWeight
  const weightChangePercent = initialWeight > 0 ? ((weightChange / initialWeight) * 100) : 0

  const handleAddWeight = () => {
    const weightNum = parseFloat(currentWeight)

    if (isNaN(weightNum) || weightNum <= 0 || weightNum >= 500) {
      // Reset to profile value on invalid input
      setCurrentWeight(profile.weight_kg?.toString() || '')
      setShowAddWeight(false)
      return
    }

    // Add to pending changes
    onWeightChange(weightNum)
    setShowAddWeight(false)
  }

  // Prepare chart data
  const chartData = [
    {
      date: 'Start',
      weight: initialWeight,
      displayDate: 'Startvikt',
      isPending: false,
    },
    ...weightHistory.map(entry => ({
      date: new Date(entry.recorded_at).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
      weight: entry.weight_kg,
      displayDate: new Date(entry.recorded_at).toLocaleDateString('sv-SE'),
      isPending: false,
    })),
  ]

  // Add pending weight to chart if it differs from last saved weight
  const lastSavedWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight_kg
    : initialWeight

  if (weight !== lastSavedWeight) {
    chartData.push({
      date: 'Pending',
      weight: weight,
      displayDate: 'Osparad (pending)',
      isPending: true,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {weightChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : weightChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-amber-600" />
              ) : (
                <Minus className="h-5 w-5 text-neutral-600" />
              )}
              Viktspårning
            </CardTitle>
            <CardDescription>
              Följ din viktförändring över tid
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddWeight(!showAddWeight)}
            variant={showAddWeight ? 'secondary' : 'default'}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddWeight ? 'Dölj' : 'Lägg till vikt'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Weight Form */}
        {showAddWeight && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Ny vikt (kg)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={currentWeight}
                onChange={e => setCurrentWeight(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddWeight()
                  }
                }}
                className="flex-1 rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="75.5"
                min="20"
                max="300"
                step="0.1"
              />
              <Button onClick={handleAddWeight}>
                Lägg till
              </Button>
            </div>
          </div>
        )}

        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-neutral-600 mb-1">Startvikt</p>
            <p className="text-2xl font-bold text-neutral-900">{initialWeight.toFixed(1)} kg</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-neutral-600 mb-1">Aktuell vikt</p>
            <p className="text-2xl font-bold text-primary-600">{weight.toFixed(1)} kg</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-neutral-600 mb-1">Förändring</p>
            <p className={`text-2xl font-bold ${
              weightChange < 0 ? 'text-green-600' : weightChange > 0 ? 'text-amber-600' : 'text-neutral-900'
            }`}>
              {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </p>
            <p className={`text-xs ${
              weightChange < 0 ? 'text-green-600' : weightChange > 0 ? 'text-amber-600' : 'text-neutral-600'
            }`}>
              {weightChangePercent >= 0 ? '+' : ''}{weightChangePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Vikt (kg)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Vikt']}
                  labelFormatter={(label) => {
                    const entry = chartData.find(d => d.date === label)
                    return entry?.displayDate || label
                  }}
                />
                <ReferenceLine
                  y={initialWeight}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{ value: 'Startvikt', position: 'right', fill: '#64748b', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeDasharray={(entry: any) => entry.isPending ? "5 5" : "0"}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={payload.isPending ? 6 : 4}
                        fill={payload.isPending ? '#f59e0b' : '#16a34a'}
                        stroke={payload.isPending ? '#d97706' : 'none'}
                        strokeWidth={payload.isPending ? 2 : 0}
                      />
                    )
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length <= 1 && (
          <div className="text-center py-8 text-neutral-500">
            <p>Ingen vikthistorik ännu</p>
            <p className="text-sm mt-1">Lägg till din första viktmätning för att börja spåra</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
