import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import CalorieRing from '@/components/CalorieRing'
import MacroBar from '@/components/MacroBar'
import { ArrowLeft, Calendar, Check, Copy, UtensilsCrossed } from 'lucide-react'
import { useDailyLog, useCopyDayToToday } from '@/hooks/useDailyLogs'

export default function HistoryDayPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { data: log, isLoading } = useDailyLog(date || '')
  const copyDay = useCopyDayToToday()

  if (!date) {
    navigate('/app/history')
    return null
  }

  const handleCopyToToday = () => {
    if (log) {
      copyDay.mutate(log.id, {
        onSuccess: () => {
          alert('Kopierat till dagens logg!')
          navigate('/app/today')
        },
      })
    }
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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Ingen data för detta datum</h2>
          <p className="text-neutral-600 mb-6">Det finns ingen loggad information för {date}</p>
          <Button onClick={() => navigate('/app/history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till historik
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
          Tillbaka till historik
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
              {dateDisplay}
            </h1>
            {log.is_completed && (
              <Badge className="gap-1 bg-success-100 text-success-700 border-success-200">
                <Check className="h-3 w-3" />
                Dag avslutad
              </Badge>
            )}
          </div>
          <Button onClick={handleCopyToToday} className="gap-2" disabled={copyDay.isPending}>
            <Copy className="h-4 w-4" />
            {copyDay.isPending ? 'Kopierar...' : 'Kopiera till idag'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Meals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Dagens sammanfattning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calorie Progress */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Kalorier</span>
                <span className="text-2xl font-bold text-primary-700">
                  {log.total_calories} kcal
                </span>
              </div>

              {/* Macro Bar */}
              <div>
                <p className="text-sm font-medium mb-2">Makrofördelning</p>
                <MacroBar
                  protein={log.total_protein_g}
                  carbs={log.total_carb_g}
                  fat={log.total_fat_g}
                />
              </div>

              {/* Kaloritäthetsfärger */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{log.green_calories}</div>
                  <div className="text-xs text-green-600">Grön</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">{log.yellow_calories}</div>
                  <div className="text-xs text-yellow-600">Gul</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{log.orange_calories}</div>
                  <div className="text-xs text-orange-600">Orange</div>
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
                            {meal.meal_calories} kcal · P: {meal.meal_protein_g}g · K:{' '}
                            {meal.meal_carb_g}g · F: {meal.meal_fat_g}g
                          </CardDescription>
                        </div>
                      </div>
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
                                  {item.food_item?.name || 'Okänd matvara'}
                                </div>
                                <div className="text-sm text-neutral-600">
                                  {item.amount} {item.unit}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{item.calories} kcal</div>
                              <div className="text-xs text-neutral-600">
                                P: {item.protein_g}g · K: {item.carb_g}g · F: {item.fat_g}g
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-neutral-400">Inga matvaror loggade</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-neutral-400">
                Inga måltider loggade denna dag
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Stats */}
        <div className="space-y-6">
          {/* Calorie Ring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kalorimål</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CalorieRing
                current={log.total_calories}
                target={log.goal_calories_max || 2000}
                size={200}
              />
            </CardContent>
          </Card>

          {/* Nutrition Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Näringsstatistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Protein</span>
                <span className="text-sm font-semibold">{log.total_protein_g}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Kolhydrater</span>
                <span className="text-sm font-semibold">{log.total_carb_g}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Fett</span>
                <span className="text-sm font-semibold">{log.total_fat_g}g</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-sm text-neutral-600">Måltider</span>
                <span className="text-sm font-semibold">
                  {log.meals?.filter(m => m.items && m.items.length > 0).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Totalt antal matvaror</span>
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
                <CardTitle className="text-lg">Jämfört med mål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Kalorier</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {log.total_calories} / {log.goal_calories_max}
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
    </DashboardLayout>
  )
}
