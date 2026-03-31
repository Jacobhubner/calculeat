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
} from 'lucide-react'
import { useDailyLogs, useDeleteDailyLog } from '@/hooks/useDailyLogs'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'

export default function HistoryPage() {
  const { t } = useTranslation('history')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')

  // Get last 30 days + future planned days
  const { endDate, startDate } = useMemo(() => {
    const now = new Date()
    const future = new Date(now)
    future.setFullYear(now.getFullYear() + 1)
    const end = future.toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const start = thirtyDaysAgo.toISOString().split('T')[0]
    return { endDate: end, startDate: start }
  }, [])

  const { data: logs, isLoading } = useDailyLogs(startDate, endDate)
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

  // Calculate stats
  const completedDays = logs?.filter(log => log.is_completed).length || 0
  const totalDays = logs?.length || 0

  // Calculate current streak: consecutive completed days backwards from today
  const currentStreak = useMemo(() => {
    if (!logs || logs.length === 0) return 0
    const completedDates = new Set(
      logs.filter(log => log.is_completed).map(log => log.log_date.split('T')[0])
    )
    let streak = 0
    const cursor = new Date()
    // If today isn't logged yet, start checking from yesterday
    const todayStr = cursor.toISOString().split('T')[0]
    if (!completedDates.has(todayStr)) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (true) {
      const dateStr = cursor.toISOString().split('T')[0]
      if (!completedDates.has(dateStr)) break
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }, [logs])
  const avgCalories =
    logs && logs.length > 0
      ? Math.round(logs.reduce((sum, log) => sum + log.total_calories, 0) / logs.length)
      : 0

  // Group logs by week
  const weeklyLogs = logs?.reduce(
    (acc, log) => {
      const date = new Date(log.log_date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Sunday
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!acc[weekKey]) {
        acc[weekKey] = []
      }
      acc[weekKey].push(log)
      return acc
    },
    {} as Record<string, typeof logs>
  )

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
          <HistoryIcon className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
          {t('page.title')}
        </h1>
        <p className="text-sm md:text-base text-neutral-600">{t('page.description')}</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>{t('views.calendarTitle')}</CardTitle>
                  <CardDescription>{t('views.calendarDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="text-center py-8 text-neutral-400">
                    {t('views.calendarComingSoon')}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(weeklyLogs || {})
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([weekStart, weekLogs]) => {
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
                              {weekLogs.filter(l => l.is_completed).length} / {weekLogs.length}{' '}
                              {t('week.days')}
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
                                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-neutral-50 transition-colors cursor-pointer"
                                  onClick={() =>
                                    (window.location.href = `/app/history/${log.log_date}`)
                                  }
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-neutral-900">
                                        {date.getDate()}
                                      </div>
                                      <div className="text-xs text-neutral-500 uppercase">
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
                                            className="gap-1 bg-success-50 text-success-700 border-success-200"
                                          >
                                            <Check className="h-3 w-3" />
                                            {t('status.completed')}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-neutral-600">
                                        F: {log.total_fat_g}g · K: {log.total_carb_g}g · P:{' '}
                                        {log.total_protein_g}g
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {log.green_calories > 0 && (
                                        <div className="h-2 w-2 rounded-full bg-green-600" />
                                      )}
                                      {log.yellow_calories > 0 && (
                                        <div className="h-2 w-2 rounded-full bg-yellow-600" />
                                      )}
                                      {log.orange_calories > 0 && (
                                        <div className="h-2 w-2 rounded-full bg-orange-600" />
                                      )}
                                    </div>
                                    <button
                                      onClick={e => handleDeleteDay(log.id, log.log_date, e)}
                                      className="p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title={t('actions.deleteDayTitle')}
                                      disabled={deleteDailyLog.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                    <ChevronRight className="h-5 w-5 text-neutral-400" />
                                  </div>
                                </div>
                              )
                            })}
                        </CardContent>
                      </Card>
                    )
                  })}
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
                  {t('stats.summary30Days')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{completedDays}</div>
                  <div className="text-sm text-neutral-600">{t('stats.completedDays')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{avgCalories}</div>
                  <div className="text-sm text-neutral-600">{t('stats.avgCaloriesPerDay')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{totalDays}</div>
                  <div className="text-sm text-neutral-600">{t('stats.daysLogged')}</div>
                </div>
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
              <CardHeader>
                <CardTitle className="text-lg">🔥 {t('stats.streak')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-700">{currentStreak}</div>
                  <div className="text-sm text-neutral-700">{t('stats.daysInARow')}</div>
                  <p className="text-xs text-neutral-600 mt-3">{t('stats.streakEncouragement')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Kaloritäthetsfördelning */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('stats.densityDistribution')}</CardTitle>
                <CardDescription>{t('stats.last30Days')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const totalGreen = logs?.reduce((sum, log) => sum + log.green_calories, 0) || 0
                  const totalYellow = logs?.reduce((sum, log) => sum + log.yellow_calories, 0) || 0
                  const totalOrange = logs?.reduce((sum, log) => sum + log.orange_calories, 0) || 0
                  const total = totalGreen + totalYellow + totalOrange

                  const greenPct = total > 0 ? Math.round((totalGreen / total) * 100) : 0
                  const yellowPct = total > 0 ? Math.round((totalYellow / total) * 100) : 0
                  const orangePct = total > 0 ? Math.round((totalOrange / total) * 100) : 0

                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">{t('stats.green')}</span>
                        <span className="text-sm font-semibold text-green-700">{greenPct}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">{t('stats.yellow')}</span>
                        <span className="text-sm font-semibold text-yellow-700">{yellowPct}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">{t('stats.orange')}</span>
                        <span className="text-sm font-semibold text-orange-700">{orangePct}%</span>
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-accent-50 to-success-50 border-accent-200">
              <CardHeader>
                <CardTitle className="text-lg">📊 {t('tips.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-neutral-700">
                <p>{t('tips.tip1')}</p>
                <p>{t('tips.tip2')}</p>
                <p>{t('tips.tip3')}</p>
                <p>{t('tips.tip4')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
