import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  History as HistoryIcon,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  BarChart3,
  Trash2,
  Lock,
  Download,
} from 'lucide-react'
import { useDailyLogs, useDeleteDailyLog } from '@/hooks/useDailyLogs'
import { useEntitlements, isUnlimited } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { dailyLogsToCsv, downloadCsv } from '@/lib/exportCsv'
import { HistoryCalendar } from '@/components/history/HistoryCalendar'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import { useProfileStore } from '@/stores/profileStore'
import { useProfiles } from '@/hooks'
import type { Profile } from '@/lib/types'
import { localDateString } from '@/lib/utils/localDate'

const WEEKS_PER_PAGE = 4

export default function HistoryPage() {
  const { t } = useTranslation('history')
  const { t: tPremium } = useTranslation('premium')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [statsPeriod, setStatsPeriod] = useState<number | null>(30)
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS_PER_PAGE)

  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles } = useProfiles()
  const profile = allProfiles?.find(p => p.id === activeProfile?.id) as Profile | undefined

  const { limits } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  const historyDays = limits.history_days
  const historyLimited = !isUnlimited(historyDays)

  // Synligt fönster: obegränsat för premium/founder, annars history_days bakåt.
  // Endast UI-gating — all data sparas alltid (se docs/PREMIUM_SPEC.md).
  const { endDate, startDate } = useMemo(() => {
    const now = new Date()
    const future = new Date(now)
    future.setFullYear(now.getFullYear() + 1)
    const end = localDateString(future)
    const windowStart = new Date(now)
    if (historyLimited) {
      windowStart.setDate(windowStart.getDate() - historyDays)
    } else {
      windowStart.setFullYear(now.getFullYear() - 10)
    }
    const start = localDateString(windowStart)
    return { endDate: end, startDate: start }
  }, [historyLimited, historyDays])

  // Perioder utanför fönstret öppnar UpgradeModal istället för att väljas
  const requestStatsPeriod = (p: number | null) => {
    if (historyLimited && (p === null || p > historyDays)) {
      openUpgradeModal()
      return
    }
    setStatsPeriod(p)
  }

  const handleExportCsv = () => {
    if (!limits.csv_export) {
      openUpgradeModal()
      return
    }
    if (!logs || logs.length === 0) return
    const today = localDateString()
    downloadCsv(`calculeat-historik-${today}.csv`, dailyLogsToCsv(logs))
  }

  const { data: logs, isLoading } = useDailyLogs(startDate, endDate)

  // Filter logs to selected stats period
  const statsLogs = useMemo(() => {
    if (!logs) return []
    if (statsPeriod === null) return logs
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - statsPeriod)
    const cutoffStr = localDateString(cutoff)
    return logs.filter(log => log.log_date.split('T')[0] >= cutoffStr)
  }, [logs, statsPeriod])
  const deleteDailyLog = useDeleteDailyLog()

  const handleDeleteDay = (logId: string, logDate: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to day detail
    if (!confirm(t('confirm.deleteDay', { date: new Date(logDate).toLocaleDateString('sv-SE') }))) {
      return
    }
    deleteDailyLog.mutate(logId, {
      onSuccess: () => {
        toast.success(t('toast.dayDeleted'))
      },
      onError: () => {
        toast.error(t('toast.deleteFailed'))
      },
    })
  }

  // Calculate stats based on completed days only
  const completedStatsLogs = statsLogs.filter(log => log.is_completed)
  const completedDays = completedStatsLogs.length
  const avgCalories =
    completedStatsLogs.length > 0
      ? Math.round(
          completedStatsLogs.reduce((sum, log) => sum + log.total_calories, 0) /
            completedStatsLogs.length
        )
      : 0
  const avgFat =
    completedStatsLogs.length > 0
      ? Math.round(
          completedStatsLogs.reduce((sum, log) => sum + log.total_fat_g, 0) /
            completedStatsLogs.length
        )
      : 0
  const avgCarbs =
    completedStatsLogs.length > 0
      ? Math.round(
          completedStatsLogs.reduce((sum, log) => sum + log.total_carb_g, 0) /
            completedStatsLogs.length
        )
      : 0
  const avgProtein =
    completedStatsLogs.length > 0
      ? Math.round(
          completedStatsLogs.reduce((sum, log) => sum + log.total_protein_g, 0) /
            completedStatsLogs.length
        )
      : 0

  // Calculate current streak: consecutive completed days backwards from today
  // Uses all logs (not period-filtered) so streak isn't capped by selected period
  const currentStreak = useMemo(() => {
    if (!logs || logs.length === 0) return 0
    const completedDates = new Set(
      logs.filter(log => log.is_completed).map(log => log.log_date.split('T')[0])
    )
    let streak = 0
    const cursor = new Date()
    const todayStr = localDateString(cursor)
    if (!completedDates.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (true) {
      const dateStr = localDateString(cursor)
      if (!completedDates.has(dateStr)) break
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }, [logs])

  // Group logs by week
  const weeklyLogs = (logs ?? []).reduce(
    (acc, log) => {
      const date = new Date(log.log_date)
      const weekStart = new Date(date)
      const day = date.getDay()
      weekStart.setDate(date.getDate() - (day === 0 ? 6 : day - 1)) // Monday
      const weekKey = localDateString(weekStart)
      if (!acc[weekKey]) acc[weekKey] = []
      acc[weekKey].push(log)
      return acc
    },
    {} as Record<string, NonNullable<typeof logs>[number][]>
  )

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
          <HistoryIcon className="h-6 w-6 md:h-8 md:w-8 text-primary-600 dark:text-primary-300" />
          {t('page.title')}
        </h1>
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
          {t('page.description')}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === 'list' ? 'primary' : 'outline'}
          onClick={() => setViewMode('list')}
          className="gap-2"
        >
          <HistoryIcon className="h-4 w-4" />
          {t('views.list')}
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'primary' : 'outline'}
          onClick={() => setViewMode('calendar')}
          className="gap-2"
        >
          <CalendarIcon className="h-4 w-4" />
          {t('views.calendar')}
        </Button>
        <Button variant="outline" onClick={handleExportCsv} className="gap-2 ml-auto">
          {limits.csv_export ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {tPremium('export.csvButton')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title={t('empty.noHistory')}
          description={t('empty.noHistoryDescription')}
          action={{
            label: t('actions.goToToday'),
            onClick: () => (window.location.href = '/app/today'),
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {viewMode === 'calendar' ? (
              <HistoryCalendar logs={logs ?? []} />
            ) : (
              <div className="space-y-4">
                {(() => {
                  const sortedWeeks = Object.entries(weeklyLogs || {}).sort(([a], [b]) =>
                    b.localeCompare(a)
                  )
                  const visibleEntries = sortedWeeks.slice(0, visibleWeeks)
                  const hasMore = sortedWeeks.length > visibleWeeks

                  return (
                    <>
                      {visibleEntries.map(([weekStart, weekLogs]) => {
                        const weekStartDate = new Date(weekStart)
                        const weekEndDate = new Date(weekStart)
                        weekEndDate.setDate(weekEndDate.getDate() + 6)

                        return (
                          <Card key={weekStart}>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center justify-between">
                                <span>
                                  {weekStartDate.toLocaleDateString('sv-SE', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}{' '}
                                  -{' '}
                                  {weekEndDate.toLocaleDateString('sv-SE', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <Badge variant="outline">
                                  {weekLogs.filter(l => l.is_completed).length} / 7 {t('week.days')}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {weekLogs
                                .sort((a, b) => b.log_date.localeCompare(a.log_date))
                                .map(log => {
                                  const date = new Date(log.log_date)

                                  return (
                                    <div
                                      key={log.id}
                                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-neutral-50 transition-colors cursor-pointer dark:hover:bg-neutral-800"
                                      onClick={() =>
                                        (window.location.href = `/app/history/${log.log_date}`)
                                      }
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="text-center">
                                          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                            {date.getDate()}
                                          </div>
                                          <div className="text-xs text-neutral-500 uppercase dark:text-neutral-400">
                                            {date.toLocaleDateString('sv-SE', { weekday: 'short' })}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                              {log.total_calories} kcal
                                            </span>
                                            {log.is_completed && (
                                              <Badge
                                                variant="outline"
                                                className="gap-1 bg-success-50 text-success-700 border-success-200 dark:bg-success-900/25 dark:text-success-300 dark:border-success-800"
                                              >
                                                <Check className="h-3 w-3" />
                                                {t('status.completed')}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                            F: {log.total_fat_g}g · K: {log.total_carb_g}g · P:{' '}
                                            {log.total_protein_g}g
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={e => handleDeleteDay(log.id, log.log_date, e)}
                                          className="p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                          title={t('actions.deleteDayTitle')}
                                          disabled={deleteDailyLog.isPending}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                        <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                                      </div>
                                    </div>
                                  )
                                })}
                            </CardContent>
                          </Card>
                        )
                      })}
                      {hasMore && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setVisibleWeeks(v => v + WEEKS_PER_PAGE)}
                        >
                          {t('actions.showMoreWeeks', {
                            count: Math.min(WEEKS_PER_PAGE, sortedWeeks.length - visibleWeeks),
                          })}
                        </Button>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {statsPeriod === null
                    ? t('stats.summaryTitleAll')
                    : t('stats.summaryTitle', { days: statsPeriod })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {([14, 21, 30, 90] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => requestStatsPeriod(p)}
                        className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors inline-flex items-center justify-center gap-0.5 ${
                          statsPeriod === p
                            ? 'bg-primary-600 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {p === 14 ? '2v' : p === 21 ? '3v' : `${p}d`}
                        {historyLimited && p > historyDays && <Lock className="h-3 w-3" />}
                      </button>
                    ))}
                    <button
                      onClick={() => requestStatsPeriod(null)}
                      className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors inline-flex items-center justify-center gap-0.5 ${
                        statsPeriod === null
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {t('stats.allTime')}
                      {historyLimited && <Lock className="h-3 w-3" />}
                    </button>
                  </div>
                  {statsPeriod !== null && (
                    <>
                      <input
                        type="range"
                        min={1}
                        max={historyLimited ? Math.min(90, historyDays) : 90}
                        value={statsPeriod}
                        onChange={e => setStatsPeriod(Number(e.target.value))}
                        className="w-full accent-primary-600"
                      />
                      <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
                        <span>1d</span>
                        <span>{historyLimited ? `${Math.min(90, historyDays)}d` : '90d'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {completedDays}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {statsPeriod === null
                      ? t('stats.completedDays')
                      : t('stats.completedDaysOf', { days: statsPeriod })}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 dark:text-neutral-400">
                    {t('stats.avgPerDay')}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('stats.avgCaloriesLabel')}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {avgCalories} kcal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('stats.avgFatLabel')}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {avgFat} g
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('stats.avgCarbsLabel')}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {avgCarbs} g
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('stats.avgProteinLabel')}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {avgProtein} g
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200 dark:from-primary-900/30 dark:to-accent-900/20 dark:border-primary-800">
              <CardHeader>
                <CardTitle className="text-lg">🔥 {t('stats.streak')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-700 dark:text-primary-300">
                    {currentStreak}
                  </div>
                  <div className="text-sm text-neutral-700 dark:text-neutral-200">
                    {t('stats.daysInARow')}
                  </div>
                  <p className="text-xs text-neutral-600 mt-3 dark:text-neutral-400">
                    {t('stats.streakEncouragement')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Kaloritäthetsfördelning — visas bara om funktionen är aktiverad */}
            {profile?.show_energy_density && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('stats.densityDistribution')}</CardTitle>
                  <CardDescription>
                    {statsPeriod === null
                      ? t('stats.summaryTitleAll')
                      : t('stats.lastNDays', { days: statsPeriod })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(() => {
                    const totalGreen = completedStatsLogs.reduce(
                      (sum, log) => sum + log.green_calories,
                      0
                    )
                    const totalYellow = completedStatsLogs.reduce(
                      (sum, log) => sum + log.yellow_calories,
                      0
                    )
                    const totalOrange = completedStatsLogs.reduce(
                      (sum, log) => sum + log.orange_calories,
                      0
                    )
                    const total = totalGreen + totalYellow + totalOrange

                    const greenPct = total > 0 ? Math.round((totalGreen / total) * 100) : 0
                    const yellowPct = total > 0 ? Math.round((totalYellow / total) * 100) : 0
                    const orangePct = total > 0 ? Math.round((totalOrange / total) * 100) : 0

                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('stats.green')}
                          </span>
                          <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                            {greenPct}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('stats.yellow')}
                          </span>
                          <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                            {yellowPct}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('stats.orange')}
                          </span>
                          <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                            {orangePct}%
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card className="bg-gradient-to-br from-accent-50 to-success-50 border-accent-200 dark:from-accent-900/25 dark:to-success-900/20 dark:border-accent-800">
              <CardHeader>
                <CardTitle className="text-lg">📊 {t('tips.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                <p>{t('tips.tip1')}</p>
                <p>{t('tips.tip2')}</p>
                {profile?.show_energy_density && <p>{t('tips.tip3')}</p>}
                <p>{t('tips.tip4')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
