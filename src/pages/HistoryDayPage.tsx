import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ZonedCalorieRing } from '@/components/daily/ZonedCalorieRing'
import MacroBar from '@/components/MacroBar'
import { ArrowLeft, Calendar, Check, Copy, UtensilsCrossed, Pencil, Plus, X } from 'lucide-react'
import {
  useDailyLog,
  useCopyDayToToday,
  useReopenDay,
  useFinishDay,
  useRemoveFoodFromMeal,
  useUpdateLogDate,
} from '@/hooks/useDailyLogs'
import { AddFoodToMealModal } from '@/components/daily/AddFoodToMealModal'
import { toast } from 'sonner'

export default function HistoryDayPage() {
  const { t } = useTranslation('history')
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { data: log, isLoading } = useDailyLog(date || '')
  const copyDay = useCopyDayToToday()
  const reopenDay = useReopenDay()
  const finishDay = useFinishDay()
  const removeFoodFromMeal = useRemoveFoodFromMeal()
  const updateLogDate = useUpdateLogDate()

  const [isEditing, setIsEditing] = useState(false)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [addFoodModal, setAddFoodModal] = useState<{
    open: boolean
    mealName: string
    mealEntryId: string
  } | null>(null)

  if (!date) {
    navigate('/app/history')
    return null
  }

  const handleCopyToToday = () => {
    if (log) {
      copyDay.mutate(log.id, {
        onSuccess: () => {
          toast.success(t('toast.copiedToToday'))
          navigate('/app/today')
        },
      })
    }
  }

  const handleStartEditing = async () => {
    if (!log) return
    if (log.is_completed) {
      await reopenDay.mutateAsync(log.id)
    }
    setIsEditing(true)
  }

  const handleFinishEditing = async () => {
    if (!log) return
    await finishDay.mutateAsync(log.id)
    setIsEditing(false)
    toast.success(t('toast.daySaved'))
  }

  const handleRemoveItem = (itemId: string) => {
    removeFoodFromMeal.mutate(itemId, {
      onSuccess: () => {
        toast.success(t('toast.foodRemoved'))
      },
    })
  }

  const handleDateSelected = (newDate: string) => {
    if (newDate && newDate !== log?.log_date) {
      setPendingDate(newDate)
    }
    setIsEditingDate(false)
  }

  const handleConfirmDateChange = () => {
    if (!log || !pendingDate) return
    updateLogDate.mutate(
      { logId: log.id, newDate: pendingDate },
      {
        onSuccess: () => {
          toast.success(t('toast.dateUpdated'))
          setPendingDate(null)
          navigate(`/app/history/${pendingDate}`, { replace: true })
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : t('toast.dateUpdateFailed'))
          setPendingDate(null)
        },
      }
    )
  }

  const handleCancelDateChange = () => {
    setPendingDate(null)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-96" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!log) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('empty.noDataForDate')}</h2>
          <p className="text-neutral-600 mb-6">{t('empty.noDataDescription', { date })}</p>
          <Button onClick={() => navigate('/app/history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('actions.backToHistory')}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const logDate = new Date(log.log_date)
  const dateDisplay = logDate.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/app/history')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('actions.backToHistory')}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
                {isEditing && isEditingDate ? (
                  <input
                    type="date"
                    defaultValue={log.log_date}
                    className="text-2xl md:text-3xl font-bold text-neutral-800 border rounded px-2 py-0.5"
                    onBlur={e => handleDateSelected(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')
                        handleDateSelected((e.target as HTMLInputElement).value)
                      if (e.key === 'Escape') setIsEditingDate(false)
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className={
                      isEditing ? 'cursor-pointer hover:text-primary-400 transition-colors' : ''
                    }
                    onClick={() => isEditing && setIsEditingDate(true)}
                    title={isEditing ? t('editing.changeDate') : undefined}
                  >
                    {dateDisplay}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {log.is_completed && !isEditing && (
                <Badge className="gap-1 bg-success-100 text-success-700 border-success-200">
                  <Check className="h-3 w-3" />
                  {t('status.dayCompleted')}
                </Badge>
              )}
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEditing}
                  disabled={reopenDay.isPending}
                  className="gap-1.5 text-neutral-500 hover:text-neutral-700 h-7 px-2 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('actions.edit')}
                </Button>
              )}
            </div>
          </div>
          <Button onClick={handleCopyToToday} className="gap-2" disabled={copyDay.isPending}>
            <Copy className="h-4 w-4" />
            {copyDay.isPending ? t('actions.copying') : t('actions.copyToToday')}
          </Button>
        </div>
      </div>

      {/* Editing banner */}
      {isEditing && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  {t('editing.banner')}
                  {' · '}
                  <button
                    className="underline hover:text-amber-900 transition-colors"
                    onClick={() => setIsEditingDate(true)}
                  >
                    {t('editing.changeDate')}
                  </button>
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleFinishEditing}
                disabled={finishDay.isPending}
                className="gap-2 bg-gradient-to-r from-success-600 to-success-500 shrink-0"
              >
                <Check className="h-4 w-4" />
                {t('actions.done')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date change confirmation */}
      {pendingDate && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">
                  {t('editing.confirmDateChangePlain', { from: log?.log_date, to: pendingDate })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelDateChange}
                  className="gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('actions.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmDateChange}
                  disabled={updateLogDate.isPending}
                  className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500"
                >
                  <Check className="h-3.5 w-3.5" />
                  {updateLogDate.isPending ? t('actions.saving') : t('actions.confirm')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Meals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t('day.summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calorie Progress */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t('day.calories')}</span>
                <span className="text-2xl font-bold text-primary-700">
                  {Math.round(log.total_calories)} kcal
                </span>
              </div>

              {/* Macro Bar */}
              <div>
                <p className="text-sm font-medium mb-2">{t('day.macroDistribution')}</p>
                <MacroBar
                  protein={{
                    grams: Math.round(log.total_protein_g),
                    calories: Math.round(log.total_protein_g * 4),
                    percentage:
                      log.total_calories > 0
                        ? Math.round(((log.total_protein_g * 4) / log.total_calories) * 100)
                        : 0,
                  }}
                  carbs={{
                    grams: Math.round(log.total_carb_g),
                    calories: Math.round(log.total_carb_g * 4),
                    percentage:
                      log.total_calories > 0
                        ? Math.round(((log.total_carb_g * 4) / log.total_calories) * 100)
                        : 0,
                  }}
                  fat={{
                    grams: Math.round(log.total_fat_g),
                    calories: Math.round(log.total_fat_g * 9),
                    percentage:
                      log.total_calories > 0
                        ? Math.round(((log.total_fat_g * 9) / log.total_calories) * 100)
                        : 0,
                  }}
                />
              </div>

              {/* Kaloritäthetsfärger */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {Math.round(log.green_calories)}
                  </div>
                  <div className="text-xs text-green-600">{t('stats.green')}</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">
                    {Math.round(log.yellow_calories)}
                  </div>
                  <div className="text-xs text-yellow-600">{t('stats.yellow')}</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">
                    {Math.round(log.orange_calories)}
                  </div>
                  <div className="text-xs text-orange-600">{t('stats.orange')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          {log.meals && log.meals.length > 0 ? (
            <div className="space-y-4">
              {log.meals.map(meal => (
                <Card key={meal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UtensilsCrossed className="h-5 w-5 text-accent-600" />
                        <div>
                          <CardTitle className="text-lg">{meal.meal_name}</CardTitle>
                          <CardDescription>
                            {Math.round(meal.meal_calories)} kcal · F: {Math.round(meal.meal_fat_g)}
                            g · K: {Math.round(meal.meal_carb_g)}g · P:{' '}
                            {Math.round(meal.meal_protein_g)}g
                          </CardDescription>
                        </div>
                      </div>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() =>
                            setAddFoodModal({
                              open: true,
                              mealName: meal.meal_name,
                              mealEntryId: meal.id,
                            })
                          }
                        >
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('actions.addFood')}</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {meal.items && meal.items.length > 0 ? (
                      <div className="space-y-2">
                        {meal.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded border"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium">
                                  {item.snapshot_name ||
                                    item.food_item?.name ||
                                    t('empty.unknownFood')}
                                </div>
                                <div className="text-sm text-neutral-600">
                                  {item.amount} {item.unit}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="font-semibold">
                                  {Math.round(item.calories ?? 0)} kcal
                                </div>
                                <div className="text-xs text-neutral-600">
                                  F: {Math.round(item.fat_g ?? 0)}g · K:{' '}
                                  {Math.round(item.carb_g ?? 0)}g · P:{' '}
                                  {Math.round(item.protein_g ?? 0)}g
                                </div>
                              </div>
                              {isEditing && (
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title={t('editing.removeItem')}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-neutral-400">
                        {t('empty.noFoodInMeal')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-neutral-400">
                {t('empty.noMealsForDay')}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Stats */}
        <div className="space-y-6">
          {/* Calorie Ring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('day.calorieGoal')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ZonedCalorieRing
                consumed={Math.round(log.total_calories)}
                min={log.goal_calories_min || Math.round((log.goal_calories_max || 2000) * 0.85)}
                max={log.goal_calories_max || 2000}
              />
            </CardContent>
          </Card>

          {/* Nutrition Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('day.nutritionStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('day.fat')}</span>
                <span className="text-sm font-semibold">{Math.round(log.total_fat_g)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('day.carbs')}</span>
                <span className="text-sm font-semibold">{Math.round(log.total_carb_g)}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('day.protein')}</span>
                <span className="text-sm font-semibold">{Math.round(log.total_protein_g)}g</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-sm text-neutral-600">{t('day.meals')}</span>
                <span className="text-sm font-semibold">
                  {log.meals?.filter(m => m.items && m.items.length > 0).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">{t('day.totalFoods')}</span>
                <span className="text-sm font-semibold">
                  {log.meals?.reduce((sum, m) => sum + (m.items?.length || 0), 0) || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Goal Comparison */}
          {log.goal_calories_max && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('day.vsGoal')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">{t('day.calories')}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {Math.round(log.total_calories)} / {Math.round(log.goal_calories_max)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {Math.round((log.total_calories / log.goal_calories_max) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Food Modal */}
      {addFoodModal && log && (
        <AddFoodToMealModal
          open={addFoodModal.open}
          onOpenChange={open => {
            if (!open) setAddFoodModal(null)
          }}
          mealName={addFoodModal.mealName}
          mealEntryId={addFoodModal.mealEntryId}
          dailyLogId={log.id}
        />
      )}
    </DashboardLayout>
  )
}
