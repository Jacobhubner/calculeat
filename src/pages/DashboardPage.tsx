import { cn } from '@/lib/utils'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfileCompletionGuard from '@/components/ProfileCompletionGuard'
import OnboardingModal from '@/components/OnboardingModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'
import { ZonedCalorieRing } from '@/components/daily/ZonedCalorieRing'
import { MacroRangeBar } from '@/components/daily/MacroRangeBar'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles, useOnboarding } from '@/hooks'
import { useTodayLog } from '@/hooks/useDailyLogs'
import { useProfileStore } from '@/stores/profileStore'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Check,
  Flame,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Scale,
  Settings,
} from 'lucide-react'
import { calculateFFMI, getFFMICategory } from '@/lib/calculations/ffmiCalculations'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('dashboard')
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
  const VALID_INSIGHT_IDS = ['bmi', 'ffmi', 'idealweight', 'age'] as const
  const DEFAULT_INSIGHTS = ['bmi', 'ffmi', 'idealweight', 'age']
  const [visibleInsights, setVisibleInsights] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('health_insights_visible')
      if (!stored) return DEFAULT_INSIGHTS
      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) return DEFAULT_INSIGHTS
      const filtered = parsed.filter(
        (id): id is string =>
          typeof id === 'string' && (VALID_INSIGHT_IDS as readonly string[]).includes(id)
      )
      return filtered.length > 0 ? filtered : DEFAULT_INSIGHTS
    } catch {
      return DEFAULT_INSIGHTS
    }
  })
  const [insightsCustomizeOpen, setInsightsCustomizeOpen] = useState(false)
  const toggleInsight = (id: string) => {
    setVisibleInsights(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try {
        localStorage.setItem('health_insights_visible', JSON.stringify(next))
      } catch {
        // ignore localStorage errors
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

  // Dashboard uses SAVED values from profile, not live calculations
  // useCalculations is for live editing in profile page, not for display
  const calculations = useMemo(() => {
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
        ffmi: null,
        ffmiCategory: null,
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

    const ffmi =
      profile.body_fat_percentage != null && profile.weight_kg && profile.height_cm
        ? calculateFFMI(
            profile.weight_kg * (1 - profile.body_fat_percentage / 100),
            profile.height_cm / 100
          )
        : null
    const ffmiCategory =
      ffmi && ffmi > 0 && profile.gender ? getFFMICategory(ffmi, profile.gender) : null

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
      ffmi,
      ffmiCategory,
      timeToGoal: null,
    }
  }, [profile])

  // Get today's consumed calories and macros
  const consumed = todayLog?.total_calories || 0
  const targetMax = profile?.calories_max || 2000
  const remaining = targetMax - consumed
  // ZonedCalorieRing requires both min and max — fallback to 85% of max if calories_min is absent
  const ringMin = profile?.calories_min ?? Math.round(targetMax * 0.85)

  // Status for microcopy (Simple Mode)
  // isWithinGoal requires calories_min to be set AND consumed >= it.
  // If calories_min is absent, only "under max" counts — never "within goal" on low intake.
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
      ? t('status.question')
      : isOverGoal
        ? t('status.overGoal')
        : isWithinGoal
          ? t('status.withinGoal')
          : t('status.onTrack')

  const simpleRingStatus =
    consumed === 0
      ? t('subtitle.logFirst')
      : isOverGoal
        ? t('subtitle.caloriesOver', { calories: Math.round(consumed - targetMax) })
        : isWithinGoal
          ? t('subtitle.caloriesLeftGood', { calories: Math.round(remaining) })
          : t('subtitle.caloriesLeft', { calories: Math.round(remaining) })

  const mealCount = todayLog?.meals?.length ?? 0
  const simpleCTAText =
    mealCount === 0
      ? t('cta.logFirst')
      : mealCount <= 2
        ? t('cta.continueLogging')
        : t('cta.viewLogged')

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
            {authProfile?.profile_name
              ? t('greeting.hello', { name: authProfile.profile_name })
              : t('greeting.helloNoName')}
          </h1>
          {!hasBasicInfo && (
            <p className="text-neutral-600 text-sm md:text-base">{t('greeting.fillProfile')}</p>
          )}
          {hasBasicInfo && !advancedMode && (
            <p className="text-neutral-600 text-sm md:text-base">{simpleGreeting}</p>
          )}
        </div>

        {!hasBasicInfo ? (
          /* Empty State - No Profile */
          <EmptyState
            icon={Scale}
            title={t('emptyProfile.title')}
            description={t('emptyProfile.description')}
            action={{
              label: t('emptyProfile.action'),
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
                title={t('statCards.calorieGoal')}
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
                title={t('statCards.weight')}
                value={profile?.weight_kg ? Math.round(profile.weight_kg * 10) / 10 : '-'}
                unit="kg"
                icon={TrendingUp}
                variant="default"
              />
            </div>

            {/* Calorie Ring + Makrostatus */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex items-center justify-center">
                <ZonedCalorieRing consumed={consumed} min={ringMin} max={targetMax} size="md" />
              </div>
              {dailySummary &&
                (() => {
                  const fatKcal = dailySummary.fatStatus.current * 9
                  const carbsKcal = dailySummary.carbStatus.current * 4
                  const proteinKcal = dailySummary.proteinStatus.current * 4
                  const macroTotalKcal = fatKcal + carbsKcal + proteinKcal
                  const fatPct =
                    macroTotalKcal > 0 ? Math.round((fatKcal / macroTotalKcal) * 100) : 0
                  const carbsPct =
                    macroTotalKcal > 0 ? Math.round((carbsKcal / macroTotalKcal) * 100) : 0
                  const proteinPct =
                    macroTotalKcal > 0 ? Math.round((proteinKcal / macroTotalKcal) * 100) : 0
                  return (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>{t('macros.title')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MacroRangeBar
                          fat={{
                            currentG: Math.round(dailySummary.fatStatus.current),
                            minG: calculations.macros?.fat.gramsMin ?? 0,
                            maxG: calculations.macros?.fat.gramsMax ?? 0,
                            currentPct: fatPct,
                            minPct: profile?.fat_min_percent ?? 25,
                            maxPct: profile?.fat_max_percent ?? 40,
                          }}
                          carbs={{
                            currentG: Math.round(dailySummary.carbStatus.current),
                            minG: calculations.macros?.carbs.gramsMin ?? 0,
                            maxG: calculations.macros?.carbs.gramsMax ?? 0,
                            currentPct: carbsPct,
                            minPct: profile?.carb_min_percent ?? 45,
                            maxPct: profile?.carb_max_percent ?? 60,
                          }}
                          protein={{
                            currentG: Math.round(dailySummary.proteinStatus.current),
                            minG: calculations.macros?.protein.gramsMin ?? 0,
                            maxG: calculations.macros?.protein.gramsMax ?? 0,
                            currentPct: proteinPct,
                            minPct: profile?.protein_min_percent ?? 10,
                            maxPct: profile?.protein_max_percent ?? 20,
                          }}
                        />
                      </CardContent>
                    </Card>
                  )
                })()}
            </div>

            {/* Dagens logg + Checklist + Åtgärder */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-5 space-y-4">
              {/* Rubrik */}
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                {t('today.label')}
              </p>

              {/* Sektion 1 — Horisontell statusrad */}
              {dailySummary && (
                <div className="space-y-1.5">
                  <div className="flex gap-4">
                    {[
                      {
                        label: t('today.statusRow.calories'),
                        ok: dailySummary.checklist.caloriesOk,
                      },
                      { label: t('today.statusRow.macro'), ok: dailySummary.checklist.macrosOk },
                      {
                        label: t('today.statusRow.variety'),
                        ok: dailySummary.checklist.colorBalanceOk,
                      },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                            ok ? 'bg-success-500' : 'bg-neutral-200'
                          )}
                        >
                          {ok && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            ok ? 'text-success-700' : 'text-neutral-400'
                          )}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400">
                    {
                      [
                        dailySummary.checklist.caloriesOk,
                        dailySummary.checklist.macrosOk,
                        dailySummary.checklist.colorBalanceOk,
                      ].filter(Boolean).length
                    }{' '}
                    {t('today.goalsAchieved')}
                  </p>
                </div>
              )}

              {/* Sektion 2 — Kompakt måltidslista */}
              {todayLog?.meals && todayLog.meals.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {todayLog.meals.slice(0, 4).map(meal => (
                    <div key={meal.id} className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium text-neutral-800 truncate flex-1 mr-3">
                        {meal.meal_name}
                      </span>
                      <span className="text-sm text-neutral-500 shrink-0 tabular-nums">
                        {Math.round(meal.meal_calories)} kcal
                      </span>
                    </div>
                  ))}
                  {todayLog.meals.length > 4 && (
                    <div className="py-2 text-xs text-neutral-400 text-center">
                      {t('today.moreItems', { count: todayLog.meals.length - 4 })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 text-center py-2">{t('today.noMeals')}</p>
              )}

              {/* Sektion 3 — Åtgärdszon */}
              <div className="border-t border-neutral-200 bg-neutral-50 -mx-5 px-5 pt-4 pb-4 rounded-b-2xl flex gap-2">
                <Button size="sm" variant="primary" onClick={() => navigate('/app/today')}>
                  <UtensilsCrossed className="h-4 w-4 mr-1.5" />
                  {t('today.openLog')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/app/history')}>
                  <Activity className="h-4 w-4 mr-1.5" />
                  {t('today.history')}
                </Button>
              </div>
            </div>

            {/* Health Insights */}
            {calculations.bmi && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('insights.title')}</CardTitle>
                    <button
                      onClick={() => setInsightsCustomizeOpen(o => !o)}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                      aria-label={t('insights.customize')}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  {insightsCustomizeOpen && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(
                        [
                          { id: 'bmi', available: !!calculations.bmi },
                          {
                            id: 'ffmi',
                            available: calculations.ffmi != null && calculations.ffmi > 0,
                          },
                          { id: 'idealweight', available: !!calculations.idealWeightRange },
                          { id: 'age', available: !!calculations.age },
                        ] as const
                      ).map(metric => {
                        const isActive = visibleInsights.includes(metric.id)
                        return (
                          <button
                            key={metric.id}
                            disabled={!metric.available}
                            onClick={() => metric.available && toggleInsight(metric.id)}
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium transition-colors border',
                              !metric.available
                                ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                : isActive
                                  ? 'bg-primary-100 text-primary-700 border-primary-300'
                                  : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                            )}
                          >
                            {t(`insights.labels.${metric.id}`)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Metric pills row */}
                  <div className="flex gap-3">
                    {visibleInsights.includes('bmi') && calculations.bmi && (
                      <div className="rounded-xl border border-neutral-200 p-4 flex-1">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">BMI</p>
                        <p className="text-2xl font-bold text-neutral-900">
                          {Math.round(calculations.bmi * 10) / 10}
                        </p>
                        <p
                          className={cn(
                            'text-sm font-medium capitalize',
                            calculations.bmiCategory === 'normalvikt'
                              ? 'text-success-600'
                              : calculations.bmiCategory === 'övervikt'
                                ? 'text-warning-600'
                                : calculations.bmiCategory === 'undervikt_1' ||
                                    calculations.bmiCategory === 'undervikt_2' ||
                                    calculations.bmiCategory === 'undervikt_3'
                                  ? 'text-sky-600'
                                  : 'text-error-600' // fetma_1, fetma_2, fetma_3
                          )}
                        >
                          {calculations.bmiCategory
                            ? t(`insights.bmiCategory.${calculations.bmiCategory}`)
                            : null}
                        </p>
                      </div>
                    )}
                    {visibleInsights.includes('ffmi') &&
                      calculations.ffmi != null &&
                      calculations.ffmi > 0 && (
                        <div className="rounded-xl border border-neutral-200 p-4 flex-1">
                          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                            FFMI
                          </p>
                          <p className="text-2xl font-bold text-neutral-900">
                            {Math.round(calculations.ffmi * 10) / 10}
                          </p>
                          {calculations.ffmiCategory && (
                            <p className="text-sm font-medium text-neutral-600">
                              {t(`insights.ffmiCategory.${calculations.ffmiCategory}`)}
                            </p>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Supplementary info row */}
                  {(visibleInsights.includes('idealweight') || visibleInsights.includes('age')) && (
                    <p className="mt-3 text-sm text-neutral-500">
                      {visibleInsights.includes('idealweight') && calculations.idealWeightRange && (
                        <span>
                          {t('insights.idealWeight', {
                            min: Math.round(calculations.idealWeightRange.min),
                            max: Math.round(calculations.idealWeightRange.max),
                          })}
                        </span>
                      )}
                      {visibleInsights.includes('idealweight') &&
                        calculations.idealWeightRange &&
                        visibleInsights.includes('age') &&
                        calculations.age && <span> · </span>}
                      {visibleInsights.includes('age') && calculations.age && (
                        <span>{t('insights.age', { age: calculations.age })}</span>
                      )}
                    </p>
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
                    {todayLog.meals.map(meal => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0"
                      >
                        <p className="font-medium text-neutral-900 text-sm">{meal.meal_name}</p>
                        <p className="text-sm text-neutral-500">
                          {Math.round(meal.meal_calories)} kcal
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    onClick={() => navigate('/app/today')}
                  >
                    {t('today.viewAll')}
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
              {advancedMode ? t('mode.showLess') : t('mode.showMore')}
            </button>
          </div>
        )}
      </DashboardLayout>
    </ProfileCompletionGuard>
  )
}
