import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfileCompletionGuard from '@/components/ProfileCompletionGuard'
import OnboardingModal from '@/components/OnboardingModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MacroRangeBar } from '@/components/daily/MacroRangeBar'
import { TDEEScenarioCard } from '@/components/dashboard/TDEEScenarioCard'
import { DashboardHeroSection } from '@/components/dashboard/DashboardHeroSection'
import { QuickSummaryCards } from '@/components/dashboard/QuickSummaryCards'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles, useOnboarding } from '@/hooks'
import { useTodayLog } from '@/hooks/useDailyLogs'
import { useWeightHistory } from '@/hooks/useWeightHistory'
import { useProfileStore } from '@/stores/profileStore'
import { Skeleton } from '@/components/ui/skeleton'
import { Scale, UtensilsCrossed, BookOpen, User, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDailySummary } from '@/hooks/useDailySummary'
import { macroGramsFromPercent } from '@/lib/calculations/dailySummary'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { profile: authProfile } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles, isLoading } = useProfiles()
  const { data: todayLog } = useTodayLog()
  const { data: weightHistory } = useWeightHistory()
  const { showOnboarding, setShowOnboarding, completeOnboarding, saveStep, resumeStep } =
    useOnboarding()
  const { plan } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

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
      // Nedre gräns mot calories_min, övre mot calories_max — konsekvent med
      // profilsidan och Today-vyn (macroGramsFromPercent). Tidigare användes
      // medelvärdet (target) för båda gränserna, vilket gav förskjutna gram.
      const protein = macroGramsFromPercent(
        profile.protein_min_percent,
        profile.protein_max_percent,
        calorieGoal.min,
        calorieGoal.max,
        4
      )
      const fat = macroGramsFromPercent(
        profile.fat_min_percent,
        profile.fat_max_percent,
        calorieGoal.min,
        calorieGoal.max,
        9
      )
      const carbs = macroGramsFromPercent(
        profile.carb_min_percent,
        profile.carb_max_percent,
        calorieGoal.min,
        calorieGoal.max,
        4
      )
      macros = {
        protein: { gramsMin: Math.round(protein.minGrams), gramsMax: Math.round(protein.maxGrams) },
        fat: { gramsMin: Math.round(fat.minGrams), gramsMax: Math.round(fat.maxGrams) },
        carbs: { gramsMin: Math.round(carbs.minGrams), gramsMax: Math.round(carbs.maxGrams) },
      }
    }

    return { macros }
  }, [profile])

  const consumed = todayLog?.total_calories || 0
  const targetMax = profile?.calories_max || 2000
  const ringMin = profile?.calories_min ?? Math.round(targetMax * 0.85)

  // Calculate weight change over last 30 days
  const getWeightTrend = () => {
    if (!weightHistory || weightHistory.length < 1) {
      return { weightChange: 0, isDownTrend: false }
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Most recent weight is first (sorted descending by recorded_at)
    const currentWeight = weightHistory[0]?.weight_kg

    // Find oldest weight in last 30 days
    const oldestInRange = weightHistory.find(w => new Date(w.recorded_at) <= thirtyDaysAgo)
    const oldWeight = oldestInRange?.weight_kg

    if (currentWeight === undefined || oldWeight === undefined) {
      return { weightChange: 0, isDownTrend: false }
    }

    const change = currentWeight - oldWeight // negative = lost weight, positive = gained weight
    const isDownTrend = change < 0 // true if lost weight
    const displayValue = Math.abs(change)

    return { weightChange: displayValue, isDownTrend }
  }

  const { weightChange, isDownTrend } = getWeightTrend()

  const handleOnboardingClose = (open: boolean) => {
    if (!open) {
      completeOnboarding()
      // Fas 5-touchpoint: visa premiumerbjudandet en gång direkt efter
      // avslutad onboarding — men bara för free (no-op under soft launch,
      // där alla behandlas som founder)
      if (plan === 'free') {
        openUpgradeModal()
      }
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

  const quickLinks = [
    { icon: UtensilsCrossed, label: t('quickLinks.logFood'), to: '/app/today' },
    { icon: BookOpen, label: t('quickLinks.recipes'), to: '/app/recipes' },
    { icon: User, label: t('quickLinks.profile'), to: '/app/profile' },
    { icon: Target, label: t('quickLinks.goalCalc'), to: '/app/tools/goal-calculator' },
  ]

  return (
    <ProfileCompletionGuard>
      <DashboardLayout>
        <OnboardingModal
          open={!!showOnboarding}
          onOpenChange={handleOnboardingClose}
          initialStep={resumeStep()}
          onStepChange={saveStep}
        />

        {/* Header - Professional */}
        <div className="mb-8">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">
              {t('greeting.welcomeBack')}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900">
              {authProfile?.profile_name || t('greeting.user')}
            </h1>
          </div>
          {!hasBasicInfo && (
            <p className="text-neutral-600 text-sm mt-3">{t('greeting.fillProfile')}</p>
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
            {/* Hero Section - Redesigned */}
            <DashboardHeroSection consumed={consumed} min={ringMin} max={targetMax} />

            {/* Quick Summary Cards - Phase 3 */}
            <QuickSummaryCards
              calorieDeficit={Math.round(targetMax - consumed)}
              weightChange={weightChange}
              goalProgress={Math.round((consumed / targetMax) * 100)}
              isWeightTrendingDown={isDownTrend}
              tdee={Math.round(targetMax)}
              calorieGoal={profile?.calorie_goal}
            />

            {/* Macro status */}
            {dailySummary &&
              (() => {
                const fatKcal = dailySummary.fatStatus.current * 9
                const carbsKcal = dailySummary.carbStatus.current * 4
                const proteinKcal = dailySummary.proteinStatus.current * 4
                const macroTotalKcal = fatKcal + carbsKcal + proteinKcal
                const fatPct = macroTotalKcal > 0 ? Math.round((fatKcal / macroTotalKcal) * 100) : 0
                const carbsPct =
                  macroTotalKcal > 0 ? Math.round((carbsKcal / macroTotalKcal) * 100) : 0
                const proteinPct =
                  macroTotalKcal > 0 ? Math.round((proteinKcal / macroTotalKcal) * 100) : 0
                return (
                  <Card variant="gradient">
                    <CardHeader className="pb-3">
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

            {/* TDEE Scenarios */}
            {profile?.bmr && profile?.tdee && (
              <TDEEScenarioCard bmr={profile.bmr} tdee={profile.tdee} />
            )}

            {/* Quick links */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {quickLinks.map(({ icon: Icon, label, to }) => (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-white to-neutral-50 border border-neutral-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="text-center text-sm font-medium text-neutral-800 leading-tight">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProfileCompletionGuard>
  )
}
