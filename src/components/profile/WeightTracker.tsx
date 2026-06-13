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
import { Portal } from '@/components/ui/portal'
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
  Info,
  X,
} from 'lucide-react'
import type { WeightHistory } from '@/lib/types'
import {
  useWeightHistory,
  useCreateWeightHistory,
  useDeleteWeightHistory,
  useBodyFatTrend,
  useBodyCompositionTrend,
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
  const [showBodyFatInfo, setShowBodyFatInfo] = useState(false)
  const [showBodyFatMassInfo, setShowBodyFatMassInfo] = useState(false)
  const [showSoftLeanMassInfo, setShowSoftLeanMassInfo] = useState(false)
  const [showBodyFatMassChart, setShowBodyFatMassChart] = useState(false)
  const [showSoftLeanMassChart, setShowSoftLeanMassChart] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [bfmChartReady, setBfmChartReady] = useState(false)
  const [slmChartReady, setSlmChartReady] = useState(false)
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d')

  useEffect(() => {
    if (isOpen) {
      let id2: number
      const id = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setChartsReady(true))
      })
      return () => {
        cancelAnimationFrame(id)
        cancelAnimationFrame(id2)
      }
    } else {
      setChartsReady(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (showBodyFatMassChart) {
      let id2: number
      const id = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setBfmChartReady(true))
      })
      return () => {
        cancelAnimationFrame(id)
        cancelAnimationFrame(id2)
      }
    } else {
      setBfmChartReady(false)
    }
  }, [showBodyFatMassChart])

  useEffect(() => {
    if (showSoftLeanMassChart) {
      let id2: number
      const id = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setSlmChartReady(true))
      })
      return () => {
        cancelAnimationFrame(id)
        cancelAnimationFrame(id2)
      }
    } else {
      setSlmChartReady(false)
    }
  }, [showSoftLeanMassChart])

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
  const bodyCompositionChartData = useBodyCompositionTrend(weightHistory)

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

  // Brush-data = den bredare period som fungerar som "minimap"
  // 7d → brush visar 30d, 30d → 90d, 90d → allt, all → allt (ingen brush)
  const brushCutoff = useMemo(() => {
    if (chartRange === 'all' || chartRange === '90d') return 0
    const days = chartRange === '7d' ? 30 : 90
    return new Date().getTime() - days * 24 * 60 * 60 * 1000
  }, [chartRange])

  const brushChartData = useMemo(
    () => (brushCutoff === 0 ? chartData : chartData.filter(d => d.timestamp >= brushCutoff)),
    [chartData, brushCutoff]
  )

  const brushBodyFatData = useMemo(
    () =>
      brushCutoff === 0
        ? bodyFatChartData
        : bodyFatChartData.filter(d => d.timestamp >= brushCutoff),
    [bodyFatChartData, brushCutoff]
  )

  const brushBodyCompositionData = useMemo(
    () =>
      brushCutoff === 0
        ? bodyCompositionChartData
        : bodyCompositionChartData.filter(d => d.timestamp >= brushCutoff),
    [bodyCompositionChartData, brushCutoff]
  )

  // startIndex/endIndex för brush — det valda fönstret inom brush-data
  const viewCutoff = useMemo(() => {
    if (chartRange === 'all') return 0
    const days = chartRange === '7d' ? 7 : chartRange === '30d' ? 30 : 90
    return new Date().getTime() - days * 24 * 60 * 60 * 1000
  }, [chartRange])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nowTs = useMemo(() => new Date().getTime(), [chartRange])

  const brushDefaultForData = (data: { timestamp: number }[]) => {
    if (chartRange === 'all') return undefined
    const idx = data.findIndex(d => d.timestamp >= viewCutoff)
    return {
      startIndex: idx >= 0 ? idx : Math.max(0, data.length - 1),
      endIndex: data.length - 1,
    }
  }

  // Brush window state (timestamps) — styr XAxis domain
  const [weightBrushTs, setWeightBrushTs] = useState<{ start: number; end: number } | null>(null)
  const [bodyFatBrushTs, setBodyFatBrushTs] = useState<{ start: number; end: number } | null>(null)
  const [bodyCompBrushTs, setBodyCompBrushTs] = useState<{ start: number; end: number } | null>(
    null
  )

  // Återställ brush-fönstret när range-knapp trycks
  useEffect(() => {
    setWeightBrushTs(null)
    setBodyFatBrushTs(null)
    setBodyCompBrushTs(null)
  }, [chartRange])

  // Filtrerade data för Y-axel-domän (baserat på brush-fönster om aktivt, annars view cutoff)
  const filteredChartData = useMemo(() => {
    if (chartRange === 'all') return chartData
    if (weightBrushTs)
      return chartData.filter(
        d => d.timestamp >= weightBrushTs.start && d.timestamp <= weightBrushTs.end
      )
    return chartData.filter(d => d.timestamp >= viewCutoff)
  }, [chartData, chartRange, viewCutoff, weightBrushTs])

  // Pending-punkt borttagen — profilvikten visas inte i diagrammet om den inte är loggad

  const allWeights = filteredChartData.map(d => d.weight).filter(Boolean)
  if (targetWeight) allWeights.push(targetWeight)
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

          {/* Chart range filter */}
          {chartsReady && chartData.length > 1 && (
            <div className="flex gap-1 mb-2">
              {(['7d', '30d', '90d', 'all'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    chartRange === r
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {r === 'all' ? t('weightTracker.rangeAll') : r}
                </button>
              ))}
            </div>
          )}

          {/* Chart */}
          {chartsReady && chartData.length > 1 && (
            <div className="h-80" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={brushChartData}
                  margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={
                      weightBrushTs
                        ? [weightBrushTs.start, weightBrushTs.end]
                        : chartRange === 'all'
                          ? ['dataMin', 'dataMax']
                          : [
                              viewCutoff,
                              brushChartData[brushChartData.length - 1]?.timestamp ?? nowTs,
                            ]
                    }
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
                      const entry = brushChartData.find(d => d.timestamp === (ts as number))
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

                  {chartRange !== 'all' &&
                    (() => {
                      const bd = brushDefaultForData(brushChartData)
                      return bd ? (
                        <Brush
                          key={`w-${chartRange}`}
                          dataKey="timestamp"
                          startIndex={bd.startIndex}
                          endIndex={bd.endIndex}
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
                          onChange={e => {
                            if (e.startIndex == null || e.endIndex == null) return
                            const s = brushChartData[e.startIndex]?.timestamp
                            const en = brushChartData[e.endIndex]?.timestamp
                            if (s != null && en != null) setWeightBrushTs({ start: s, end: en })
                          }}
                        />
                      ) : null
                    })()}
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
          {chartsReady && hasBodyFatData && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <h4 className="text-sm font-medium text-neutral-700">
                  {t('weightTracker.bodyFatChartTitle')}
                </h4>
                <button
                  onClick={() => setShowBodyFatInfo(true)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  type="button"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="h-72" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={brushBodyFatData}
                    margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      scale="time"
                      domain={
                        bodyFatBrushTs
                          ? [bodyFatBrushTs.start, bodyFatBrushTs.end]
                          : chartRange === 'all'
                            ? ['dataMin', 'dataMax']
                            : [
                                viewCutoff,
                                brushBodyFatData[brushBodyFatData.length - 1]?.timestamp ?? nowTs,
                              ]
                      }
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
                        const entry = brushBodyFatData.find(d => d.timestamp === (ts as number))
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
                    {chartRange !== 'all' &&
                      (() => {
                        const bd = brushDefaultForData(brushBodyFatData)
                        return bd ? (
                          <Brush
                            key={`bf-${chartRange}`}
                            dataKey="timestamp"
                            startIndex={bd.startIndex}
                            endIndex={bd.endIndex}
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
                            onChange={e => {
                              if (e.startIndex == null || e.endIndex == null) return
                              const s = brushBodyFatData[e.startIndex]?.timestamp
                              const en = brushBodyFatData[e.endIndex]?.timestamp
                              if (s != null && en != null) setBodyFatBrushTs({ start: s, end: en })
                            }}
                          />
                        ) : null
                      })()}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Body Fat Mass chart
              TODO: Add Skeletal Muscle Mass series when a validated estimation model or smart scale data is available. */}
          {bodyCompositionChartData.length > 0 && (
            <div>
              <div
                onClick={() => setShowBodyFatMassChart(v => !v)}
                className="flex items-center gap-1.5 w-full text-left mb-2 hover:opacity-70 transition-opacity cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setShowBodyFatMassChart(v => !v)}
              >
                <h4 className="text-sm font-medium text-neutral-700">
                  {t('weightTracker.chartBodyFatMassTitle')}
                </h4>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${showBodyFatMassChart ? 'rotate-180' : ''}`}
                />
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setShowBodyFatMassInfo(true)
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors ml-auto"
                  type="button"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              {bfmChartReady && (
                <div className="h-72" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={brushBodyCompositionData}
                      margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        domain={
                          bodyCompBrushTs
                            ? [bodyCompBrushTs.start, bodyCompBrushTs.end]
                            : chartRange === 'all'
                              ? ['dataMin', 'dataMax']
                              : [
                                  viewCutoff,
                                  brushBodyCompositionData[brushBodyCompositionData.length - 1]
                                    ?.timestamp ?? nowTs,
                                ]
                        }
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
                            `${(value as number).toFixed(1)} kg`,
                            (name as string) === 'bodyFatMass'
                              ? t('weightTracker.chartBodyFatMassLabel')
                              : t('weightTracker.chartRollingLabel'),
                          ] as [string, string]
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        labelFormatter={(_ts: any, payload: any) =>
                          payload?.[0]?.payload?.displayDate ?? ''
                        }
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
                          value === 'bodyFatMass'
                            ? t('weightTracker.chartBodyFatMassLabel')
                            : t('weightTracker.chartRollingLabel')
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="bodyFatMass"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#ef4444' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bodyFatMassRolling"
                        stroke="#f97316"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        connectNulls={false}
                      />
                      {chartRange !== 'all' &&
                        (() => {
                          const bd = brushDefaultForData(brushBodyCompositionData)
                          return bd ? (
                            <Brush
                              key={`bfm-${chartRange}`}
                              dataKey="timestamp"
                              startIndex={bd.startIndex}
                              endIndex={bd.endIndex}
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
                              onChange={e => {
                                if (e.startIndex == null || e.endIndex == null) return
                                const s = brushBodyCompositionData[e.startIndex]?.timestamp
                                const en = brushBodyCompositionData[e.endIndex]?.timestamp
                                if (s != null && en != null)
                                  setBodyCompBrushTs({ start: s, end: en })
                              }}
                            />
                          ) : null
                        })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Soft Lean Mass chart */}
          {bodyCompositionChartData.length > 0 && (
            <div>
              <div
                onClick={() => setShowSoftLeanMassChart(v => !v)}
                className="flex items-center gap-1.5 w-full text-left mb-2 hover:opacity-70 transition-opacity cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setShowSoftLeanMassChart(v => !v)}
              >
                <h4 className="text-sm font-medium text-neutral-700">
                  {t('weightTracker.chartSoftLeanMassTitle')}
                </h4>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${showSoftLeanMassChart ? 'rotate-180' : ''}`}
                />
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setShowSoftLeanMassInfo(true)
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors ml-auto"
                  type="button"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              {slmChartReady && (
                <div className="h-72" style={{ minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={brushBodyCompositionData}
                      margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        domain={
                          bodyCompBrushTs
                            ? [bodyCompBrushTs.start, bodyCompBrushTs.end]
                            : chartRange === 'all'
                              ? ['dataMin', 'dataMax']
                              : [
                                  viewCutoff,
                                  brushBodyCompositionData[brushBodyCompositionData.length - 1]
                                    ?.timestamp ?? nowTs,
                                ]
                        }
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
                            `${(value as number).toFixed(1)} kg`,
                            (name as string) === 'softLeanMass'
                              ? t('weightTracker.chartSoftLeanMassLabel')
                              : t('weightTracker.chartRollingLabel'),
                          ] as [string, string]
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        labelFormatter={(_ts: any, payload: any) =>
                          payload?.[0]?.payload?.displayDate ?? ''
                        }
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
                          value === 'softLeanMass'
                            ? t('weightTracker.chartSoftLeanMassLabel')
                            : t('weightTracker.chartRollingLabel')
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="softLeanMass"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#3b82f6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="softLeanMassRolling"
                        stroke="#a855f7"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={false}
                        connectNulls={false}
                      />
                      {chartRange !== 'all' &&
                        (() => {
                          const bd = brushDefaultForData(brushBodyCompositionData)
                          return bd ? (
                            <Brush
                              key={`slm-${chartRange}`}
                              dataKey="timestamp"
                              startIndex={bd.startIndex}
                              endIndex={bd.endIndex}
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
                              onChange={e => {
                                if (e.startIndex == null || e.endIndex == null) return
                                const s = brushBodyCompositionData[e.startIndex]?.timestamp
                                const en = brushBodyCompositionData[e.endIndex]?.timestamp
                                if (s != null && en != null)
                                  setBodyCompBrushTs({ start: s, end: en })
                              }}
                            />
                          ) : null
                        })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
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

      {/* Info modals */}
      {[
        {
          open: showBodyFatInfo,
          onClose: () => setShowBodyFatInfo(false),
          title: t('weightTracker.bodyFatChartTitle'),
          body: t('weightTracker.infoBodyFat'),
        },
        {
          open: showBodyFatMassInfo,
          onClose: () => setShowBodyFatMassInfo(false),
          title: t('weightTracker.chartBodyFatMassTitle'),
          body: t('weightTracker.infoBodyFatMass'),
        },
        {
          open: showSoftLeanMassInfo,
          onClose: () => setShowSoftLeanMassInfo(false),
          title: t('weightTracker.chartSoftLeanMassTitle'),
          body: t('weightTracker.infoSoftLeanMass'),
        },
      ].map(({ open, onClose, title, body }) =>
        open ? (
          <Portal key={title}>
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
              onClick={onClose}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-start rounded-t-2xl">
                  <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
                  <button
                    onClick={onClose}
                    className="text-neutral-500 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-neutral-600 leading-relaxed">{body}</p>
                </div>
                <div className="sticky bottom-0 bg-neutral-50 px-6 py-4 rounded-b-2xl border-t border-neutral-200">
                  <Button onClick={onClose} className="w-full">
                    {t('weightTracker.close')}
                  </Button>
                </div>
              </div>
            </div>
          </Portal>
        ) : null
      )}
    </Card>
  )
}
