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
  Flame,
  Target,
  TrendingUp,
  Scale,
  UtensilsCrossed,
  BookOpen,
  User,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDailySummary } from '@/hooks/useDailySummary'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { profile: authProfile } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles, isLoading } = useProfiles()
  const { data: todayLog } = useTodayLog()
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding()

  const profile = allProfiles?.find(p => p.id === activeProfile?.id)

  const dailySummary = useDailySummary(todayLog, profile)

  const calculations = useMemo(() => {
    if (!profile) {
      return { macros: null }
    }

    const calorieGoal =
      profile.calories_min && profile.calories_max
        ? {
            min: profile.calories_min,
            max: profile.calories_max,
            target: Math.round((profile.calories_min + profile.calories_max) / 2),
          }
        : null

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
      const proteinMinG = Math.round((targetCalories * profile.protein_min_percent) / 100 / 4)
      const proteinMaxG = Math.round((targetCalories * profile.protein_max_percent) / 100 / 4)
      const fatMinG = Math.round((targetCalories * profile.fat_min_percent) / 100 / 9)
      const fatMaxG = Math.round((targetCalories * profile.fat_max_percent) / 100 / 9)
      const carbMinG = Math.round((targetCalories * profile.carb_min_percent) / 100 / 4)
      const carbMaxG = Math.round((targetCalories * profile.carb_max_percent) / 100 / 4)
      macros = {
        protein: { gramsMin: proteinMinG, gramsMax: proteinMaxG },
        fat: { gramsMin: fatMinG, gramsMax: fatMaxG },
        carbs: { gramsMin: carbMinG, gramsMax: carbMaxG },
      }
    }

    return { macros }
  }, [profile])

  const consumed = todayLog?.total_calories || 0
  const targetMax = profile?.calories_max || 2000
  const ringMin = profile?.calories_min ?? Math.round(targetMax * 0.85)

  const handleOnboardingClose = (open: boolean) => {
    if (!open) completeOnboarding()
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

  const quickLinks = [
    { icon: UtensilsCrossed, label: t('quickLinks.logFood'), to: '/app/today' },
    { icon: BookOpen, label: t('quickLinks.recipes'), to: '/app/recipes' },
    { icon: User, label: t('quickLinks.profile'), to: '/app/profile' },
    { icon: Target, label: t('quickLinks.goalCalc'), to: '/app/tools/goal-calculator' },
  ]

  return (
    <ProfileCompletionGuard>
      <DashboardLayout>
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
        </div>

        {!hasBasicInfo ? (
          <EmptyState
            icon={Scale}
            title={t('emptyProfile.title')}
            description={t('emptyProfile.description')}
            action={{
              label: t('emptyProfile.action'),
              onClick: () => (window.location.href = '/app/profile'),
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* Stat cards */}
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

            {/* Calorie Ring + Macro status */}
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

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="flex flex-col items-start gap-3 bg-white border border-neutral-200 rounded-2xl px-5 py-4 hover:border-primary-300 hover:bg-primary-50 transition-colors shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-neutral-800 text-left">{label}</span>
                    <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProfileCompletionGuard>
  )
}
