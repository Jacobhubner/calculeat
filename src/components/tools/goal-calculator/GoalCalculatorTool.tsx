import { useState, useMemo } from 'react'
import { Info, TrendingDown, TrendingUp, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useProfileData, useMissingProfileData } from '@/hooks/useProfileData'
import MissingDataCard from '../common/MissingDataCard'
import { useUpdateProfile, useActiveProfile } from '@/hooks'
import EmptyState from '@/components/EmptyState'
import {
  calculateGoal,
  calculateTimeline,
  getBodyFatCategory,
  calculateDailyCalorieAdjustment,
  type GoalCalculationResult,
} from '@/lib/calculations/goalCalculations'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

export default function GoalCalculatorTool() {
  const navigate = useNavigate()
  const { profile } = useActiveProfile()
  const profileData = useProfileData(['weight_kg', 'body_fat_percentage', 'gender'])
  const missingFields = useMissingProfileData(['weight_kg', 'body_fat_percentage', 'gender'])
  const updateProfileMutation = useUpdateProfile()

  // Local state
  const [targetBodyFat, setTargetBodyFat] = useState<number>(15)
  const [weeklyWeightChange, setWeeklyWeightChange] = useState<number>(0.5)

  // Beräkna mål

  const goalResult = useMemo<GoalCalculationResult | null>(() => {
    if (!profileData?.weight_kg || !profileData?.body_fat_percentage) return null

    return calculateGoal(
      profileData.weight_kg,
      profileData.body_fat_percentage,
      targetBodyFat,
      true // Bibehåll fettfri massa
    )
  }, [profileData, targetBodyFat])

  // Beräkna tidslinje
  const timeline = useMemo(() => {
    if (!goalResult) return null

    const dailyCalorieAdjustment = calculateDailyCalorieAdjustment(
      goalResult.weightToChange > 0 ? weeklyWeightChange : -weeklyWeightChange
    )

    const weeklyCalorieAdjustment = dailyCalorieAdjustment * 7

    return calculateTimeline(goalResult.weightToChange, weeklyCalorieAdjustment)
  }, [goalResult, weeklyWeightChange])

  // Kroppsfett kategorier

  const currentCategory = useMemo(() => {
    if (!profileData?.body_fat_percentage || !profileData?.gender) return null
    return getBodyFatCategory(profileData.body_fat_percentage, profileData.gender)
  }, [profileData])

  const targetCategory = useMemo(() => {
    if (!profileData?.gender) return null
    return getBodyFatCategory(targetBodyFat, profileData.gender)
  }, [targetBodyFat, profileData])

  const handleSaveMissingData = async (data: Partial<Profile>) => {
    try {
      await updateProfileMutation.mutateAsync(data)
      toast.success('Profil uppdaterad')
    } catch (error) {
      toast.error('Kunde inte uppdatera profil')
      throw error
    }
  }

  // Check if profile exists - show empty state if no profile
  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Ingen aktiv profil"
        description="Du måste ha en profil för att använda målkalkylatorn."
        action={{
          label: 'Gå till profil',
          onClick: () => navigate('/app/profile'),
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Måluträknare</h2>
          <p className="text-neutral-600 mt-1">
            Beräkna din målvikt och tidslinje för att nå ditt kroppsfettmål
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Mål & Planering
        </Badge>
      </div>

      {/* Saknad Data */}
      {missingFields.length > 0 && (
        <MissingDataCard
          missingFields={missingFields.map(field => ({
            key: field.key,
            label: field.label,
            type: field.key === 'gender' ? 'select' : 'number',
            options:
              field.key === 'gender'
                ? [
                    { value: 'male', label: 'Man' },
                    { value: 'female', label: 'Kvinna' },
                  ]
                : undefined,
          }))}
          onSave={handleSaveMissingData}
        />
      )}

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Om Måluträknaren</p>
              <p className="text-blue-700">
                Denna kalkylator uppskattar din målvikt baserat på önskat kroppsfett % och
                bibehållen fettfri massa. Tidslinjen är en uppskattning - faktiska resultat kan
                variera beroende på träning, kost och individuella faktorer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Vänster: Inställningar */}
        <div className="space-y-6">
          {/* Nuvarande Status */}
          {profileData?.weight_kg && profileData?.body_fat_percentage && (
            <Card>
              <CardHeader>
                <CardTitle>Din Nuvarande Status</CardTitle>
                <CardDescription>Utgångspunkt för beräkningar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <p className="text-sm text-neutral-600 mb-1">Vikt</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {profileData.weight_kg.toFixed(1)} kg
                    </p>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                    <p className="text-sm text-neutral-600 mb-1">Kroppsfett</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {profileData.body_fat_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {goalResult && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700 mb-1">Fettfri massa</p>
                      <p className="text-xl font-bold text-green-900">
                        {goalResult.currentLeanMass.toFixed(1)} kg
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-700 mb-1">Fettmassa</p>
                      <p className="text-xl font-bold text-orange-900">
                        {goalResult.currentFatMass.toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                )}

                {currentCategory && (
                  <div className="mt-4">
                    <p className="text-sm text-neutral-600 mb-2">Kategori:</p>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <p className={`font-semibold ${currentCategory.color}`}>
                        {currentCategory.category}
                      </p>
                      <p className="text-sm text-neutral-600">{currentCategory.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Målslider */}
          <Card>
            <CardHeader>
              <CardTitle>Ställ in ditt mål</CardTitle>
              <CardDescription>Välj önskat kroppsfett %</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Mål Kroppsfett %</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="5"
                      max="35"
                      step="0.5"
                      value={targetBodyFat}
                      onChange={e => setTargetBodyFat(parseFloat(e.target.value) || 15)}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-neutral-600">%</span>
                  </div>
                </div>
                <Slider
                  value={[targetBodyFat]}
                  onValueChange={([value]) => setTargetBodyFat(value)}
                  min={5}
                  max={35}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-2">
                  <span>5%</span>
                  <span>20%</span>
                  <span>35%</span>
                </div>
              </div>

              {targetCategory && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-600 mb-2">Målkategori:</p>
                  <p className={`font-semibold ${targetCategory.color}`}>
                    {targetCategory.category}
                  </p>
                  <p className="text-sm text-neutral-600">{targetCategory.description}</p>
                </div>
              )}

              {/* Veckovis viktförändring */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Veckovis Viktförändring</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.1"
                      max="1.5"
                      step="0.1"
                      value={weeklyWeightChange}
                      onChange={e => setWeeklyWeightChange(parseFloat(e.target.value) || 0.5)}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-neutral-600">kg/vecka</span>
                  </div>
                </div>
                <Slider
                  value={[weeklyWeightChange]}
                  onValueChange={([value]) => setWeeklyWeightChange(value)}
                  min={0.1}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-2">
                  <span>Långsam (0.1 kg)</span>
                  <span>Måttlig (0.75 kg)</span>
                  <span>Snabb (1.5 kg)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Höger: Resultat */}
        {goalResult && timeline && (
          <div className="space-y-6">
            {/* Målvikt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ditt Mål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-neutral-600 mb-2">Målvikt</p>
                  <p className="text-4xl font-bold text-purple-700">
                    {goalResult.targetWeight.toFixed(1)}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">kg</p>

                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex items-center justify-center gap-2">
                      {goalResult.weightToChange < 0 ? (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      )}
                      <span
                        className={`text-xl font-bold ${
                          goalResult.weightToChange < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {goalResult.weightToChange > 0 ? '+' : ''}
                        {goalResult.weightToChange.toFixed(1)} kg
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {goalResult.weightToChange < 0 ? 'att förlora' : 'att öka'}
                    </p>
                  </div>
                </div>

                {/* Fettförändring */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-700 mb-2">Fettförändring:</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {goalResult.fatToChange > 0 ? '+' : ''}
                    {goalResult.fatToChange.toFixed(1)} kg
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tidslinje */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tidslinje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Veckor:</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {timeline.weeksRequired} veckor
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Månader:</span>
                  <span className="text-xl font-bold text-neutral-900">
                    {timeline.monthsRequired} månader
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-neutral-600 mb-1">Uppskattat slutdatum:</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {timeline.estimatedEndDate.toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-neutral-500">
                    * Detta är en uppskattning baserad på bibehållen fettfri massa och konstant
                    veckovis viktförändring. Faktiska resultat kan variera.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
