/**
 * WeightTracker - Förbättrad viktspårning med linjediagram
 * Visar viktförändring över tid med:
 * - Målviktslinje (om satt)
 * - 7-dagars glidande medelvärde
 * - Förändringstakt (kg/vecka)
 * - Progress mot mål
 * - Kalibreringsprompt när tillgänglig
 */

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ChevronDown,
} from 'lucide-react'
import type { WeightHistory } from '@/lib/types'
import {
  useWeightHistory,
  useCreateWeightHistory,
  useDeleteWeightHistory,
  useBodyFatTrend,
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
  Brush,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

function getDateLocale() {
  return i18n.language === 'sv' ? 'sv-SE' : 'en-GB'
}

interface WeightTrackerProps {
  profile: Profile
  onWeightChange: (weight: number) => void
  onCalibrateClick?: () => void
}

export default function WeightTracker({
  profile,
  onWeightChange,
  onCalibrateClick: _onCalibrateClick,
}: WeightTrackerProps) {
  const { t } = useTranslation('profile')
  const [isOpen, setIsOpen] = useState(false)
  const [currentWeight, setCurrentWeight] = useState(profile.weight_kg?.toString() || '')
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0])
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<WeightHistory | null>(null)

  // User-based weight history (shared across all profiles)
  const { data: weightHistory = [] } = useWeightHistory()
  const createWeightHistory = useCreateWeightHistory()
  const deleteWeightHistory = useDeleteWeightHistory()

  // Calculate initial weight from oldest entry in history
  const initialWeight = useMemo(() => {
    if (weightHistory.length === 0) return 0
    const parseDate = (s: string) => new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
    const sorted = [...weightHistory].sort(
      (a, b) => parseDate(a.recorded_at).getTime() - parseDate(b.recorded_at).getTime()
    )
    return sorted[0].weight_kg
  }, [weightHistory])

  // Current weight = entry with recorded_at on or before today (end of day)
  const currentWeightFromHistory = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const endOfToday = new Date(todayStr + 'T23:59:59')
    const parseDate = (s: string) => new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
    const past = weightHistory.filter(e => parseDate(e.recorded_at) <= endOfToday)
    if (past.length === 0) return null
    past.sort((a, b) => parseDate(b.recorded_at).getTime() - parseDate(a.recorded_at).getTime())
    return past[0].weight_kg
  }, [weightHistory])

  const weight = currentWeightFromHistory ?? profile.weight_kg ?? initialWeight
  const targetWeight = profile.target_weight_kg

  // Synka profilvikten om weight_history har ett nyare värde än profile.weight_kg
  useEffect(() => {
    if (currentWeightFromHistory !== null && currentWeightFromHistory !== profile.weight_kg) {
      onWeightChange(currentWeightFromHistory)
    }
  }, [currentWeightFromHistory]) // eslint-disable-line react-hooks/exhaustive-deps

  // Use the new trend hook for calculations (user-based, no profile dependency)
  const weightTrend = useWeightTrend(weightHistory, targetWeight, weight)
  const bodyFatChartData = useBodyFatTrend(weightHistory)
  const hasBodyFatData = bodyFatChartData.length > 0

  const handleAddWeight = async () => {
    const weightNum = parseFloat(currentWeight)

    if (isNaN(weightNum) || weightNum <= 0 || weightNum >= 500) {
      setCurrentWeight(profile.weight_kg?.toString() || '')
      setShowAddWeight(false)
      return
    }

    const newRecordedAt = new Date(recordedDate + 'T00:00:00')
    const now = new Date()

    const bfParsed = bodyFatInput !== '' ? parseFloat(bodyFatInput) : NaN
    const bfValue = !isNaN(bfParsed) && bfParsed >= 0 && bfParsed <= 100 ? bfParsed : undefined

    await createWeightHistory.mutateAsync({
      weight_kg: weightNum,
      recorded_at: newRecordedAt.toISOString(),
      body_fat_percentage: bfValue,
    })

    // Uppdatera alltid profilvikten om posten är för idag eller tidigare
    if (newRecordedAt <= now) {
      onWeightChange(weightNum)
    }

    setShowAddWeight(false)
    setBodyFatInput('')
    setRecordedDate(new Date().toISOString().split('T')[0])
  }

  // Build chart data with rolling average (create a copy to avoid mutating the original)
  const chartData = useMemo(
    () => [...weightTrend.chartDataWithTrend],
    [weightTrend.chartDataWithTrend]
  )

  const weightBrushDefault = useMemo(() => {
    const cutoff = new Date().getTime() - 14 * 24 * 60 * 60 * 1000
    const idx = chartData.findIndex(d => d.timestamp >= cutoff)
    return {
      startIndex: idx >= 0 ? idx : Math.max(0, chartData.length - 1),
      endIndex: chartData.length - 1,
    }
  }, [chartData])

  const bodyFatBrushDefault = useMemo(() => {
    const cutoff = new Date().getTime() - 14 * 24 * 60 * 60 * 1000
    const idx = bodyFatChartData.findIndex(d => d.timestamp >= cutoff)
    return {
      startIndex: idx >= 0 ? idx : Math.max(0, bodyFatChartData.length - 1),
      endIndex: bodyFatChartData.length - 1,
    }
  }, [bodyFatChartData])

  // Pending-punkt borttagen — profilvikten visas inte i diagrammet om den inte är loggad

  // Calculate Y-axis domain
  const allWeights = chartData.map(d => d.weight).filter(Boolean)
  if (targetWeight) allWeights.push(targetWeight)
  if (initialWeight) allWeights.push(initialWeight)
  const minWeight = Math.min(...allWeights) - 2
  const maxWeight = Math.max(...allWeights) + 2

  const handleDeleteWeight = async () => {
    if (!deleteConfirm) return
    await deleteWeightHistory.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  // Sort weight history by date (newest first) for the list view
  const sortedHistoryForList = [...weightHistory].sort((a, b) => {
    const parseDate = (s: string) => new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
    return parseDate(b.recorded_at).getTime() - parseDate(a.recorded_at).getTime()
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center justify-between hover:opacity-70 transition-opacity"
            type="button"
          >
            <CardTitle className="flex items-center gap-2 text-lg leading-snug">
              {weightTrend.totalChangeKg < -0.1 ? (
                <TrendingDown className="h-5 w-5 text-primary-600" />
              ) : weightTrend.totalChangeKg > 0.1 ? (
                <TrendingUp className="h-5 w-5 text-primary-600" />
              ) : (
                <Minus className="h-5 w-5 text-primary-600" />
              )}
              {t('weightTracker.title')}
            </CardTitle>
            <ChevronDown
              className={`h-5 w-5 text-neutral-600 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isOpen && (
            <Button
              onClick={() => setShowAddWeight(!showAddWeight)}
              variant={showAddWeight ? 'secondary' : 'outline'}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddWeight ? t('weightTracker.hideForm') : t('weightTracker.addWeight')}
            </Button>
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-6 pt-0">
          {/* Add Weight Form */}
          {showAddWeight && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('weightTracker.newWeight')}
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
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('weightTracker.date')}
                </label>
                <input
                  type="date"
                  value={recordedDate}
                  onChange={e => setRecordedDate(e.target.value)}
                  className="w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('weightTracker.bodyFat')}{' '}
                  <span className="text-xs text-neutral-400 font-normal">
                    {t('weightTracker.bodyFatOptional')}
                  </span>
                </label>
                <input
                  type="number"
                  value={bodyFatInput}
                  onChange={e => setBodyFatInput(e.target.value)}
                  className="w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="15.0"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-neutral-400 mt-1">{t('weightTracker.bodyFatNote')}</p>
              </div>
              <Button onClick={handleAddWeight} className="w-full">
                {t('weightTracker.addButton')}
              </Button>
            </div>
          )}

          {/* Current Stats - 4 columns */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">{t('weightTracker.statStart')}</p>
              <p className="text-lg font-bold text-neutral-900">
                {initialWeight > 0 ? `${initialWeight.toFixed(1)}` : '-'}
              </p>
              <p className="text-xs text-neutral-400">kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">{t('weightTracker.statCurrent')}</p>
              <p className="text-lg font-bold text-primary-600">{weight.toFixed(1)}</p>
              <p className="text-xs text-neutral-400">kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">{t('weightTracker.statChange')}</p>
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
              <p className="text-xs text-neutral-400">{t('weightTracker.statKgTotal')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">{t('weightTracker.statTempo')}</p>
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
              <p className="text-xs text-neutral-400">{t('weightTracker.statKgWeek')}</p>
            </div>
          </div>

          {/* Progress toward goal */}
          {targetWeight && targetWeight !== initialWeight && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-medium text-neutral-700">
                    {t('weightTracker.goalProgress', { target: targetWeight })}
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
                    {t('weightTracker.projectedDate')}{' '}
                    <strong>
                      {weightTrend.projectedGoalDate.toLocaleDateString(getDateLocale(), {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>{' '}
                    {t('weightTracker.projectedWeeks', {
                      weeks: Math.round(weightTrend.weeksToGoal),
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-80" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickFormatter={ts =>
                      new Date(ts as number).toLocaleDateString(getDateLocale(), {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) =>
                      [
                        `${(value as number | undefined)?.toFixed(1)} kg`,
                        (name as string) === 'weight'
                          ? t('weightTracker.chartWeightLabel')
                          : t('weightTracker.chartRollingLabel'),
                      ] as [string, string]
                    }
                    labelFormatter={ts => {
                      const entry = chartData.find(d => d.timestamp === (ts as number))
                      return (
                        entry?.displayDate ||
                        new Date(ts as number).toLocaleDateString(getDateLocale())
                      )
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
                    formatter={value =>
                      value === 'weight'
                        ? t('weightTracker.chartWeightLabel')
                        : t('weightTracker.chartRollingLabel')
                    }
                  />

                  {/* Initial weight reference line */}
                  {initialWeight > 0 && (
                    <ReferenceLine
                      y={initialWeight}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      label={{
                        value: t('weightTracker.chartRefStart'),
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
                        value: t('weightTracker.chartRefGoal', { target: targetWeight }),
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
                    dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
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

                  <Brush
                    key={`${weightBrushDefault.startIndex}-${weightBrushDefault.endIndex}`}
                    dataKey="timestamp"
                    startIndex={weightBrushDefault.startIndex}
                    endIndex={weightBrushDefault.endIndex}
                    height={24}
                    stroke="#d1d5db"
                    fill="#f9fafb"
                    travellerWidth={8}
                    tickFormatter={ts =>
                      new Date(ts as number).toLocaleDateString(getDateLocale(), {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.length <= 1 && (
            <div className="text-center py-8 text-neutral-500">
              <p>{t('weightTracker.noHistory')}</p>
              <p className="text-sm mt-1">{t('weightTracker.noHistoryHint')}</p>
            </div>
          )}

          {/* Body fat chart */}
          {hasBodyFatData && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">
                {t('weightTracker.bodyFatChartTitle')}
              </h4>
              <div className="h-72" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={bodyFatChartData}
                    margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={['dataMin', 'dataMax']}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={ts =>
                        new Date(ts as number).toLocaleDateString(getDateLocale(), {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      label={{
                        value: '%',
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 10,
                        fill: '#6b7280',
                      }}
                    />
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) =>
                        [
                          `${(value as number).toFixed(1)}%`,
                          (name as string) === 'bodyFat'
                            ? t('weightTracker.chartBodyFatLabel')
                            : t('weightTracker.chartRollingLabel'),
                        ] as [string, string]
                      }
                      labelFormatter={ts => {
                        const entry = bodyFatChartData.find(d => d.timestamp === (ts as number))
                        return (
                          entry?.displayDate ||
                          new Date(ts as number).toLocaleDateString(getDateLocale())
                        )
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
                      formatter={value =>
                        value === 'bodyFat'
                          ? t('weightTracker.chartBodyFatLabel')
                          : t('weightTracker.chartRollingLabel')
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="bodyFat"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#f97316' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rollingAverage"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={false}
                      connectNulls={false}
                    />

                    <Brush
                      key={`${bodyFatBrushDefault.startIndex}-${bodyFatBrushDefault.endIndex}`}
                      dataKey="timestamp"
                      startIndex={bodyFatBrushDefault.startIndex}
                      endIndex={bodyFatBrushDefault.endIndex}
                      height={24}
                      stroke="#d1d5db"
                      fill="#f9fafb"
                      travellerWidth={8}
                      tickFormatter={ts =>
                        new Date(ts as number).toLocaleDateString(getDateLocale(), {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
                {showHistory
                  ? t('weightTracker.historyHide')
                  : t('weightTracker.historyShow', { count: weightHistory.length })}
              </Button>

              {showHistory && (
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                    <p className="text-sm font-medium text-neutral-700">
                      {t('weightTracker.historyTitle')}
                    </p>
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
                            {new Date(entry.recorded_at).toLocaleDateString(getDateLocale(), {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {entry.body_fat_percentage != null && (
                            <p className="text-xs text-neutral-400">
                              {t('weightTracker.historyBodyFat', {
                                value: entry.body_fat_percentage.toFixed(1),
                              })}
                            </p>
                          )}
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
                      <p className="text-sm font-medium text-red-900">
                        {t('weightTracker.deleteTitle')}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        {t('weightTracker.deleteDesc', {
                          weight: deleteConfirm.weight_kg.toFixed(1),
                          date: new Date(deleteConfirm.recorded_at).toLocaleDateString(
                            getDateLocale(),
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          ),
                        })}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>
                          {t('weightTracker.deleteCancel')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteWeight}
                          disabled={deleteWeightHistory.isPending}
                        >
                          {deleteWeightHistory.isPending
                            ? t('weightTracker.deleting')
                            : t('weightTracker.deleteConfirm')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
