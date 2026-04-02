import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealProgressBar } from '@/components/daily/RangeProgressBar'
import { SwipeableItem } from '@/components/ui/SwipeableItem'
import { ZonedCalorieRing } from '@/components/daily/ZonedCalorieRing'
import EmptyState from '@/components/EmptyState'
import RecentFoodsCard from '@/components/RecentFoodsCard'
import { AddFoodToMealModal } from '@/components/daily/AddFoodToMealModal'
import SaveMealDialog from '@/components/daily/SaveMealDialog'
import LoadMealToSlotDialog from '@/components/daily/LoadMealToSlotDialog'
import { PlateCalculator } from '@/components/daily/PlateCalculator'
import { FoodSuggestions } from '@/components/daily/FoodSuggestions'
import { ColorBalanceCard } from '@/components/daily/ColorBalanceCard'
import { MealMacroBreakdown } from '@/components/daily/MealMacroBreakdown'
import { EnergyDensityIndicator } from '@/components/daily/EnergyDensityIndicator'
import { NutrientStatusRow } from '@/components/daily/NutrientStatusBadge'
import {
  Calendar,
  Plus,
  Check,
  Coffee,
  UtensilsCrossed,
  Sparkles,
  Copy,
  Trash2,
  AlertTriangle,
  Bookmark,
  ArrowDownToLine,
  Pencil,
  X,
} from 'lucide-react'
import {
  useTodayLog,
  useEnsureTodayLog,
  useFinishDay,
  useStartNewDay,
  useCopyDayToToday,
  useRemoveFoodFromMeal,
  useDailyLog,
  useUpdateDailyLogGoals,
  useUpdateLogDate,
} from '@/hooks/useDailyLogs'
import { useMealSettings, useCreateDefaultMealSettings } from '@/hooks/useMealSettings'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'
import { useProfiles } from '@/hooks'
import { useCalculations } from '@/hooks/useCalculations'
import { useDailySummary } from '@/hooks/useDailySummary'
import type { FoodItem } from '@/hooks/useFoodItems'
import type { UserProfile } from '@/lib/types'

