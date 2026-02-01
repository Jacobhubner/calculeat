import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RangeProgressBar, MealProgressBar } from '@/components/daily/RangeProgressBar'
import CalorieRing from '@/components/CalorieRing'
import EmptyState from '@/components/EmptyState'
import RecentFoodsCard from '@/components/RecentFoodsCard'
import { AddFoodToMealModal } from '@/components/daily/AddFoodToMealModal'
import { PlateCalculator } from '@/components/daily/PlateCalculator'
import { FoodSuggestions } from '@/components/daily/FoodSuggestions'
import { DailyChecklist } from '@/components/daily/DailyChecklist'
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
} from 'lucide-react'
import {
  useTodayLog,
  useEnsureTodayLog,
  useFinishDay,
  useCopyDayToToday,
  useRemoveFoodFromMeal,
  useDailyLog,
  useUpdateDailyLogGoals,
} from '@/hooks/useDailyLogs'
import { useMealSettings, useCreateDefaultMealSettings } from '@/hooks/useMealSettings'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'
import { useProfiles } from '@/hooks'
import { useCalculations } from '@/hooks/useCalculations'
import { useDailySummary } from '@/hooks/useDailySummary'
import type { FoodItem } from '@/hooks/useFoodItems'

export default function TodayPage() {
  const { data: todayLog, isLoading: logLoading } = useTodayLog()
  const { data: mealSettings, isLoading: settingsLoading } = useMealSettings()
  const ensureLog = useEnsureTodayLog()
  const createDefaultSettings = useCreateDefaultMealSettings()
  const finishDay = useFinishDay()
  const copyDayToToday = useCopyDayToToday()
  const removeFoodFromMeal = useRemoveFoodFromMeal()
  const updateDailyLogGoals = useUpdateDailyLogGoals()

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

  // Get active profile for calorie and macro targets
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles } = useProfiles()
  const profile = allProfiles?.find(p => p.id === activeProfile?.id)
  const calculations = useCalculations(profile)

  // Calculate daily summary using the new hook
  const dailySummary = useDailySummary(todayLog, profile, mealSettings)

  // Get yesterday's log for copy functionality
  const yesterday = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
  }, [])
  const { data: yesterdayLog } = useDailyLog(yesterday)

  const dateDisplay = useMemo(() => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return today.toLocaleDateString('sv-SE', options)
  }, [])

  // Ensure log and settings exist
  useEffect(() => {
    if (!logLoading && !todayLog && !ensureLog.isPending) {
      ensureLog.mutate()
    }
    if (
      !settingsLoading &&
      (!mealSettings || mealSettings.length === 0) &&
      !createDefaultSettings.isPending
    ) {
      createDefaultSettings.mutate()
    }
  }, [logLoading, todayLog, settingsLoading, mealSettings, ensureLog, createDefaultSettings])

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
          <Skeleton className="h-12 w-96" />
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

  const handleFinishDay = () => {
    if (todayLog && !todayLog.is_completed) {
      finishDay.mutate(todayLog.id, {
        onSuccess: () => {
          toast.success('Dagen är klar! 🎉')
        },
      })
    }
  }

  const handleCopyFromYesterday = () => {
    if (!yesterdayLog) {
      toast.error('Ingen data från igår att kopiera')
      return
    }

    if (!yesterdayLog.meals || yesterdayLog.meals.length === 0) {
      toast.error('Inga måltider loggade igår')
      return
    }

    copyDayToToday.mutate(yesterdayLog.id, {
      onSuccess: () => {
        toast.success('Kopierade måltider från igår!')
      },
      onError: () => {
        toast.error('Kunde inte kopiera måltider')
      },
    })
  }

  const handleRemoveFood = (itemId: string, foodName: string) => {
    removeFoodFromMeal.mutate(itemId, {
      onSuccess: () => {
        toast.success(`${foodName} har tagits bort`)
      },
      onError: () => {
        toast.error('Kunde inte ta bort matvaran')
      },
    })
  }

  const handleOpenAddFoodModal = (mealName: string, mealEntryId?: string) => {
    setPreselectedFood(null) // Clear any preselected food
    setSelectedMealForFood({ mealName, mealEntryId })
    setAddFoodModalOpen(true)
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary-600" />
            Dagens Logg
          </h1>
          <p className="text-neutral-600 capitalize">{dateDisplay}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCopyFromYesterday}
            disabled={!yesterdayLog || copyDayToToday.isPending}
          >
            <Copy className="h-4 w-4" />
            {copyDayToToday.isPending ? 'Kopierar...' : 'Kopiera från igår'}
          </Button>
          {todayLog && !todayLog.is_completed && (
            <Button
              onClick={handleFinishDay}
              disabled={finishDay.isPending}
              className="gap-2 bg-gradient-to-r from-success-600 to-success-500"
            >
              <Check className="h-4 w-4" />
              Avsluta dag
            </Button>
          )}
        </div>
      </div>

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
                  <p className="font-medium text-amber-900">Mål skiljer sig från aktiv profil</p>
                  <p className="text-sm text-amber-700">
                    Denna logg skapades med mål: {Math.round(goalCaloriesMin)}-
                    {Math.round(goalCalories)} kcal. Aktiv profil har:{' '}
                    {Math.round(profile?.calories_min || 0)}-
                    {Math.round(profile?.calories_max || 0)} kcal.
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
                        toast.success('Dagens mål uppdaterade till profilns värden')
                      },
                      onError: () => {
                        toast.error('Kunde inte uppdatera mål')
                      },
                    }
                  )
                }}
              >
                {updateDailyLogGoals.isPending ? 'Uppdaterar...' : 'Uppdatera mål'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {todayLog?.is_completed && (
        <Card className="mb-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success-600 flex items-center justify-center">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-success-900">Dagen är klar!</p>
                <p className="text-sm text-success-700">
                  {goalCaloriesMin && goalCalories ? (
                    <>
                      Du loggade {totalCalories} kcal av ditt mål på {Math.round(goalCaloriesMin)}-
                      {Math.round(goalCalories)} kcal
                    </>
                  ) : (
                    <>
                      Du loggade {totalCalories} kcal av ditt mål på {goalCalories} kcal
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Meals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Dagens framsteg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calorie Progress with Range Bar */}
              <RangeProgressBar
                value={totalCalories}
                min={goalCaloriesMin}
                max={goalCalories}
                label="Kalorier"
                unit="kcal"
              />

              {/* Energy Density */}
              {dailySummary && dailySummary.energyDensity > 0 && (
                <EnergyDensityIndicator density={dailySummary.energyDensity} size="sm" />
              )}
            </CardContent>
          </Card>

          {/* Meals */}
          {!mealSettings || mealSettings.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Inga måltider konfigurerade"
              description="Konfigurera dina måltider för att börja logga mat."
              action={{
                label: 'Konfigurera måltider',
                onClick: () => (window.location.href = '/app/settings/meals'),
              }}
            />
          ) : (
            <div className="space-y-4">
              {mealSettings.map((mealSetting, index) => {
                // Find corresponding meal entry from today's log
                const mealEntry = todayLog?.meals?.find(m => m.meal_name === mealSetting.meal_name)
                const hasItems = mealEntry?.items && mealEntry.items.length > 0
                // Get meal summary from dailySummary if available
                const mealSummary = dailySummary?.meals?.find(
                  m => m.mealName === mealSetting.meal_name
                )
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {index === 0 && <Coffee className="h-5 w-5 text-primary-600" />}
                          {index > 0 && <UtensilsCrossed className="h-5 w-5 text-accent-600" />}
                          <div>
                            <CardTitle className="text-lg">{mealSetting.meal_name}</CardTitle>
                            <CardDescription>
                              {hasItems
                                ? `${mealEntry.meal_calories} kcal • ${mealEntry.items.length} matvara${mealEntry.items.length > 1 ? 'r' : ''}`
                                : `${mealSetting.percentage_of_daily_calories}% av dagens kalorier`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Meal status indicator */}
                          {mealSummary?.status && (
                            <span
                              className={`text-sm font-medium ${
                                mealSummary.status.status === 'within'
                                  ? 'text-green-600'
                                  : mealSummary.status.status === 'under'
                                    ? 'text-sky-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {mealSummary.status.displayText}
                            </span>
                          )}
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              handleOpenAddFoodModal(mealSetting.meal_name, mealEntry?.id)
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Lägg till
                          </Button>
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
                          {mealEntry.items.map(item => {
                            const foodItem = item.food_item as {
                              name?: string
                              brand?: string
                            } | null
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg group hover:bg-neutral-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-neutral-900">
                                      {foodItem?.name || 'Okänd matvara'}
                                    </p>
                                    {foodItem?.brand && (
                                      <span className="text-xs text-neutral-500">
                                        ({foodItem.brand})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
                                    <span>
                                      {item.amount} {item.unit}
                                    </span>
                                    <span>•</span>
                                    <span>{item.calories} kcal</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">
                                      P: {item.protein_g}g | K: {item.carb_g}g | F: {item.fat_g}g
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleRemoveFood(item.id, foodItem?.name || 'Matvara')
                                  }
                                  disabled={removeFoodFromMeal.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })}
                          <div className="pt-3 border-t flex justify-between text-sm">
                            <span className="font-medium text-neutral-700">Totalt:</span>
                            <div className="flex gap-4 text-neutral-600">
                              <span>{mealEntry.meal_calories} kcal</span>
                              <span className="hidden sm:inline">
                                P: {mealEntry.meal_protein_g}g
                              </span>
                              <span className="hidden sm:inline">K: {mealEntry.meal_carb_g}g</span>
                              <span className="hidden sm:inline">F: {mealEntry.meal_fat_g}g</span>
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
                          Inga matvaror tillagda ännu
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
        <div className="space-y-6">
          {/* Calorie Ring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kalorimål</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CalorieRing
                consumed={totalCalories}
                target={goalCalories}
                min={goalCaloriesMin}
                max={goalCalories}
                remaining={Math.max(goalCalories - totalCalories, 0)}
              />
            </CardContent>
          </Card>

          {/* Daily Checklist */}
          {dailySummary && (
            <DailyChecklist
              caloriesOk={dailySummary.checklist.caloriesOk}
              macrosOk={dailySummary.checklist.macrosOk}
              colorBalanceOk={dailySummary.checklist.colorBalanceOk}
              energyDensity={dailySummary.energyDensity}
              showEnergyDensity={dailySummary.energyDensity > 0}
            />
          )}

          {/* Kaloritäthet (Color Balance) */}
          {dailySummary && (
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
              showCard={true}
            />
          )}

          {/* Recent Foods */}
          <RecentFoodsCard dailyLogId={todayLog?.id} />

          {/* Macro Goals with Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Makromål</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailySummary && profile ? (
                <>
                  <NutrientStatusRow
                    status={dailySummary.proteinStatus}
                    label={`Protein (${profile.protein_min_percent}-${profile.protein_max_percent}%)`}
                    unit="g"
                    showProgress
                  />
                  <NutrientStatusRow
                    status={dailySummary.carbStatus}
                    label={`Kolhydrater (${profile.carb_min_percent}-${profile.carb_max_percent}%)`}
                    unit="g"
                    showProgress
                  />
                  <NutrientStatusRow
                    status={dailySummary.fatStatus}
                    label={`Fett (${profile.fat_min_percent}-${profile.fat_max_percent}%)`}
                    unit="g"
                    showProgress
                  />
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Protein</span>
                    <span className="text-sm font-semibold">{todayLog?.total_protein_g || 0}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Kolhydrater</span>
                    <span className="text-sm font-semibold">{todayLog?.total_carb_g || 0}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Fett</span>
                    <span className="text-sm font-semibold">{todayLog?.total_fat_g || 0}g</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="text-sm text-neutral-600">Måltider loggade</span>
                <span className="text-sm font-semibold">
                  {todayLog?.meals?.filter(m => m.items && m.items.length > 0).length || 0} /{' '}
                  {mealSettings?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

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
              <CardTitle className="text-lg">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700">
              <p>• Logga mat direkt efter varje måltid för bästa resultat</p>
              <p>• Sikta på minst 30% gröna matvaror</p>
              <p>• Drick tillräckligt med vatten (2-3 liter/dag)</p>
              <p>• Klicka &quot;Avsluta dag&quot; när du är klar</p>
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
    </DashboardLayout>
  )
}
