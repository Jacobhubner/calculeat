/**
 * ProfilePage - Omstrukturerad med profilkortssystem
 * Conditional rendering baserat på grundläggande information och TDEE-status
 */

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User } from 'lucide-react'
import { useProfiles, useUpdateProfile, useCreateProfile, useCreateWeightHistory } from '@/hooks'
import { useProfileStore } from '@/stores/profileStore'
import type { Gender } from '@/lib/types'
import { toast } from 'sonner'

// New components
import ProfileCardSidebar from '@/components/profile/ProfileCardSidebar'
import BasicInfoFields from '@/components/profile/BasicInfoFields'
import TDEEOptions from '@/components/profile/TDEEOptions'
import BasicProfileForm from '@/components/profile/BasicProfileForm'
import WeightTracker from '@/components/profile/WeightTracker'

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
  const createProfile = useCreateProfile()
  const createWeightHistory = useCreateWeightHistory()

  // NOTE: macroRanges and mealSettings previously used for local state
  // Now handled via pendingChanges state

  // Local state for pending changes (not saved until disk icon clicked)
  const [pendingChanges, setPendingChanges] = useState<{
    // Basic info
    birth_date?: string
    gender?: Gender | ''
    height_cm?: number
    initial_weight_kg?: number
    // Body composition
    body_fat_percentage?: number
    weight_kg?: number
    // Energy goals
    calorie_goal?: string
    deficit_level?: string | null
    // Macros
    fat_min_percent?: number
    fat_max_percent?: number
    carb_min_percent?: number
    carb_max_percent?: number
    protein_min_percent?: number
    protein_max_percent?: number
    // Meals
    meals_config?: { meals: { name: string; percentage: number }[] }
  }>({})

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0

  // Merge active profile with pending changes for display
  const displayProfile = activeProfile ? { ...activeProfile, ...pendingChanges } : null

  // Create a fully merged profile for components that need complete profile data with pending changes
  const mergedProfile = displayProfile as Profile | null

  // Check if basic info is filled (using display profile with pending changes)
  const hasBasicInfo = !!(
    displayProfile?.birth_date &&
    displayProfile?.gender &&
    displayProfile?.height_cm &&
    displayProfile?.initial_weight_kg
  )

  // Check if TDEE exists
  const hasTDEE = !!activeProfile?.tdee

  // Fields should be locked as soon as basic info is complete
  // User must delete all profile cards to edit these fields again
  const fieldsAreLocked = hasBasicInfo

  // Handlers for BasicInfoFields - update pending state instead of API
  const handleBirthDateChange = (birthDate: string) => {
    setPendingChanges(prev => ({ ...prev, birth_date: birthDate }))
  }

  const handleGenderChange = (gender: Gender | '') => {
    setPendingChanges(prev => ({ ...prev, gender: gender || undefined }))
  }

  const handleHeightChange = (height: number | undefined) => {
    setPendingChanges(prev => ({ ...prev, height_cm: height }))
  }

  const handleInitialWeightChange = (weight: number | undefined) => {
    setPendingChanges(prev => ({ ...prev, initial_weight_kg: weight }))
  }

  // Handlers for BasicProfileForm - update pending state
  const handleBodyFatChange = (bodyFat: number | undefined) => {
    setPendingChanges(prev => ({ ...prev, body_fat_percentage: bodyFat }))
  }

  const handleGoalChange = (goal: string) => {
    setPendingChanges(prev => ({ ...prev, calorie_goal: goal }))
  }

  const handleDeficitChange = (deficit: string | null) => {
    setPendingChanges(prev => ({ ...prev, deficit_level: deficit }))
  }

  // Handler for WeightTracker - update pending state
  const handleWeightChange = (weight: number) => {
    setPendingChanges(prev => ({ ...prev, weight_kg: weight }))
  }

  // Handlers for MacroDistributionCard - update pending state
  const handleMacroChange = (macros: {
    fatMin: number
    fatMax: number
    carbMin: number
    carbMax: number
    proteinMin: number
    proteinMax: number
  }) => {
    if (!activeProfile) return

    // Only add to pending changes if values actually changed from saved profile
    const hasChanged =
      macros.fatMin !== activeProfile.fat_min_percent ||
      macros.fatMax !== activeProfile.fat_max_percent ||
      macros.carbMin !== activeProfile.carb_min_percent ||
      macros.carbMax !== activeProfile.carb_max_percent ||
      macros.proteinMin !== activeProfile.protein_min_percent ||
      macros.proteinMax !== activeProfile.protein_max_percent

    if (hasChanged) {
      setPendingChanges(prev => ({
        ...prev,
        fat_min_percent: macros.fatMin,
        fat_max_percent: macros.fatMax,
        carb_min_percent: macros.carbMin,
        carb_max_percent: macros.carbMax,
        protein_min_percent: macros.proteinMin,
        protein_max_percent: macros.proteinMax,
      }))
    } else {
      // Remove macro fields from pending changes if they match saved values
      setPendingChanges(prev => {
        const { fat_min_percent, fat_max_percent, carb_min_percent, carb_max_percent, protein_min_percent, protein_max_percent, ...rest } = prev
        return rest
      })
    }
  }

  // Handler for MealSettingsCard - update pending state
  const handleMealChange = (settings: { meals: { name: string; percentage: number }[] }) => {
    if (!activeProfile) return

    // Only add to pending changes if meals actually changed from saved profile
    const currentMeals = activeProfile.meals_config as { meals: { name: string; percentage: number }[] } | null
    const hasChanged = JSON.stringify(settings.meals) !== JSON.stringify(currentMeals?.meals || [])

    if (hasChanged) {
      setPendingChanges(prev => ({ ...prev, meals_config: settings }))
    } else {
      // Remove meals_config from pending changes if it matches saved values
      setPendingChanges(prev => {
        const { meals_config, ...rest } = prev
        return rest
      })
    }
  }

  // Handler for profile selection
  const handleSelectProfile = (profileId: string) => {
    // Warn if there are unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Du har osparade ändringar i grundläggande information. Vill du byta profil? Osparade ändringar kommer att förloras.'
      )
      if (!confirmed) return
    }

    const profile = allProfiles.find(p => p.id === profileId)
    if (profile) {
      setActiveProfile(profile)
      setPendingChanges({}) // Clear pending changes when switching profiles
    }
  }

  // Handler for profile save - save pending changes
  const handleSaveProfile = async (_profileId: string) => {
    if (!activeProfile || Object.keys(pendingChanges).length === 0) return

    // Check if basic info is complete (using display profile with pending changes)
    const isBasicInfoComplete = !!(
      displayProfile?.birth_date &&
      displayProfile?.gender &&
      displayProfile?.height_cm &&
      displayProfile?.initial_weight_kg
    )

    if (!isBasicInfoComplete) {
      toast.error('Fyll i all grundläggande information innan du sparar', {
        description: 'Födelsedatum, kön, längd och startvikt krävs',
      })
      return
    }

    try {
      // Save profile changes
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        data: pendingChanges,
      })

      // If weight was changed, add to weight history
      if (pendingChanges.weight_kg !== undefined && pendingChanges.weight_kg !== activeProfile.weight_kg) {
        await createWeightHistory.mutateAsync({
          profile_id: activeProfile.id,
          weight_kg: pendingChanges.weight_kg,
        })
      }

      setPendingChanges({}) // Clear pending changes after successful save
      toast.success('Ändringar sparade')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Kunde inte spara ändringar')
    }
  }

  // Handler for profile delete (handled by ProfileCardList component)
  const handleDeleteProfile = (_profileId: string) => {
    // Handled by ProfileCardList
  }

  // Handler for creating new profile
  const handleCreateNewProfile = async () => {
    // Generate next profile name
    const nextNumber = allProfiles.length
    const profileName = nextNumber === 0 ? 'Profilkort' : `Profilkort ${nextNumber}`

    try {
      await createProfile.mutateAsync({
        profile_name: profileName,
        // New profile starts empty - user will fill in basic info
      })
    } catch (error) {
      console.error('Error creating profile:', error)
      // Error toast is handled by useCreateProfile hook
    }
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
            {/* SCENARIO 1: No basic info - Only show BasicInfoFields */}
            {!hasBasicInfo && displayProfile && (
              <BasicInfoFields
                birthDate={displayProfile.birth_date}
                gender={displayProfile.gender}
                height={displayProfile.height_cm}
                initialWeight={displayProfile.initial_weight_kg}
                onBirthDateChange={handleBirthDateChange}
                onGenderChange={handleGenderChange}
                onHeightChange={handleHeightChange}
                onInitialWeightChange={handleInitialWeightChange}
                locked={false}
                showLockNotice={false}
              />
            )}

            {/* SCENARIO 2: Has basic info but no TDEE - Show basic info + two options */}
            {hasBasicInfo && !hasTDEE && displayProfile && (
              <>
                <BasicInfoFields
                  birthDate={displayProfile.birth_date}
                  gender={displayProfile.gender}
                  height={displayProfile.height_cm}
                  initialWeight={displayProfile.initial_weight_kg}
                  onBirthDateChange={handleBirthDateChange}
                  onGenderChange={handleGenderChange}
                  onHeightChange={handleHeightChange}
                  onInitialWeightChange={handleInitialWeightChange}
                  locked={fieldsAreLocked}
                  showLockNotice={fieldsAreLocked}
                />
                <TDEEOptions
                  profileId={displayProfile.id}
                  initialWeight={displayProfile.initial_weight_kg}
                  onManualTDEESuccess={handleManualTDEESuccess}
                />
              </>
            )}

            {/* SCENARIO 3: Has basic info AND TDEE - Show full profile */}
            {hasBasicInfo && hasTDEE && displayProfile && activeProfile && mergedProfile && (
              <>
                <BasicInfoFields
                  birthDate={displayProfile.birth_date}
                  gender={displayProfile.gender}
                  height={displayProfile.height_cm}
                  initialWeight={displayProfile.initial_weight_kg}
                  onBirthDateChange={handleBirthDateChange}
                  onGenderChange={handleGenderChange}
                  onHeightChange={handleHeightChange}
                  onInitialWeightChange={handleInitialWeightChange}
                  locked={fieldsAreLocked}
                  showLockNotice={fieldsAreLocked}
                />

                <BasicProfileForm
                  profile={activeProfile}
                  onBodyFatChange={handleBodyFatChange}
                  onGoalChange={handleGoalChange}
                  onDeficitChange={handleDeficitChange}
                />

                {/* Weight Tracking - Use mergedProfile to show pending changes */}
                <WeightTracker profile={mergedProfile} onWeightChange={handleWeightChange} />

                {/* Macro Distribution Settings */}
                <MacroDistributionCard
                  caloriesMin={activeProfile.calories_min || activeProfile.tdee || 0}
                  caloriesMax={activeProfile.calories_max || activeProfile.tdee || 0}
                  onMacroChange={handleMacroChange}
                />

                {/* Meal Settings */}
                <MealSettingsCard tdee={activeProfile.tdee || 0} onMealChange={handleMealChange} />

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
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={updateProfile.isPending}
              canSave={hasBasicInfo}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
