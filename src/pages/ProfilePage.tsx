import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UserProfileForm from '@/components/UserProfileForm'
import MacroModesCard from '@/components/MacroModesCard'
import MacroDistributionCard from '@/components/MacroDistributionCard'
import MealSettingsCard from '@/components/MealSettingsCard'
import ProfileList from '@/components/ProfileList'
import InfoCardWithModal from '@/components/InfoCardWithModal'
import BMRvsRMRContent from '@/components/info/BMRvsRMRContent'
import PALvsMETContent from '@/components/info/PALvsMETContent'
import TDEEContent from '@/components/info/TDEEContent'
import LBMvsFFMContent from '@/components/info/LBMvsFFMContent'
import CollapsibleSidebar from '@/components/CollapsibleSidebar'
import { User, Users, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useProfiles, useNewProfile } from '@/hooks'
import { useProfileStore } from '@/stores/profileStore'

interface CalculatorResult {
  bmr: number
  tdee: number
  tdeeMin: number
  tdeeMax: number
}

interface MacroRanges {
  fatMin: number
  fatMax: number
  carbMin: number
  carbMax: number
  proteinMin: number
  proteinMax: number
}

interface MealSettings {
  meals: Array<{
    name: string
    percentage: number
  }>
}

export default function ProfilePage() {
  // Load profiles to populate store
  useProfiles()

  // Hook for creating new profile
  const { startNewProfile } = useNewProfile()

  // Get active profile for TDEE calculation
  const activeProfile = useProfileStore(state => state.activeProfile)

  // Local state for calculation results (used when creating new profile)
  const [localResult, setLocalResult] = useState<CalculatorResult | null>(null)

  // Local state for macro ranges (used when creating/editing profile)
  const [macroRanges, setMacroRanges] = useState<MacroRanges | null>(null)

  // Local state for meal settings (used when creating/editing profile)
  const [mealSettings, setMealSettings] = useState<MealSettings | null>(null)

  // Local state for body fat percentage from form
  const [currentBodyFat, setCurrentBodyFat] = useState<string>('')

  // Use local result if available (new profile mode), otherwise use saved tdee
  const tdee = localResult?.tdee || activeProfile?.tdee

  // Get calorie range for macro calculations (based on energy goal)
  const caloriesMin = activeProfile?.calories_min
  const caloriesMax = activeProfile?.calories_max
  const avgCalories = caloriesMin && caloriesMax ? (caloriesMin + caloriesMax) / 2 : tdee

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
          <User className="h-8 w-8 text-primary-600" />
          Min Profil
        </h1>
        <p className="text-neutral-600">
          Hantera din profil och personliga inställningar. Fyll i din information för att få
          personliga beräkningar och rekommendationer.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          {/* Main content column */}
          <div className="space-y-4">
            {/* Main Profile Form */}
            <UserProfileForm
              onResultChange={setLocalResult}
              macroRanges={macroRanges}
              mealSettings={mealSettings}
              onBodyFatChange={setCurrentBodyFat}
            />

            {/* Only show macro cards if results (TDEE) exist */}
            {tdee && (
              <>
                {/* Macro Distribution Settings */}
                <MacroDistributionCard tdee={avgCalories} onMacroChange={setMacroRanges} />

                {/* Meal Settings */}
                <MealSettingsCard tdee={avgCalories} onMealChange={setMealSettings} />

                {/* Macro Modes Card */}
                <MacroModesCard currentBodyFat={currentBodyFat} />
              </>
            )}
          </div>

          {/* Sidebar - Information Panel */}
          <CollapsibleSidebar className="space-y-4 md:sticky md:top-20 md:self-start z-40">
            {/* Profile Switcher Section */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">Mina Profilkort</h3>
                </div>

                {/* Green Plus Button */}
                <button
                  onClick={startNewProfile}
                  className="p-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                  title="Skapa ny profil"
                >
                  <Plus className="h-4 w-4 text-white" />
                </button>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Växla mellan olika profiler eller skapa en ny
              </p>
              <ProfileList />
            </Card>

            {/* Info Cards with Modals */}
            <InfoCardWithModal
              title="Vad är BMR och RMR?"
              modalTitle="BMR vs RMR - Skillnaden förklarad"
              modalContent={<BMRvsRMRContent />}
            />

            <InfoCardWithModal
              title="Vad är PAL och MET?"
              modalTitle="PAL vs MET - Aktivitetsnivåer förklarade"
              modalContent={<PALvsMETContent />}
            />

            <InfoCardWithModal
              title="Vad är TDEE?"
              modalTitle="TDEE - Total Daily Energy Expenditure"
              modalContent={<TDEEContent />}
            />

            <InfoCardWithModal
              title="Skillnad på LBM och FFM?"
              modalTitle="LBM vs FFM - Fettfri massa förklarad"
              modalContent={<LBMvsFFMContent />}
            />
          </CollapsibleSidebar>
        </div>
      </div>
    </DashboardLayout>
  )
}