export default function TodayPage() {
  const { t } = useTranslation('today')
  const { data: todayLog, isLoading: logLoading } = useTodayLog()
  const { data: mealSettings, isLoading: settingsLoading } = useMealSettings()
  const ensureLog = useEnsureTodayLog()
  const createDefaultSettings = useCreateDefaultMealSettings()
  const finishDay = useFinishDay()
  const startNewDay = useStartNewDay()
  const copyDayToToday = useCopyDayToToday()
  const removeFoodFromMeal = useRemoveFoodFromMeal()
  const updateDailyLogGoals = useUpdateDailyLogGoals()
  const updateLogDate = useUpdateLogDate()

  // State for date editing
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editingDateValue, setEditingDateValue] = useState<string>('')
  const [pendingDate, setPendingDate] = useState<string | null>(null)

  // State for AddFoodToMealModal
  const [addFoodModalOpen, setAddFoodModalOpen] = useState(false)
  const [selectedMealForFood, setSelectedMealForFood] = useState<{
    mealName: string
    mealEntryId?: string
  } | null>(null)
  const [preselectedFood, setPreselectedFood] = useState<{
    food: FoodItem
    amount: number
    unit: string
  } | null>(null)

  // State for editing an existing food item (reuses AddFoodToMealModal)
  const [editItem, setEditItem] = useState<{
    itemId: string
    food: FoodItem
    amount: number
    unit: string
  } | null>(null)

  // State for SaveMealDialog
  const [saveMealDialogOpen, setSaveMealDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMealToSave, setSelectedMealToSave] = useState<any | null>(null)

  // State for LoadMealToSlotDialog
  const [loadMealDialogOpen, setLoadMealDialogOpen] = useState(false)
  const [selectedMealForLoad, setSelectedMealForLoad] = useState<{
    mealName: string
    mealOrder: number
    mealEntryId?: string
  } | null>(null)

  // Get active profile for calorie and macro targets
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles } = useProfiles()
  const profile = allProfiles?.find(p => p.id === activeProfile?.id)
  const calculations = useCalculations(profile as UserProfile | undefined)

  // Calculate daily summary using the new hook
  const dailySummary = useDailySummary(todayLog, profile, mealSettings)

  // Get yesterday's log for copy functionality
  const yesterday = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
  }, [])
  const { data: yesterdayLog } = useDailyLog(yesterday)

  const logDate = todayLog?.log_date
  const dateDisplay = useMemo(() => {
    const displayDate = logDate ? new Date(logDate + 'T12:00:00') : new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return displayDate.toLocaleDateString('sv-SE', options)
  }, [logDate])

  const todayDate = new Date().toISOString().split('T')[0]

  // Ensure log and settings exist
  useEffect(() => {
    // Only create a new log if there is no log at all — never if the user
    // has manually changed the log date to a different day.
    const needsEnsure = !logLoading && !ensureLog.isPending && !todayLog
    if (needsEnsure) {
      ensureLog.mutate()
    }
    if (
      !settingsLoading &&
      (!mealSettings || mealSettings.length === 0) &&
      !createDefaultSettings.isPending
    ) {
      createDefaultSettings.mutate()
    }
  }, [
    logLoading,
    todayLog,
    todayDate,
    settingsLoading,
    mealSettings,
    ensureLog,
    createDefaultSettings,
  ])

  // Detect if goals differ from active profile (profile was changed mid-day)
  // MUST be before the early return to follow React's rules of hooks
  const goalsFromDifferentProfile = useMemo(() => {
    if (!todayLog || !profile) return false
    const snapshotMin = todayLog.goal_calories_min
    const snapshotMax = todayLog.goal_calories_max
    const profileMin = profile.calories_min
    const profileMax = profile.calories_max
    // Check if there's a significant difference (more than 1 kcal)
    return (
      (snapshotMin && profileMin && Math.abs(snapshotMin - profileMin) > 1) ||
      (snapshotMax && profileMax && Math.abs(snapshotMax - profileMax) > 1)
    )
  }, [todayLog, profile])

  if (logLoading || settingsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full max-w-96" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalCalories = todayLog?.total_calories || 0
  // Use daily log snapshot first (what the log was created with), fallback to profile, then hardcoded
  const goalCalories = todayLog?.goal_calories_max || profile?.calories_max || 2000
  const goalCaloriesMin = todayLog?.goal_calories_min || profile?.calories_min || 1800

  // Calculate remaining values for tools (use dailySummary if available)
  const remainingCalories =
    dailySummary?.remainingCalories ?? Math.max(goalCalories - totalCalories, 0)
  const remainingProtein =
    dailySummary?.remainingProtein ??
    Math.max((calculations.macros?.protein.grams || 0) - (todayLog?.total_protein_g || 0), 0)
  const remainingCarbs =
    dailySummary?.remainingCarbs ??
    Math.max((calculations.macros?.carbs.grams || 0) - (todayLog?.total_carb_g || 0), 0)
  const remainingFat =
    dailySummary?.remainingFat ??
    Math.max((calculations.macros?.fat.grams || 0) - (todayLog?.total_fat_g || 0), 0)

  const handleStartEditingDate = () => {
    setEditingDateValue(todayLog?.log_date?.split('T')[0] || '')
    setIsEditingDate(true)
  }

  const handleConfirmEditDate = () => {
    if (!todayLog || !editingDateValue || editingDateValue === todayLog.log_date?.split('T')[0]) {
      setIsEditingDate(false)
      return
    }
    setPendingDate(editingDateValue)
    setIsEditingDate(false)
  }

  const handleCancelEditDate = () => {
    setIsEditingDate(false)
    setEditingDateValue('')
  }

  const handleConfirmDateChange = () => {
    if (!todayLog || !pendingDate) return
    updateLogDate.mutate(
      { logId: todayLog.id, newDate: pendingDate },
      {
        onSuccess: () => {
          toast.success(t('today.dateUpdated'))
          setPendingDate(null)
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : t('today.errorUpdateDate'))
          setPendingDate(null)
        },
      }
    )
  }

  const handleCancelDateChange = () => {
    setPendingDate(null)
  }

  const handleFinishDay = () => {
    if (todayLog && !todayLog.is_completed) {
      finishDay.mutate(todayLog.id, {
        onSuccess: () => {
          toast.success(t('today.dayFinished'))
        },
      })
    }
  }

  const handleCopyFromYesterday = () => {
    if (!yesterdayLog) {
      toast.error(t('today.errorNoYesterdayData'))
      return
    }

    if (!yesterdayLog.meals || yesterdayLog.meals.length === 0) {
      toast.error(t('today.errorNoYesterdayMeals'))
      return
    }

    copyDayToToday.mutate(yesterdayLog.id, {
      onSuccess: () => {
        toast.success(t('today.copiedFromYesterday'))
      },
      onError: () => {
        toast.error(t('today.errorCopyMeals'))
      },
    })
  }

  const handleRemoveFood = (itemId: string, foodName: string) => {
    removeFoodFromMeal.mutate(itemId, {
      onSuccess: () => {
        toast.success(t('today.foodRemoved', { name: foodName }))
      },
      onError: () => {
        toast.error(t('today.errorRemoveFood'))
      },
    })
  }

  const handleOpenAddFoodModal = (mealName: string, mealEntryId?: string) => {
    setPreselectedFood(null) // Clear any preselected food
    setSelectedMealForFood({ mealName, mealEntryId })
    setAddFoodModalOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenSaveMealDialog = (mealEntry: any) => {
    setSelectedMealToSave(mealEntry)
    setSaveMealDialogOpen(true)
  }

  const handleOpenLoadMealDialog = (mealName: string, mealOrder: number, mealEntryId?: string) => {
    setSelectedMealForLoad({ mealName, mealOrder, mealEntryId })
    setLoadMealDialogOpen(true)
  }

  // Handler for sidebar tools (PlateCalculator, FoodSuggestions)
  const handleAddFromSidebar = (food: FoodItem, amount: number, unit: string) => {
    setPreselectedFood({ food, amount, unit })
    setSelectedMealForFood({ mealName: '' }) // Empty name = let user choose meal
    setAddFoodModalOpen(true)
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
            {t('today.pageTitle')}
          </h1>
          <div className="flex items-center gap-2">
            {isEditingDate ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={editingDateValue}
                  onChange={e => setEditingDateValue(e.target.value)}
                  className="text-sm md:text-base text-neutral-600 border rounded px-2 py-0.5"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmEditDate()
                    if (e.key === 'Escape') handleCancelEditDate()
                  }}
                  autoFocus
                />
                <button
                  onClick={handleConfirmEditDate}
                  className="text-success-600 hover:text-success-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEditDate}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm md:text-base text-neutral-600 capitalize">{dateDisplay}</p>
                {todayLog && !todayLog.is_completed && (
                  <button
                    onClick={handleStartEditingDate}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    title={t('today.changeDate')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            size="sm"
            onClick={handleCopyFromYesterday}
            disabled={!yesterdayLog || copyDayToToday.isPending || !!todayLog?.is_completed}
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">
              {copyDayToToday.isPending ? t('today.copying') : t('today.copyFromYesterday')}
            </span>
          </Button>
          {todayLog && !todayLog.is_completed && (
            <Button
              onClick={handleFinishDay}
              disabled={finishDay.isPending}
              size="sm"
              className="gap-2 bg-gradient-to-r from-success-600 to-success-500"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">{t('today.finishDay')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Date change confirmation */}
      {pendingDate && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-blue-800">
                {t('today.confirmDateChange', { from: todayLog?.log_date, to: pendingDate })}
              </p>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelDateChange}
                  className="gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('today.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmDateChange}
                  disabled={updateLogDate.isPending}
                  className="gap-1 bg-gradient-to-r from-primary-600 to-primary-500"
                >
                  <Check className="h-3.5 w-3.5" />
                  {updateLogDate.isPending ? t('today.saving') : t('today.confirm')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal mismatch warning */}
      {goalsFromDifferentProfile && !todayLog?.is_completed && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">{t('today.goalMismatchTitle')}</p>
                  <p className="text-sm text-amber-700">
                    {t('today.goalMismatchText', {
                      logMin: Math.round(goalCaloriesMin),
                      logMax: Math.round(goalCalories),
                      profileMin: Math.round(profile?.calories_min || 0),
                      profileMax: Math.round(profile?.calories_max || 0),
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
                disabled={updateDailyLogGoals.isPending}
                onClick={() => {
                  if (!todayLog?.id || !profile) return

                  // Calculate macro goals in grams from profile percentages
                  const avgCalories =
                    ((profile.calories_min || 0) + (profile.calories_max || 0)) / 2
                  const fatMinG = (avgCalories * (profile.fat_min_percent || 20)) / 100 / 9
                  const fatMaxG = (avgCalories * (profile.fat_max_percent || 35)) / 100 / 9
                  const carbMinG = (avgCalories * (profile.carb_min_percent || 45)) / 100 / 4
                  const carbMaxG = (avgCalories * (profile.carb_max_percent || 55)) / 100 / 4
                  const proteinMinG = (avgCalories * (profile.protein_min_percent || 15)) / 100 / 4
                  const proteinMaxG = (avgCalories * (profile.protein_max_percent || 25)) / 100 / 4

                  updateDailyLogGoals.mutate(
                    {
                      dailyLogId: todayLog.id,
                      goals: {
                        goal_calories_min: profile.calories_min,
                        goal_calories_max: profile.calories_max,
                        goal_fat_min_g: Math.round(fatMinG),
                        goal_fat_max_g: Math.round(fatMaxG),
                        goal_carb_min_g: Math.round(carbMinG),
                        goal_carb_max_g: Math.round(carbMaxG),
                        goal_protein_min_g: Math.round(proteinMinG),
                        goal_protein_max_g: Math.round(proteinMaxG),
                      },
                    },
                    {
                      onSuccess: () => {
                        toast.success(t('today.goalsUpdated'))
                      },
                      onError: () => {
                        toast.error(t('today.errorUpdateGoals'))
                      },
                    }
                  )
                }}
              >
                {updateDailyLogGoals.isPending ? t('today.updating') : t('today.updateGoals')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {todayLog?.is_completed && (
        <Card className="mb-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success-600 flex items-center justify-center shrink-0">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-success-900">{t('today.dayCompleteTitle')}</p>
                  <p className="text-sm text-success-700">
                    {goalCaloriesMin && goalCalories ? (
                      <>
                        {t('today.dayCompleteRange', {
                          calories: totalCalories,
                          min: Math.round(goalCaloriesMin),
                          max: Math.round(goalCalories),
                        })}
                      </>
                    ) : (
                      <>
                        {t('today.dayCompleteSingle', {
                          calories: totalCalories,
                          goal: goalCalories,
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-2 border-success-400 text-success-800 hover:bg-success-200"
                onClick={() => startNewDay.mutate(todayLog.log_date)}
                disabled={startNewDay.isPending}
              >
                <Plus className="h-4 w-4" />
                {t('today.startNewDay')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3 min-w-0 overflow-hidden">
        {/* Main Content - Meals */}
        <div className="lg:col-span-2 space-y-6 min-w-0 overflow-hidden">
          {/* Progress Overview - Combined View */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                {t('today.dailyProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Top row: Calorie Ring + Macros */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Zoned Calorie Ring */}
                <div className="flex justify-center lg:justify-start">
                  <ZonedCalorieRing
                    consumed={totalCalories}
                    min={goalCaloriesMin}
                    max={goalCalories}
                    size="md"
                  />
                </div>

                {/* Right: Makromål + Energitäthet + Kaloritäthet */}
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-sm font-semibold text-neutral-700">
                    {t('today.macroGoals')}
                  </h4>
                  {dailySummary && profile ? (
                    <>
                      <NutrientStatusRow
                        status={dailySummary.fatStatus}
                        label={t('today.fat')}
                        unit="g"
                        showProgress
                      />
                      <NutrientStatusRow
                        status={dailySummary.carbStatus}
                        label={t('today.carbs')}
                        unit="g"
                        showProgress
                      />
                      <NutrientStatusRow
                        status={dailySummary.proteinStatus}
                        label={t('today.protein')}
                        unit="g"
                        showProgress
                      />
                    </>
                  ) : (
                    <div className="space-y-2 text-sm text-neutral-500">
                      <div className="flex justify-between">
                        <span>{t('today.fat')}</span>
                        <span className="font-medium">{todayLog?.total_fat_g || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('today.carbs')}</span>
                        <span className="font-medium">{todayLog?.total_carb_g || 0}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('today.protein')}</span>
                        <span className="font-medium">{todayLog?.total_protein_g || 0}g</span>
                      </div>
                    </div>
                  )}

                  {/* Energitäthet */}
                  <div className="pt-4 mt-2 border-t border-neutral-200">
                    <EnergyDensityIndicator density={dailySummary?.energyDensity || 0} size="sm" />
                  </div>

                  {/* Kaloritäthet */}
                  {dailySummary && (
                    <div className="pt-4 mt-2 border-t border-neutral-200">
                      <ColorBalanceCard
                        greenCalories={dailySummary.greenCalories}
                        yellowCalories={dailySummary.yellowCalories}
                        orangeCalories={dailySummary.orangeCalories}
                        greenStatus={dailySummary.greenStatus}
                        yellowStatus={dailySummary.yellowStatus}
                        orangeStatus={dailySummary.orangeStatus}
                        colorTargets={dailySummary.colorTargets}
                        caloriesMin={goalCaloriesMin}
                        caloriesMax={goalCalories}
                        showCard={false}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Måltider loggade */}
              <div className="flex justify-between items-center pt-4 border-t text-sm">
                <span className="text-neutral-600">{t('today.mealsLogged')}</span>
                <span className="font-semibold text-neutral-900">
                  {todayLog?.meals?.filter(m => m.items && m.items.length > 0).length || 0} /{' '}
                  {mealSettings?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          {!mealSettings || mealSettings.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title={t('today.noMealsTitle')}
              description={t('today.noMealsDescription')}
              action={{
                label: t('today.configureMeals'),
                onClick: () => (window.location.href = '/app/settings/meals'),
              }}
            />
          ) : (
            <div className="space-y-4">
              {mealSettings.map((mealSetting, index) => {
                // Find corresponding meal entry from today's log
                const mealEntry = todayLog?.meals?.find(
                  m => m.meal_order === mealSetting.meal_order
                )
                const hasItems = mealEntry?.items && mealEntry.items.length > 0
                // Calculate meal target range (min and max based on daily goals)
                const mealTargetMin = Math.round(
                  (goalCaloriesMin * mealSetting.percentage_of_daily_calories) / 100
                )
                const mealTargetMax = Math.round(
                  (goalCalories * mealSetting.percentage_of_daily_calories) / 100
                )
                const mealCurrentCalories = mealEntry?.meal_calories || 0
                // Calculate total weight for the meal
                const mealTotalWeight =
                  mealEntry?.items?.reduce((sum, item) => sum + (item.weight_grams || 0), 0) || 0

                return (
                  <Card key={mealSetting.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {index === 0 && <Coffee className="h-5 w-5 text-primary-600 shrink-0" />}
                          {index > 0 && (
                            <UtensilsCrossed className="h-5 w-5 text-accent-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <CardTitle className="text-lg truncate">
                              {mealSetting.meal_name}
                            </CardTitle>
                            <CardDescription className="truncate">
                              {hasItems
                                ? t('today.mealItemCount', { count: mealEntry.items?.length ?? 0 })
                                : t('today.mealPercentage', {
                                    pct: mealSetting.percentage_of_daily_calories,
                                  })}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                          {/* Save meal button - only show if meal has items */}
                          {hasItems && mealEntry && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 px-2 md:px-3"
                              onClick={() => handleOpenSaveMealDialog(mealEntry)}
                            >
                              <Bookmark className="h-4 w-4" />
                              <span className="hidden md:inline">{t('today.saveMeal')}</span>
                            </Button>
                          )}
                          {/* Load meal button */}
                          {!todayLog?.is_completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 px-2 md:px-3 border-primary-300 text-primary-700"
                              onClick={() =>
                                handleOpenLoadMealDialog(
                                  mealSetting.meal_name,
                                  mealSetting.meal_order,
                                  mealEntry?.id
                                )
                              }
                            >
                              <ArrowDownToLine className="h-4 w-4" />
                              <span className="hidden md:inline">{t('today.loadMeal')}</span>
                            </Button>
                          )}
                          {!todayLog?.is_completed && (
                            <Button
                              size="sm"
                              className="gap-1.5 px-2 md:px-3"
                              onClick={() =>
                                handleOpenAddFoodModal(mealSetting.meal_name, mealEntry?.id)
                              }
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">{t('today.addFood')}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Mini meal energy bar */}
                      <MealProgressBar
                        current={mealCurrentCalories}
                        targetMin={mealTargetMin}
                        targetMax={mealTargetMax}
                      />
                    </CardHeader>
                    <CardContent>
                      {hasItems ? (
                        <div className="space-y-2">
                          {(mealEntry.items ?? []).map(item => {
                            const foodItem = item.food_item as FoodItem | null
                            return (
                              <SwipeableItem
                                key={item.id}
                                onSwipeLeft={
                                  todayLog?.is_completed
                                    ? undefined
                                    : () =>
                                        handleRemoveFood(
                                          item.id,
                                          foodItem?.name || t('today.defaultFoodName')
                                        )
                                }
                              >
                                <div
                                  className={`w-full flex items-center justify-between p-3 bg-neutral-50 rounded-lg group transition-colors text-left ${todayLog?.is_completed ? 'cursor-default' : 'hover:bg-neutral-100 cursor-pointer'}`}
                                  onClick={() => {
                                    if (foodItem && !todayLog?.is_completed) {
                                      setEditItem({
                                        itemId: item.id,
                                        food: foodItem,
                                        amount: item.amount,
                                        unit: item.unit,
                                      })
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <p className="font-medium text-neutral-900 text-sm md:text-base truncate min-w-0">
                                        {foodItem?.name || t('today.unknownFood')}
                                      </p>
                                      {foodItem?.brand && (
                                        <span className="text-xs text-neutral-500 hidden sm:inline shrink-0">
                                          ({foodItem.brand})
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-neutral-600">
                                      <span>
                                        {item.amount} {item.unit}
                                      </span>
                                      <span>•</span>
                                      <span>{item.calories} kcal</span>
                                      <span>•</span>
                                      <span>
                                        F: {item.fat_g}g | K: {item.carb_g}g | P: {item.protein_g}g
                                      </span>
                                    </div>
                                  </div>
                                  {!todayLog?.is_completed && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleRemoveFood(
                                          item.id,
                                          foodItem?.name || t('today.defaultFoodName')
                                        )
                                      }}
                                      disabled={removeFoodFromMeal.isPending}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </SwipeableItem>
                            )
                          })}
                          <div className="pt-3 border-t flex flex-wrap gap-x-4 gap-y-1 justify-between text-sm min-w-0">
                            <span className="font-medium text-neutral-700 shrink-0">
                              {t('today.total')}
                            </span>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-neutral-600 min-w-0">
                              <span>{mealEntry.meal_calories} kcal</span>
                              <span>F: {mealEntry.meal_fat_g}g</span>
                              <span>K: {mealEntry.meal_carb_g}g</span>
                              <span>P: {mealEntry.meal_protein_g}g</span>
                            </div>
                          </div>
                          {/* Meal macro breakdown */}
                          {mealEntry.meal_calories > 0 && (
                            <MealMacroBreakdown
                              fat={mealEntry.meal_fat_g || 0}
                              carbs={mealEntry.meal_carb_g || 0}
                              protein={mealEntry.meal_protein_g || 0}
                              totalWeight={mealTotalWeight}
                              className="mt-2"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-neutral-400 text-sm">
                          {t('today.noFoodItemsYet')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6 min-w-0 overflow-hidden">
          {/* Recent Foods */}
          <RecentFoodsCard dailyLogId={todayLog?.id} onFoodSelect={handleAddFromSidebar} />

          {/* Plate Calculator */}
          <PlateCalculator defaultCalories={remainingCalories} onAddToMeal={handleAddFromSidebar} />

          {/* Food Suggestions */}
          <FoodSuggestions
            remainingCalories={remainingCalories}
            remainingProtein={remainingProtein}
            remainingCarbs={remainingCarbs}
            remainingFat={remainingFat}
            onAddToMeal={handleAddFromSidebar}
          />

          {/* Tips */}
          <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
            <CardHeader>
              <CardTitle className="text-lg">{t('today.tipsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700">
              <p>• {t('today.tip1')}</p>
              <p>• {t('today.tip2')}</p>
              <p>• {t('today.tip3')}</p>
              <p>• {t('today.tip4')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Food to Meal Modal */}
      {todayLog && selectedMealForFood && (
        <AddFoodToMealModal
          open={addFoodModalOpen}
          onOpenChange={open => {
            setAddFoodModalOpen(open)
            if (!open) setPreselectedFood(null) // Clear preselected food when closing
          }}
          mealName={selectedMealForFood.mealName}
          mealEntryId={selectedMealForFood.mealEntryId}
          dailyLogId={todayLog.id}
          preselectedFood={preselectedFood || undefined}
        />
      )}

      {/* Edit Food Item Modal (reuses AddFoodToMealModal) */}
      {editItem && todayLog && (
        <AddFoodToMealModal
          open={!!editItem}
          onOpenChange={open => {
            if (!open) setEditItem(null)
          }}
          mealName=""
          dailyLogId={todayLog.id}
          editItem={editItem}
        />
      )}

      {/* Save Meal Dialog */}
      {selectedMealToSave && (
        <SaveMealDialog
          open={saveMealDialogOpen}
          onOpenChange={setSaveMealDialogOpen}
          mealEntry={selectedMealToSave}
        />
      )}

      {/* Load Meal to Slot Dialog */}
      {todayLog && selectedMealForLoad && (
        <LoadMealToSlotDialog
          open={loadMealDialogOpen}
          onOpenChange={setLoadMealDialogOpen}
          targetMealName={selectedMealForLoad.mealName}
          targetMealOrder={selectedMealForLoad.mealOrder}
          dailyLogId={todayLog.id}
          targetMealEntryId={selectedMealForLoad.mealEntryId}
        />
      )}
    </DashboardLayout>
  )
}
