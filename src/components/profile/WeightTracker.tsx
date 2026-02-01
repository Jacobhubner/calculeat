/**
 * WeightTracker - Förbättrad viktspårning med linjediagram
 * Visar viktförändring över tid med:
 * - Målviktslinje (om satt)
 * - 7-dagars glidande medelvärde
 * - Förändringstakt (kg/vecka)
 * - Progress mot mål
 * - Kalibreringsprompt när tillgänglig
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Target,
  Calendar,
  List,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { WeightHistory } from '@/lib/types'
import {
  useWeightHistory,
  useDeleteWeightHistory,
  useCalibrationAvailability,
  useLastCalibration,
} from '@/hooks'
import { useWeightTrend } from '@/hooks/useWeightTrend'
import type { Profile } from '@/lib/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import CalibrationPrompt from './CalibrationPrompt'

interface WeightTrackerProps {
  profile: Profile
  onWeightChange: (weight: number) => void
  onCalibrateClick?: () => void
}

export default function WeightTracker({
  profile,
  onWeightChange,
  onCalibrateClick,
}: WeightTrackerProps) {
  const [currentWeight, setCurrentWeight] = useState(profile.weight_kg?.toString() || '')
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<WeightHistory | null>(null)

  // User-based weight history (shared across all profiles)
  const { data: weightHistory = [] } = useWeightHistory()
  const deleteWeightHistory = useDeleteWeightHistory()
  const { data: lastCalibration } = useLastCalibration(profile.id)

  // Calculate initial weight from oldest entry in history
  const initialWeight = useMemo(() => {
    if (weightHistory.length === 0) return 0
    const sorted = [...weightHistory].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    return sorted[0].weight_kg
  }, [weightHistory])

  const weight = profile.weight_kg || initialWeight
  const targetWeight = profile.target_weight_kg

  // Use the new trend hook for calculations (user-based, no profile dependency)
  const weightTrend = useWeightTrend(weightHistory, targetWeight, weight)

  // Check if calibration is available
  const calibrationAvailability = useCalibrationAvailability(
    profile,
    weightHistory,
    lastCalibration
  )

  const handleAddWeight = () => {
    const weightNum = parseFloat(currentWeight)

    if (isNaN(weightNum) || weightNum <= 0 || weightNum >= 500) {
      setCurrentWeight(profile.weight_kg?.toString() || '')
      setShowAddWeight(false)
      return
    }

    onWeightChange(weightNum)
    setShowAddWeight(false)
  }

  // Build chart data with rolling average (create a copy to avoid mutating the original)
  const chartData = [...weightTrend.chartDataWithTrend]

  // Add pending weight to chart if it differs from last saved weight
  const sortedForLastSaved = [...weightHistory].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  )
  const lastSavedWeight =
    sortedForLastSaved.length > 0 ? sortedForLastSaved[0].weight_kg : initialWeight

  if (weight !== lastSavedWeight && chartData.length > 0) {
    chartData.push({
      date: 'Nu',
      weight: weight,
      rollingAverage: null,
      displayDate: 'Osparad (pending)',
      isPending: true,
    })
  }

  // Calculate Y-axis domain
  const allWeights = chartData.map(d => d.weight).filter(Boolean)
  if (targetWeight) allWeights.push(targetWeight)
  if (initialWeight) allWeights.push(initialWeight)
  const minWeight = Math.min(...allWeights) - 2
  const maxWeight = Math.max(...allWeights) + 2

  const handleCalibrateClick = () => {
    if (onCalibrateClick) {
      onCalibrateClick()
    }
  }

  const handleDeleteWeight = async () => {
    if (!deleteConfirm) return
    await deleteWeightHistory.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  // Sort weight history by date (newest first) for the list view
  const sortedHistoryForList = [...weightHistory].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {weightTrend.totalChangeKg < -0.1 ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : weightTrend.totalChangeKg > 0.1 ? (
                <TrendingUp className="h-5 w-5 text-amber-600" />
              ) : (
                <Minus className="h-5 w-5 text-neutral-600" />
              )}
              Viktspårning
            </CardTitle>
            <CardDescription>Följ din viktförändring över tid</CardDescription>
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">Ny vikt (kg)</label>
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
              <Button onClick={handleAddWeight}>Lägg till</Button>
            </div>
          </div>
        )}

        {/* Current Stats - 4 columns */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-neutral-500 mb-1">Startvikt</p>
            <p className="text-lg font-bold text-neutral-900">
              {initialWeight > 0 ? `${initialWeight.toFixed(1)}` : '-'}
            </p>
            <p className="text-xs text-neutral-400">kg</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 mb-1">Aktuell</p>
            <p className="text-lg font-bold text-primary-600">{weight.toFixed(1)}</p>
            <p className="text-xs text-neutral-400">kg</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 mb-1">Förändring</p>
            <p
              className={`text-lg font-bold ${
                weightTrend.totalChangeKg < -0.1
                  ? 'text-green-600'
                  : weightTrend.totalChangeKg > 0.1
                    ? 'text-amber-600'
                    : 'text-neutral-900'
              }`}
            >
              {weightTrend.totalChangeKg >= 0 ? '+' : ''}
              {weightTrend.totalChangeKg.toFixed(1)}
            </p>
            <p className="text-xs text-neutral-400">kg totalt</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 mb-1">Tempo</p>
            <p
              className={`text-lg font-bold ${
                weightTrend.weeklyChangeKg !== null
                  ? weightTrend.weeklyChangeKg < -0.1
                    ? 'text-green-600'
                    : weightTrend.weeklyChangeKg > 0.1
                      ? 'text-amber-600'
                      : 'text-neutral-900'
                  : 'text-neutral-400'
              }`}
            >
              {weightTrend.weeklyChangeKg !== null
                ? `${weightTrend.weeklyChangeKg >= 0 ? '+' : ''}${weightTrend.weeklyChangeKg.toFixed(2)}`
                : '-'}
            </p>
            <p className="text-xs text-neutral-400">kg/vecka</p>
          </div>
        </div>

        {/* Progress toward goal */}
        {targetWeight && targetWeight !== initialWeight && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary-500" />
                <span className="text-sm font-medium text-neutral-700">
                  Framsteg mot mål: {targetWeight} kg
                </span>
              </div>
              {weightTrend.progressPercent !== null && (
                <span className="text-sm font-bold text-primary-600">
                  {Math.round(weightTrend.progressPercent)}%
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, weightTrend.progressPercent || 0)}%` }}
              />
            </div>

            {/* Projected goal date */}
            {weightTrend.projectedGoalDate && weightTrend.weeksToGoal && (
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Calendar className="h-3 w-3" />
                <span>
                  Beräknat måldatum:{' '}
                  <strong>
                    {weightTrend.projectedGoalDate.toLocaleDateString('sv-SE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>{' '}
                  ({Math.round(weightTrend.weeksToGoal)} veckor)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[minWeight, maxWeight]}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  label={{
                    value: 'kg',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: '#6b7280',
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value?.toFixed(1)} kg`,
                    name === 'weight' ? 'Vikt' : '7-dagars snitt',
                  ]}
                  labelFormatter={label => {
                    const entry = chartData.find(d => d.date === label)
                    return entry?.displayDate || label
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={value => (value === 'weight' ? 'Vikt' : '7-dagars snitt')}
                />

                {/* Initial weight reference line */}
                {initialWeight > 0 && (
                  <ReferenceLine
                    y={initialWeight}
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                    label={{
                      value: 'Start',
                      position: 'right',
                      fill: '#64748b',
                      fontSize: 10,
                    }}
                  />
                )}

                {/* Target weight reference line */}
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="#10b981"
                    strokeDasharray="8 4"
                    label={{
                      value: `Mål: ${targetWeight} kg`,
                      position: 'right',
                      fill: '#059669',
                      fontSize: 10,
                    }}
                  />
                )}

                {/* Main weight line */}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={(props: unknown) => {
                    const typedProps = props as {
                      cx: number
                      cy: number
                      payload: { isPending?: boolean }
                    }
                    const { cx, cy, payload } = typedProps
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={payload.isPending ? 6 : 4}
                        fill={payload.isPending ? '#f59e0b' : '#16a34a'}
                        stroke={payload.isPending ? '#d97706' : 'none'}
                        strokeWidth={payload.isPending ? 2 : 0}
                      />
                    )
                  }}
                  activeDot={{ r: 6, fill: '#16a34a' }}
                />

                {/* Rolling average line */}
                <Line
                  type="monotone"
                  dataKey="rollingAverage"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  connectNulls={false}
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

        {/* Weight history management */}
        {weightHistory.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full"
            >
              <List className="h-4 w-4 mr-2" />
              {showHistory ? 'Dölj historik' : `Visa historik (${weightHistory.length} mätningar)`}
            </Button>

            {showHistory && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                  <p className="text-sm font-medium text-neutral-700">Vikthistorik</p>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                  {sortedHistoryForList.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {entry.weight_kg.toFixed(1)} kg
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(entry.recorded_at).toLocaleDateString('sv-SE', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(entry)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete confirmation dialog */}
            {deleteConfirm && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Radera viktmätning?</p>
                    <p className="text-sm text-red-700 mt-1">
                      {deleteConfirm.weight_kg.toFixed(1)} kg från{' '}
                      {new Date(deleteConfirm.recorded_at).toLocaleDateString('sv-SE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>
                        Avbryt
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteWeight}
                        disabled={deleteWeightHistory.isPending}
                      >
                        {deleteWeightHistory.isPending ? 'Raderar...' : 'Radera'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calibration prompt */}
        {calibrationAvailability.isAvailable && (
          <CalibrationPrompt
            availability={calibrationAvailability}
            lastCalibration={lastCalibration || null}
            onCalibrate={handleCalibrateClick}
            className="mt-4"
          />
        )}
      </CardContent>
    </Card>
  )
}
