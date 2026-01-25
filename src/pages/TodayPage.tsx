import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TriZoneProgress } from '@/components/ui/TriZoneProgress'
import CalorieRing from '@/components/CalorieRing'
import MacroBar from '@/components/MacroBar'
import EmptyState from '@/components/EmptyState'
import RecentFoodsCard from '@/components/RecentFoodsCard'
import { AddFoodToMealModal } from '@/components/daily/AddFoodToMealModal'
import { PlateCalculator } from '@/components/daily/PlateCalculator'
import { FoodSuggestions } from '@/components/daily/FoodSuggestions'
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
} from '@/hooks/useDailyLogs'
import { useMealSettings, useCreateDefaultMealSettings } from '@/hooks/useMealSettings'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useProfileStore } from '@/stores/profileStore'
import { useProfiles } from '@/hooks'
import { useCalculations } from '@/hooks/useCalculations'
import type { FoodItem } from '@/hooks/useFoodItems'

export default function TodayPage() {
  const { data: todayLog, isLoading: logLoading } = useTodayLog()
  const { data: mealSettings, isLoading: settingsLoading } = useMealSettings()
  const ensureLog = useEnsureTodayLog()
  const createDefaultSettings = useCreateDefaultMealSettings()
  const finishDay = useFinishDay()
  const copyDayToToday = useCopyDayToToday()
  const removeFoodFromMeal = useRemoveFoodFromMeal()

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
  const calorieProgress = (totalCalories / goalCalories) * 100

  const greenCalories = todayLog?.green_calories || 0
  const yellowCalories = todayLog?.yellow_calories || 0
  const orangeCalories = todayLog?.orange_calories || 0

  // Calculate remaining values for tools
  const remainingCalories = Math.max(goalCalories - totalCalories, 0)
  const remainingProtein = Math.max(
    (calculations.macros?.protein.grams || 0) - (todayLog?.total_protein_g || 0),
    0
  )
  const remainingCarbs = Math.max(
    (calculations.macros?.carbs.grams || 0) - (todayLog?.total_carb_g || 0),
    0
  )
  const remainingFat = Math.max(
    (calculations.macros?.fat.grams || 0) - (todayLog?.total_fat_g || 0),
    0
  )

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
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">Mål skiljer sig från aktiv profil</p>
                <p className="text-sm text-amber-700">
                  Denna logg skapades med mål: {goalCaloriesMin}-{goalCalories} kcal.
                  Aktiv profil har: {profile?.calories_min}-{profile?.calories_max} kcal.
                </p>
              </div>
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
              {/* Calorie Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Kalorier</span>
                  <span className="text-sm text-neutral-600">
                    {totalCalories} / {goalCaloriesMin}-{goalCalories} kcal
                  </span>
                </div>
                {goalCaloriesMin && goalCalories ? (
                  <TriZoneProgress
                    value={totalCalories}
                    min={goalCaloriesMin}
                    max={goalCalories}
                    className="h-3"
                  />
                ) : (
                  <Progress value={calorieProgress} className="h-3" />
                )}
                {totalCalories < goalCaloriesMin && totalCalories > 0 && (
                  <p className="text-xs text-sky-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-sky-400"></span>
                    Under miniminivå med {goalCaloriesMin - totalCalories} kcal
                  </p>
                )}
                {totalCalories >= goalCaloriesMin &&
                  totalCalories <= goalCalories &&
                  totalCalories > 0 && (
                    <p className="text-xs text-success-600 mt-1 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-success-500"></span>
                      Inom målet!
                    </p>
                  )}
                {totalCalories > goalCalories && (
                  <p className="text-xs text-error-600 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-error-500"></span>
                    Över maxnivå med {totalCalories - goalCalories} kcal
                  </p>
                )}
              </div>

              {/* Macro Distribution */}
              <div>
                <p className="text-sm font-medium mb-2">Makrofördelning</p>
                <MacroBar
                  protein={todayLog?.total_protein_g || 0}
                  carbs={todayLog?.total_carb_g || 0}
                  fat={todayLog?.total_fat_g || 0}
                />
              </div>

              {/* Noom Colors */}
              <div className="flex gap-3">
                <div className="flex-1 text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{greenCalories}</div>
                  <div className="text-xs text-green-600">Grön</div>
                </div>
                <div className="flex-1 text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">{yellowCalories}</div>
                  <div className="text-xs text-yellow-600">Gul</div>
                </div>
                <div className="flex-1 text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{orangeCalories}</div>
                  <div className="text-xs text-orange-600">Orange</div>
                </div>
              </div>
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

                return (
                  <Card key={mealSetting.id}>
                    <CardHeader>
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
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => handleOpenAddFoodModal(mealSetting.meal_name, mealEntry?.id)}
                        >
                          <Plus className="h-4 w-4" />
                          Lägg till
                        </Button>
                      </div>
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

          {/* Recent Foods */}
          <RecentFoodsCard dailyLogId={todayLog?.id} />

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dagens statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
              <div className="flex justify-between pt-3 border-t">
                <span className="text-sm text-neutral-600">Måltider loggade</span>
                <span className="text-sm font-semibold">
                  {todayLog?.meals?.filter(m => m.items && m.items.length > 0).length || 0} /{' '}
                  {mealSettings?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Macro Targets from Profile */}
          {profile && calculations.macros && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Makromål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Protein:</span>
                  <span className="font-medium">
                    {calculations.macros.protein.grams}g ({profile.protein_min_percent}-
                    {profile.protein_max_percent}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Kolhydrater:</span>
                  <span className="font-medium">
                    {calculations.macros.carbs.grams}g ({profile.carb_min_percent}-
                    {profile.carb_max_percent}%)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Fett:</span>
                  <span className="font-medium">
                    {calculations.macros.fat.grams}g ({profile.fat_min_percent}-
                    {profile.fat_max_percent}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plate Calculator */}
          <PlateCalculator
            defaultCalories={remainingCalories}
            onAddToMeal={handleAddFromSidebar}
          />

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
