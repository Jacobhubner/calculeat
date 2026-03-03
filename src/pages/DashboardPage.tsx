import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfileCompletionGuard from '@/components/ProfileCompletionGuard'
import OnboardingModal from '@/components/OnboardingModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'
import { ZonedCalorieRing } from '@/components/daily/ZonedCalorieRing'
import MacroBar from '@/components/MacroBar'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles, useOnboarding } from '@/hooks'
import { useTodayLog } from '@/hooks/useDailyLogs'
import { useProfileStore } from '@/stores/profileStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Flame, Target, TrendingUp, UtensilsCrossed, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { DailyChecklist } from '@/components/daily/DailyChecklist'
import { useDailySummary } from '@/hooks/useDailySummary'
import {
  calculateAge,
  calculateBMI,
  getBMICategory,
  calculateIdealWeightRange,
} from '@/lib/calculations'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [advancedMode, setAdvancedMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dashboard_mode') === 'advanced'
    } catch {
      return false
    }
  })
  const toggleAdvancedMode = () => {
    setAdvancedMode(prev => {
      const next = !prev
      try {
        localStorage.setItem('dashboard_mode', next ? 'advanced' : 'simple')
      } catch {
        // ignore
      }
      return next
    })
  }
  const { profile: authProfile } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles, isLoading } = useProfiles()
  const { data: todayLog } = useTodayLog()
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding()

  // Get full profile data from allProfiles array
  const profile = allProfiles?.find(p => p.id === activeProfile?.id)

  const dailySummary = useDailySummary(todayLog, profile)

  console.log('🔍 Dashboard render:', {
    activeProfileId: activeProfile?.id,
    activeProfileName: activeProfile?.profile_name,
    allProfilesCount: allProfiles?.length,
    allProfilesIds: allProfiles?.map(p => `${p.profile_name} (${p.id.slice(0, 8)})`),
    foundProfile: !!profile,
    profileBMR: profile?.bmr,
    profileTDEE: profile?.tdee,
    profileCaloriesMin: profile?.calories_min,
    profileCaloriesMax: profile?.calories_max,
  })

  // Dashboard uses SAVED values from profile, not live calculations
  // useCalculations is for live editing in profile page, not for display
  const calculations = useMemo(() => {
    console.log(
      '🧮 Calculations useMemo triggered, profile:',
      profile?.profile_name,
      'BMR:',
      profile?.bmr
    )

    if (!profile) {
      return {
        bmr: null,
        tdee: null,
        calorieGoal: null,
        macros: null,
        age: null,
        bmi: null,
        bmiCategory: null,
        idealWeightRange: null,
        timeToGoal: null,
      }
    }

    // Calculate simple values that aren't stored
    const age = profile.birth_date ? calculateAge(profile.birth_date) : null
    const bmi =
      profile.weight_kg && profile.height_cm
        ? calculateBMI(profile.weight_kg, profile.height_cm)
        : null
    const bmiCategory = bmi ? getBMICategory(bmi) : null
    const idealWeightRange = profile.height_cm ? calculateIdealWeightRange(profile.height_cm) : null

    // Use SAVED calories and macros directly from profile
    const calorieGoal =
      profile.calories_min && profile.calories_max
        ? {
            min: profile.calories_min,
            max: profile.calories_max,
            target: Math.round((profile.calories_min + profile.calories_max) / 2),
            weeklyChange: 0,
          }
        : null

    // Build macros from saved percentages if available
    let macros = null
    if (
      calorieGoal &&
      profile.protein_min_percent != null &&
      profile.protein_max_percent != null &&
      profile.fat_min_percent != null &&
      profile.fat_max_percent != null &&
      profile.carb_min_percent != null &&
      profile.carb_max_percent != null
    ) {
      const targetCalories = calorieGoal.target

      // Calculate grams from percentages
      const proteinMinG = Math.round((targetCalories * profile.protein_min_percent) / 100 / 4)
      const proteinMaxG = Math.round((targetCalories * profile.protein_max_percent) / 100 / 4)
      const fatMinG = Math.round((targetCalories * profile.fat_min_percent) / 100 / 9)
      const fatMaxG = Math.round((targetCalories * profile.fat_max_percent) / 100 / 9)
      const carbMinG = Math.round((targetCalories * profile.carb_min_percent) / 100 / 4)
      const carbMaxG = Math.round((targetCalories * profile.carb_max_percent) / 100 / 4)

      macros = {
        protein: {
          grams: Math.round((proteinMinG + proteinMaxG) / 2),
          gramsMin: proteinMinG,
          gramsMax: proteinMaxG,
          calories: Math.round(((proteinMinG + proteinMaxG) / 2) * 4),
          percentage: Math.round((profile.protein_min_percent + profile.protein_max_percent) / 2),
        },
        fat: {
          grams: Math.round((fatMinG + fatMaxG) / 2),
          gramsMin: fatMinG,
          gramsMax: fatMaxG,
          calories: Math.round(((fatMinG + fatMaxG) / 2) * 9),
          percentage: Math.round((profile.fat_min_percent + profile.fat_max_percent) / 2),
        },
        carbs: {
          grams: Math.round((carbMinG + carbMaxG) / 2),
          gramsMin: carbMinG,
          gramsMax: carbMaxG,
          calories: Math.round(((carbMinG + carbMaxG) / 2) * 4),
          percentage: Math.round((profile.carb_min_percent + profile.carb_max_percent) / 2),
        },
      }
    }

    return {
      bmr: profile.bmr || null,
      tdee: profile.tdee || null,
      calorieGoal,
      macros,
      age,
      bmi,
      bmiCategory,
      idealWeightRange,
      timeToGoal: null,
    }
  }, [profile])

  // Get today's consumed calories and macros
  const consumed = todayLog?.total_calories || 0
  const targetMax = profile?.calories_max || 2000
  const target = targetMax
  const remaining = targetMax - consumed
  // ZonedCalorieRing requires both min and max — fallback to 85% of max if calories_min is absent
  const ringMin = profile?.calories_min ?? Math.round(targetMax * 0.85)

  // Status for microcopy (Simple Mode)
  // isWithinGoal requires calories_min to be set AND consumed >= it.
  // If calories_min is absent, only "under max" counts — never "bra jobbat" on low intake.
  // Also requires consumed >= 10% of targetMax to avoid premature positive feedback.
  const earlyThreshold = targetMax * 0.1
  const isOverGoal = consumed > targetMax
  const isWithinGoal =
    consumed > 0 &&
    !isOverGoal &&
    consumed >= earlyThreshold &&
    (profile?.calories_min != null ? consumed >= profile.calories_min : false)

  const simpleGreeting =
    consumed === 0
      ? 'Hur börjar din dag?'
      : isOverGoal
        ? 'Du har gått lite över idag.'
        : isWithinGoal
          ? 'Bra jobbat — du håller målet.'
          : 'Du är på rätt spår idag.'

  const simpleRingStatus =
    consumed === 0
      ? 'Logga din första måltid idag'
      : isOverGoal
        ? `${consumed - targetMax} kcal över dagens mål`
        : isWithinGoal
          ? `${remaining} kcal kvar — bra jobbat`
          : `${remaining} kcal kvar idag`

  const mealCount = todayLog?.meals?.length ?? 0
  const simpleCTAText =
    mealCount === 0
      ? 'Logga din första måltid'
      : mealCount <= 2
        ? 'Fortsätt logga idag'
        : 'Se vad du ätit idag'

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
        <OnboardingModal open={!!showOnboarding} onOpenChange={handleOnboardingClose} />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2">
            Hej {authProfile?.profile_name || 'där'}! 👋
          </h1>
          <p className="text-neutral-600 text-sm md:text-base">
            {!hasBasicInfo
              ? 'Fyll i din profil för att komma igång'
              : advancedMode
                ? consumed > 0
                  ? profile?.calories_min && profile?.calories_max
                    ? `Du har loggat ${consumed} av ${Math.round(profile.calories_min)}-${Math.round(profile.calories_max)} kcal idag`
                    : `Du har loggat ${consumed} av ${target} kcal idag`
                  : 'Här är din översikt för idag'
                : simpleGreeting}
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
        ) : advancedMode ? (
          /* ── ADVANCED MODE ─────────────────────────────── */
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
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
                value={
                  profile?.calories_min && profile?.calories_max
                    ? `${Math.round(profile.calories_min)} - ${Math.round(profile.calories_max)}`
                    : '-'
                }
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

            {/* Calorie Ring + Macro Bar */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex items-center justify-center">
                <ZonedCalorieRing consumed={consumed} min={ringMin} max={targetMax} size="md" />
              </div>
              {calculations.macros && <MacroBar {...calculations.macros} />}
            </div>

            {/* Daily Checklist */}
            {dailySummary && (
              <DailyChecklist
                caloriesOk={dailySummary.checklist.caloriesOk}
                macrosOk={dailySummary.checklist.macrosOk}
                colorBalanceOk={dailySummary.checklist.colorBalanceOk}
              />
            )}

            {/* Today's Progress */}
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
                          <p>F: {meal.meal_fat_g}g</p>
                          <p>K: {meal.meal_carb_g}g</p>
                          <p>P: {meal.meal_protein_g}g</p>
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
                        ? 'primary'
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
        ) : (
          /* ── SIMPLE MODE ───────────────────────────────── */
          <div className="space-y-6">
            {/* Calorie Ring */}
            <div className="flex items-center justify-center">
              <ZonedCalorieRing consumed={consumed} min={ringMin} max={targetMax} size="lg" />
            </div>

            {/* Status under ring */}
            <p className="text-center text-sm text-neutral-500">{simpleRingStatus}</p>

            {/* Primary CTA */}
            <Button
              variant="primary"
              className="w-full h-14 text-base gap-2"
              onClick={() => navigate('/app/today')}
            >
              <UtensilsCrossed className="h-5 w-5" />
              {simpleCTAText}
            </Button>

            {/* Daily Checklist — döljs om inget är loggat */}
            {consumed > 0 && dailySummary && (
              <DailyChecklist
                caloriesOk={dailySummary.checklist.caloriesOk}
                macrosOk={dailySummary.checklist.macrosOk}
                colorBalanceOk={dailySummary.checklist.colorBalanceOk}
              />
            )}

            {/* Today's meal list */}
            {todayLog && todayLog.meals && todayLog.meals.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {todayLog.meals.slice(0, 3).map(meal => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                      >
                        <p className="font-medium text-neutral-900 text-sm">{meal.meal_name}</p>
                        <p className="text-sm text-neutral-500">{meal.meal_calories} kcal</p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => navigate('/app/today')}
                  >
                    Se alla →
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {/* Mode toggle */}
        {hasBasicInfo && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              onClick={toggleAdvancedMode}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {advancedMode ? 'Visa mindre ↑' : 'Visa mer detaljer ↓'}
            </button>
          </div>
        )}
      </DashboardLayout>
    </ProfileCompletionGuard>
  )
}
