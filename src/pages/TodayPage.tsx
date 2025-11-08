import { useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import CalorieRing from '@/components/CalorieRing'
import MacroBar from '@/components/MacroBar'
import EmptyState from '@/components/EmptyState'
import { Calendar, Plus, Check, Coffee, UtensilsCrossed, Sparkles, Copy } from 'lucide-react'
import { useTodayLog, useEnsureTodayLog, useFinishDay } from '@/hooks/useDailyLogs'
import { useMealSettings, useCreateDefaultMealSettings } from '@/hooks/useMealSettings'
import { Skeleton } from '@/components/ui/skeleton'

export default function TodayPage() {
  const { data: todayLog, isLoading: logLoading } = useTodayLog()
  const { data: mealSettings, isLoading: settingsLoading } = useMealSettings()
  const ensureLog = useEnsureTodayLog()
  const createDefaultSettings = useCreateDefaultMealSettings()
  const finishDay = useFinishDay()

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
  const goalCalories = todayLog?.goal_calories_max || 2000
  const calorieProgress = (totalCalories / goalCalories) * 100

  const greenCalories = todayLog?.green_calories || 0
  const yellowCalories = todayLog?.yellow_calories || 0
  const orangeCalories = todayLog?.orange_calories || 0

  const handleFinishDay = () => {
    if (todayLog && !todayLog.is_completed) {
      finishDay.mutate(todayLog.id, {
        onSuccess: () => {
          alert('Dagen är klar! 🎉')
        },
      })
    }
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
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Kopiera från igår
          </Button>
          {todayLog && !todayLog.is_completed && (
            <Button
              onClick={handleFinishDay}
              className="gap-2 bg-gradient-to-r from-success-600 to-success-500"
            >
              <Check className="h-4 w-4" />
              Avsluta dag
            </Button>
          )}
        </div>
      </div>

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
                  Du loggade {totalCalories} kcal av ditt mål på {goalCalories} kcal
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
                    {totalCalories} / {goalCalories} kcal
                  </span>
                </div>
                <Progress value={calorieProgress} className="h-3" />
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
              {mealSettings.map((mealSetting, index) => (
                <Card key={mealSetting.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index === 0 && <Coffee className="h-5 w-5 text-primary-600" />}
                        {index > 0 && <UtensilsCrossed className="h-5 w-5 text-accent-600" />}
                        <div>
                          <CardTitle className="text-lg">{mealSetting.meal_name}</CardTitle>
                          <CardDescription>
                            {mealSetting.percentage_of_daily_calories}% av dagens kalorier
                          </CardDescription>
                        </div>
                      </div>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till mat
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* TODO: Display meal items here */}
                    <div className="text-center py-8 text-neutral-400">
                      Inga matvaror tillagda ännu
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              <CalorieRing current={totalCalories} target={goalCalories} size={200} />
            </CardContent>
          </Card>

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
    </DashboardLayout>
  )
}
