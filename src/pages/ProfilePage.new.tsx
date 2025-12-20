/**
 * ProfilePage - Omstrukturerad med profilkortssystem
 * Conditional rendering baserat på grundtre och TDEE-status
 */

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User } from 'lucide-react'
import { useProfiles, useUpdateProfile, useNewProfile } from '@/hooks'
import { useProfileStore } from '@/stores/profileStore'
import type { Gender } from '@/lib/types'
import { toast } from 'sonner'

// New components
import ProfileCardSidebar from '@/components/profile/ProfileCardSidebar'
import GrundtreFields from '@/components/profile/GrundtreFields'
import TDEEOptions from '@/components/profile/TDEEOptions'
import BasicProfileForm from '@/components/profile/BasicProfileForm'

// Existing components (keep for now)
import MacroDistributionCard from '@/components/MacroDistributionCard'
import MealSettingsCard from '@/components/MealSettingsCard'
import MacroModesCard from '@/components/MacroModesCard'

export default function ProfilePage() {
  // Load profiles
  const { data: allProfiles = [] } = useProfiles()

  // Get active profile from store
  const activeProfileFromStore = useProfileStore(state => state.activeProfile)
  const setActiveProfile = useProfileStore(state => state.setActiveProfile)

  // Get FULL active profile from React Query
  const activeProfile = allProfiles.find(p => p.id === activeProfileFromStore?.id)

  // Hooks for profile operations
  const updateProfile = useUpdateProfile()
  const { startNewProfile } = useNewProfile()

  // Local state for macro and meal settings
  const [macroRanges, setMacroRanges] = useState<any>(null)
  const [mealSettings, setMealSettings] = useState<any>(null)

  // Check if grundtre is filled
  const hasGrundtre = !!(
    activeProfile?.birth_date &&
    activeProfile?.gender &&
    activeProfile?.height_cm
  )

  // Check if TDEE exists
  const hasTDEE = !!activeProfile?.tdee

  // Check if fields should be locked (more than 1 profile)
  const canEditLockedFields = allProfiles.length <= 1

  // Handlers for GrundtreFields
  const handleBirthDateChange = async (birthDate: string) => {
    if (!activeProfile) return
    try {
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        updates: { birth_date: birthDate },
      })
    } catch (error) {
      console.error('Error updating birth date:', error)
      toast.error('Kunde inte uppdatera födelsedatum')
    }
  }

  const handleGenderChange = async (gender: Gender | '') => {
    if (!activeProfile) return
    try {
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        updates: { gender: gender || undefined },
      })
    } catch (error) {
      console.error('Error updating gender:', error)
      toast.error('Kunde inte uppdatera kön')
    }
  }

  const handleHeightChange = async (height: number | undefined) => {
    if (!activeProfile) return
    try {
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        updates: { height_cm: height },
      })
    } catch (error) {
      console.error('Error updating height:', error)
      toast.error('Kunde inte uppdatera längd')
    }
  }

  // Handler for profile selection
  const handleSelectProfile = (profileId: string) => {
    const profile = allProfiles.find(p => p.id === profileId)
    if (profile) {
      setActiveProfile(profile)
    }
  }

  // Handler for profile save (not needed - auto-save)
  const handleSaveProfile = (profileId: string) => {
    // Auto-save is handled by individual components
  }

  // Handler for profile delete (not needed - handled by ProfileCardList)
  const handleDeleteProfile = (profileId: string) => {
    // Handled by ProfileCardList
  }

  // Handler for creating new profile
  const handleCreateNewProfile = () => {
    startNewProfile()
  }

  // Handler for manual TDEE success
  const handleManualTDEESuccess = () => {
    toast.success('TDEE har sparats! Du kan nu använda resten av appen.')
  }

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
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Main content column - Conditional rendering */}
          <div className="space-y-4">
            {/* SCENARIO 1: No grundtre - Only show GrundtreFields */}
            {!hasGrundtre && activeProfile && (
              <GrundtreFields
                birthDate={activeProfile.birth_date}
                gender={activeProfile.gender}
                height={activeProfile.height_cm}
                onBirthDateChange={handleBirthDateChange}
                onGenderChange={handleGenderChange}
                onHeightChange={handleHeightChange}
                locked={false}
                showLockNotice={false}
              />
            )}

            {/* SCENARIO 2: Has grundtre but no TDEE - Show grundtre + two options */}
            {hasGrundtre && !hasTDEE && activeProfile && (
              <>
                <GrundtreFields
                  birthDate={activeProfile.birth_date}
                  gender={activeProfile.gender}
                  height={activeProfile.height_cm}
                  onBirthDateChange={handleBirthDateChange}
                  onGenderChange={handleGenderChange}
                  onHeightChange={handleHeightChange}
                  locked={!canEditLockedFields}
                  showLockNotice={!canEditLockedFields}
                />
                <TDEEOptions
                  profileId={activeProfile.id}
                  onManualTDEESuccess={handleManualTDEESuccess}
                />
              </>
            )}

            {/* SCENARIO 3: Has grundtre AND TDEE - Show full profile */}
            {hasGrundtre && hasTDEE && activeProfile && (
              <>
                <GrundtreFields
                  birthDate={activeProfile.birth_date}
                  gender={activeProfile.gender}
                  height={activeProfile.height_cm}
                  onBirthDateChange={handleBirthDateChange}
                  onGenderChange={handleGenderChange}
                  onHeightChange={handleHeightChange}
                  locked={!canEditLockedFields}
                  showLockNotice={!canEditLockedFields}
                />

                <BasicProfileForm profile={activeProfile} />

                {/* Macro Distribution Settings */}
                <MacroDistributionCard
                  caloriesMin={activeProfile.calories_min || activeProfile.tdee || 0}
                  caloriesMax={activeProfile.calories_max || activeProfile.tdee || 0}
                  onMacroChange={(macros) => {
                    // Handle macro changes
                  }}
                />

                {/* Meal Settings */}
                <MealSettingsCard
                  tdee={activeProfile.tdee || 0}
                  onMealChange={(meals) => {
                    // Handle meal changes
                  }}
                />

                {/* Macro Modes Card */}
                <MacroModesCard
                  currentBodyFat={activeProfile.body_fat_percentage?.toString() || ''}
                  liveWeight={activeProfile.weight_kg?.toString() || ''}
                  liveCaloriesMin={activeProfile.calories_min}
                  liveCaloriesMax={activeProfile.calories_max}
                  liveTdee={activeProfile.tdee}
                />
              </>
            )}

            {/* No active profile selected */}
            {!activeProfile && (
              <div className="text-center py-12 text-neutral-500">
                <p>Välj eller skapa en profil för att komma igång</p>
              </div>
            )}
          </div>

          {/* Sidebar - Profile Card Switcher */}
          <div className="md:sticky md:top-20 md:self-start">
            <ProfileCardSidebar
              onCreateNew={handleCreateNewProfile}
              onSelectProfile={handleSelectProfile}
              onSaveProfile={handleSaveProfile}
              onDeleteProfile={handleDeleteProfile}
              hasUnsavedChanges={false}
              isSaving={false}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
