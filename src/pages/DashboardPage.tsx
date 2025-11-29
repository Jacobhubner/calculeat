import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfileCompletionGuard from '@/components/ProfileCompletionGuard'
import OnboardingModal from '@/components/OnboardingModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'
import CalorieRing from '@/components/CalorieRing'
import MacroBar from '@/components/MacroBar'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles, useCalculations, useOnboarding } from '@/hooks'
import { useTodayLog } from '@/hooks/useDailyLogs'
import { useProfileStore } from '@/stores/profileStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Flame, Target, TrendingUp, UtensilsCrossed, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile: authProfile } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles, isLoading } = useProfiles()
  const { data: todayLog } = useTodayLog()
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding()

  // Get full profile data from allProfiles array
  const profile = allProfiles?.find(p => p.id === activeProfile?.id)

  const calculations = useCalculations(profile)

  // Get today's consumed calories and macros
  const consumed = todayLog?.total_calories || 0
  const target = profile?.calories_max || 2000
  const remaining = target - consumed

  const handleOnboardingClose = (open: boolean) => {
    if (!open) {
      completeOnboarding()
    }
    setShowOnboarding(open)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const hasBasicInfo = profile?.weight_kg && profile?.height_cm && profile?.birth_date

  return (
    <ProfileCompletionGuard>
      <DashboardLayout>
        {/* Onboarding Modal */}
        <OnboardingModal open={showOnboarding} onOpenChange={handleOnboardingClose} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2">
            Hej {authProfile?.full_name || 'där'}! 👋
          </h1>
          <p className="text-neutral-600 text-sm md:text-base">
            {hasBasicInfo
              ? consumed > 0
                ? `Du har loggat ${consumed} av ${target} kcal idag`
                : 'Här är din översikt för idag'
              : 'Fyll i din profil för att komma igång'}
          </p>
        </div>

        {!hasBasicInfo ? (
          /* Empty State - No Profile */
          <EmptyState
            icon={Scale}
            title="Komplettera din profil"
            description="För att få personliga rekommendationer och se din statistik behöver du fylla i din profil."
            action={{
              label: 'Gå till profil',
              onClick: () => (window.location.href = '/app/profile'),
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="BMR"
                value={profile?.bmr ? Math.round(profile.bmr) : '-'}
                unit="kcal"
                icon={Flame}
                variant="primary"
              />
              <StatCard
                title="TDEE"
                value={profile?.tdee ? Math.round(profile.tdee) : '-'}
                unit="kcal"
                icon={Activity}
                variant="accent"
              />
              <StatCard
                title="Kalorimål"
                value={profile?.calories_max ? Math.round(profile.calories_max) : '-'}
                unit="kcal"
                icon={Target}
                variant="success"
              />
              <StatCard
                title="Vikt"
                value={profile?.weight_kg || '-'}
                unit="kg"
                icon={TrendingUp}
                variant="default"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Calorie Ring */}
              <div className="relative">
                <CalorieRing consumed={consumed} target={target} remaining={remaining} />
                {consumed === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-sm text-neutral-500 text-center px-4">
                      Börja logga för att se dina framsteg
                    </p>
                  </div>
                )}
              </div>

              {/* Macro Bar */}
              {calculations.macros && <MacroBar {...calculations.macros} />}
            </div>

            {/* Today's Progress (if user has logged food) */}
            {todayLog && todayLog.meals && todayLog.meals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dagens framsteg</CardTitle>
                  <CardDescription>
                    Du har loggat {todayLog.meals.length} måltid(er) idag
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todayLog.meals.slice(0, 3).map(meal => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-neutral-900">{meal.meal_name}</p>
                          <p className="text-sm text-neutral-600">{meal.meal_calories} kcal</p>
                        </div>
                        <div className="text-right text-xs text-neutral-500">
                          <p>P: {meal.meal_protein_g}g</p>
                          <p>K: {meal.meal_carb_g}g</p>
                          <p>F: {meal.meal_fat_g}g</p>
                        </div>
                      </div>
                    ))}
                    {todayLog.meals.length > 3 && (
                      <p className="text-sm text-neutral-500 text-center">
                        +{todayLog.meals.length - 3} till...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Snabbåtgärder</CardTitle>
                <CardDescription>
                  {todayLog && todayLog.meals && todayLog.meals.length > 0
                    ? 'Hantera dagens måltider'
                    : 'Logga dina måltider'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    size="lg"
                    variant={
                      todayLog && todayLog.meals && todayLog.meals.length > 0
                        ? 'default'
                        : 'outline'
                    }
                    className="h-20"
                    onClick={() => navigate('/app/today')}
                  >
                    <UtensilsCrossed className="h-5 w-5 mr-2" />
                    {todayLog && todayLog.meals && todayLog.meals.length > 0
                      ? 'Se dagens loggar'
                      : 'Logga måltid'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-20"
                    onClick={() => navigate('/app/history')}
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    Se historik
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Health Insights */}
            {calculations.bmi && (
              <Card>
                <CardHeader>
                  <CardTitle>Hälsoinsikter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">BMI</p>
                      <p className="text-2xl font-bold text-neutral-900">{calculations.bmi}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-600">Kategori</p>
                      <p className="text-sm font-medium text-neutral-900 capitalize">
                        {calculations.bmiCategory}
                      </p>
                    </div>
                  </div>

                  {calculations.idealWeightRange && (
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-2">
                        Idealvikt (BMI 18.5-25)
                      </p>
                      <p className="text-sm text-neutral-700">
                        {calculations.idealWeightRange.min} - {calculations.idealWeightRange.max} kg
                      </p>
                    </div>
                  )}

                  {calculations.age && (
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Ålder</p>
                      <p className="text-sm text-neutral-700">{calculations.age} år</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DashboardLayout>
    </ProfileCompletionGuard>
  )
}
