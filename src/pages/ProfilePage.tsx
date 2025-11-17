import DashboardLayout from '@/components/layout/DashboardLayout'
import UserProfileForm from '@/components/UserProfileForm'
import MacroModesCard from '@/components/MacroModesCard'
import MacroDistributionCard from '@/components/MacroDistributionCard'
import MealSettingsCard from '@/components/MealSettingsCard'
import ProfileList from '@/components/ProfileList'
import { User, Users, Plus } from 'lucide-react'
import { useState } from 'react'
import BMRConceptModal from '@/components/calculator/BMRConceptModal'
import PALConceptModal from '@/components/calculator/PALConceptModal'
import { Card } from '@/components/ui/card'
import { useProfiles, useNewProfile } from '@/hooks'
import { useProfileStore } from '@/stores/profileStore'

export default function ProfilePage() {
  const [showBMRConceptModal, setShowBMRConceptModal] = useState(false)
  const [showPALConceptModal, setShowPALConceptModal] = useState(false)

  // Load profiles to populate store
  useProfiles()

  // Hook for creating new profile
  const { startNewProfile } = useNewProfile()

  // Get active profile for TDEE calculation
  const activeProfile = useProfileStore(state => state.activeProfile)
  const tdee = activeProfile?.tdee

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
          <div className="space-y-8">
            {/* Main Profile Form */}
            <UserProfileForm />

            {/* Macro Distribution Settings */}
            <MacroDistributionCard tdee={tdee} />

            {/* Meal Settings */}
            <MealSettingsCard tdee={tdee} />

            {/* Macro Modes Card */}
            <MacroModesCard />
          </div>

          {/* Sidebar - Information Panel */}
          <div className="space-y-4 md:sticky md:top-4 md:self-start">
            {/* Profile Switcher Section */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">Mina Profiler</h3>
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

            {/* BMR Information Section */}
            <Card className="bg-gradient-to-br from-primary-50 to-accent-50">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Vad är BMR?</h3>
              <p className="text-sm text-neutral-700 leading-relaxed mb-4">
                BMR (Basal Metabolic Rate) är den mängd energi kroppen behöver i vila för
                grundläggande funktioner. Det är din kropps grundförbrukning.
              </p>
              <button
                type="button"
                onClick={() => setShowBMRConceptModal(true)}
                className="text-sm text-primary-600 hover:text-primary-700 underline transition-colors"
              >
                Läs mer →
              </button>
            </Card>

            {/* PAL Information Section */}
            <Card className="bg-gradient-to-br from-primary-50 to-accent-50">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Vad är PAL?</h3>
              <p className="text-sm text-neutral-700 leading-relaxed mb-3">
                PAL (Physical Activity Level) beskriver din genomsnittliga energiförbrukning
                relativt din BMR. Ju högre PAL, desto högre kaloribehov.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-neutral-800 font-medium text-center">TDEE = BMR × PAL</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPALConceptModal(true)}
                className="text-sm text-primary-600 hover:text-primary-700 underline transition-colors"
              >
                Läs mer →
              </button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BMRConceptModal isOpen={showBMRConceptModal} onClose={() => setShowBMRConceptModal(false)} />
      <PALConceptModal isOpen={showPALConceptModal} onClose={() => setShowPALConceptModal(false)} />
    </DashboardLayout>
  )
}
