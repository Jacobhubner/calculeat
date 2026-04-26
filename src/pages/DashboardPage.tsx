import DashboardLayout from '@/components/layout/DashboardLayout'
import ProfileCompletionGuard from '@/components/ProfileCompletionGuard'
import OnboardingModal from '@/components/OnboardingModal'
import StatCard from '@/components/StatCard'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles, useOnboarding } from '@/hooks'
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
import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('dashboard')
  const { profile: authProfile } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles, isLoading } = useProfiles()
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useOnboarding()

  const profile = allProfiles?.find(p => p.id === activeProfile?.id)

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

            {/* Quick links */}
            <div className="space-y-3">
              {quickLinks.map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="w-full flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl px-5 py-4 hover:border-primary-300 hover:bg-primary-50 transition-colors shadow-sm"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <span className="flex-1 text-left text-base font-medium text-neutral-800">
                    {label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProfileCompletionGuard>
  )
}
