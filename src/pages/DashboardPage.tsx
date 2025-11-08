import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import StatCard from '@/components/StatCard'
import CalorieRing from '@/components/CalorieRing'
import MacroBar from '@/components/MacroBar'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile, useCalculations } from '@/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Flame,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Dumbbell as DumbbellIcon,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { profile: authProfile } = useAuth()
  const { data: profile, isLoading } = useUserProfile()
  const calculations = useCalculations(profile)

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
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Hej {authProfile?.full_name || 'där'}! 👋
        </h1>
        <p className="text-neutral-600">
          {hasBasicInfo ? 'Här är din översikt för idag' : 'Fyll i din profil för att komma igång'}
        </p>
      </div>

      {!hasBasicInfo ? (
        /* Empty State - No Profile */
        <EmptyState
          icon={Scale}
          title="Komplettera din profil"
          description="För att få personliga rekommendationer och se dina statistik behöver du fylla i din profil."
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
              value={calculations.bmr || '-'}
              unit="kcal"
              icon={Flame}
              variant="primary"
            />
            <StatCard
              title="TDEE"
              value={calculations.tdee || '-'}
              unit="kcal"
              icon={Activity}
              variant="accent"
            />
            <StatCard
              title="Kalorimål"
              value={calculations.calorieGoal?.target || '-'}
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
            <CalorieRing
              consumed={0}
              target={calculations.calorieGoal?.target || 2000}
              remaining={calculations.calorieGoal?.target || 2000}
            />

            {/* Macro Bar */}
            {calculations.macros && <MacroBar {...calculations.macros} />}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snabbåtgärder</CardTitle>
              <CardDescription>Logga dina måltider och träning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Button size="lg" variant="outline" className="h-20" disabled>
                  <UtensilsCrossed className="h-5 w-5 mr-2" />
                  Logga måltid
                  <span className="ml-2 text-xs text-neutral-500">(Kommer snart)</span>
                </Button>
                <Button size="lg" variant="outline" className="h-20" disabled>
                  <DumbbellIcon className="h-5 w-5 mr-2" />
                  Logga träning
                  <span className="ml-2 text-xs text-neutral-500">(Kommer snart)</span>
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
  )
}
