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
import ProfileResultsSummary from '@/components/profile/ProfileResultsSummary'
import MetabolicInfo from '@/components/profile/MetabolicInfo'
import ATHistoryCard from '@/components/profile/ATHistoryCard'
import BasicInfoFields from '@/components/profile/BasicInfoFields'
import TDEEOptions from '@/components/profile/TDEEOptions'
import BasicProfileForm from '@/components/profile/BasicProfileForm'
import WeightTracker from '@/components/profile/WeightTracker'
import AdvancedSettingsSection from '@/components/profile/AdvancedSettingsSection'

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
    // TDEE
    tdee?: number
    tdee_source?: string
    tdee_calculated_at?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot?: any
    baseline_bmr?: number
    accumulated_at?: number
    // Energy goals
    calorie_goal?: string
    deficit_level?: string | null
    calories_min?: number
    calories_max?: number
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

  // Check if TDEE exists (using display profile to include pending changes)
  const hasTDEE = !!displayProfile?.tdee

  // Fields should be locked as soon as basic info is complete
  // User must delete all profile cards to edit these fields again
  const fieldsAreLocked = hasBasicInfo

  // Handlers for BasicInfoFields - update pending state instead of API
  const handleBirthDateChange = (birthDate: string) => {
    setPendingChanges(prev => {
      if (birthDate === activeProfile?.birth_date) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { birth_date, ...rest } = prev
        return rest
      }
      return { ...prev, birth_date: birthDate }
    })
  }

  const handleGenderChange = (gender: Gender | '') => {
    setPendingChanges(prev => {
      const newGender = gender || undefined
      if (newGender === activeProfile?.gender) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { gender, ...rest } = prev
        return rest
      }
      return { ...prev, gender: newGender }
    })
  }

  const handleHeightChange = (height: number | undefined) => {
    setPendingChanges(prev => {
      if (height === activeProfile?.height_cm) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { height_cm, ...rest } = prev
        return rest
      }
      return { ...prev, height_cm: height }
    })
  }

  const handleInitialWeightChange = (weight: number | undefined) => {
    setPendingChanges(prev => {
      if (weight === activeProfile?.initial_weight_kg) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { initial_weight_kg, ...rest } = prev
        return rest
      }
      return { ...prev, initial_weight_kg: weight }
    })
  }

  // Handlers for BasicProfileForm - update pending state
  const handleBodyFatChange = (bodyFat: number | undefined) => {
    setPendingChanges(prev => {
      if (bodyFat === activeProfile?.body_fat_percentage) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { body_fat_percentage, ...rest } = prev
        return rest
      }
      return { ...prev, body_fat_percentage: bodyFat }
    })
  }

  const handleGoalChange = (goal: string) => {
    if (!activeProfile?.tdee) {
      setPendingChanges(prev => {
        if (goal === activeProfile?.calorie_goal) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { calorie_goal, ...rest } = prev
          return rest
        }
        return { ...prev, calorie_goal: goal }
      })
      return
    }

    const tdee = activeProfile.tdee
    let caloriesMin: number
    let caloriesMax: number
    let deficitLevel: string | null = null

    // Calculate calorie range based on goal
    if (goal === 'Maintain weight') {
      caloriesMin = tdee * 0.97
      caloriesMax = tdee * 1.03
      deficitLevel = null // Clear deficit level for maintenance
    } else if (goal === 'Weight gain') {
      caloriesMin = tdee * 1.1
      caloriesMax = tdee * 1.2
      deficitLevel = null // Clear deficit level for weight gain
    } else if (goal === 'Weight loss') {
      // Default to 10-15% deficit if no specific deficit is selected
      const currentDeficit = mergedProfile.deficit_level || '10-15%'
      deficitLevel = currentDeficit

      if (currentDeficit === '10-15%') {
        caloriesMin = tdee * 0.85
        caloriesMax = tdee * 0.9
      } else if (currentDeficit === '20-25%') {
        caloriesMin = tdee * 0.75
        caloriesMax = tdee * 0.8
      } else if (currentDeficit === '25-30%') {
        caloriesMin = tdee * 0.7
        caloriesMax = tdee * 0.75
      } else {
        // Fallback to 10-15%
        caloriesMin = tdee * 0.85
        caloriesMax = tdee * 0.9
      }
    } else {
      // Unknown goal, default to maintenance
      caloriesMin = tdee * 0.97
      caloriesMax = tdee * 1.03
    }

    // Check if values match saved profile
    const matchesSaved =
      goal === activeProfile.calorie_goal &&
      Math.abs(caloriesMin - (activeProfile.calories_min || 0)) < 1 &&
      Math.abs(caloriesMax - (activeProfile.calories_max || 0)) < 1 &&
      deficitLevel === activeProfile.deficit_level

    setPendingChanges(prev => {
      if (matchesSaved) {
        // Remove these fields from pending changes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { calorie_goal, calories_min, calories_max, deficit_level, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        calorie_goal: goal,
        calories_min: caloriesMin,
        calories_max: caloriesMax,
        deficit_level: deficitLevel,
      }
    })
  }

  const handleDeficitChange = (deficit: string | null) => {
    if (!activeProfile?.tdee) {
      setPendingChanges(prev => {
        if (deficit === activeProfile?.deficit_level) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { deficit_level, ...rest } = prev
          return rest
        }
        return { ...prev, deficit_level: deficit }
      })
      return
    }

    // If a deficit is selected (not null), automatically set goal to Weight loss
    if (deficit && deficit !== '') {
      const tdee = activeProfile.tdee
      let caloriesMin: number
      let caloriesMax: number

      if (deficit === '10-15%') {
        caloriesMin = tdee * 0.85
        caloriesMax = tdee * 0.9
      } else if (deficit === '20-25%') {
        caloriesMin = tdee * 0.75
        caloriesMax = tdee * 0.8
      } else if (deficit === '25-30%') {
        caloriesMin = tdee * 0.7
        caloriesMax = tdee * 0.75
      } else {
        // Fallback to 10-15%
        caloriesMin = tdee * 0.85
        caloriesMax = tdee * 0.9
      }

      // Check if values match saved profile
      const matchesSaved =
        'Weight loss' === activeProfile.calorie_goal &&
        deficit === activeProfile.deficit_level &&
        Math.abs(caloriesMin - (activeProfile.calories_min || 0)) < 1 &&
        Math.abs(caloriesMax - (activeProfile.calories_max || 0)) < 1

      setPendingChanges(prev => {
        if (matchesSaved) {
          // Remove these fields from pending changes
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { calorie_goal, deficit_level, calories_min, calories_max, ...rest } = prev
          return rest
        }
        return {
          ...prev,
          calorie_goal: 'Weight loss',
          deficit_level: deficit,
          calories_min: caloriesMin,
          calories_max: caloriesMax,
        }
      })
    } else {
      // Just clear deficit level if null/empty
      setPendingChanges(prev => {
        if (deficit === activeProfile.deficit_level) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { deficit_level, ...rest } = prev
          return rest
        }
        return { ...prev, deficit_level: deficit }
      })
    }
  }

  // Handler for WeightTracker - update pending state
  const handleWeightChange = (weight: number) => {
    setPendingChanges(prev => {
      if (weight === activeProfile?.weight_kg) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { weight_kg, ...rest } = prev
        return rest
      }
      return { ...prev, weight_kg: weight }
    })
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {
          fat_min_percent,
          fat_max_percent,
          carb_min_percent,
          carb_max_percent,
          protein_min_percent,
          protein_max_percent,
          ...rest
        } = prev
        return rest
      })
    }
  }

  // Handler for MealSettingsCard - update pending state
  const handleMealChange = (settings: { meals: { name: string; percentage: number }[] }) => {
    if (!activeProfile) return

    // Only add to pending changes if meals actually changed from saved profile
    const currentMeals = activeProfile.meals_config as {
      meals: { name: string; percentage: number }[]
    } | null
    const hasChanged = JSON.stringify(settings.meals) !== JSON.stringify(currentMeals?.meals || [])

    if (hasChanged) {
      setPendingChanges(prev => ({ ...prev, meals_config: settings }))
    } else {
      // Remove meals_config from pending changes if it matches saved values
      setPendingChanges(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { meals_config, ...rest } = prev
        return rest
      })
    }
  }

  // Handler for TDEE changes (manual TDEE entry) - update pending state
  const handleTDEEChange = (data: {
    tdee: number
    bodyFat?: number
    baseline_bmr?: number
    weight_kg?: number
    tdee_source: string
    tdee_calculated_at: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot: any
    calorie_goal: string
    calories_min: number
    calories_max: number
    accumulated_at: number
  }) => {
    setPendingChanges(prev => ({
      ...prev,
      tdee: data.tdee,
      body_fat_percentage: data.bodyFat,
      baseline_bmr: data.baseline_bmr,
      weight_kg: data.weight_kg,
      tdee_source: data.tdee_source,
      tdee_calculated_at: data.tdee_calculated_at,
      tdee_calculation_snapshot: data.tdee_calculation_snapshot,
      calorie_goal: data.calorie_goal,
      calories_min: data.calories_min,
      calories_max: data.calories_max,
      accumulated_at: data.accumulated_at,
    }))
  }

  // Handler for MacroModesCard - update pending state with all macro mode changes
  const handleMacroModeApply = (macros: {
    fatMin: number
    fatMax: number
    carbMin: number
    carbMax: number
    proteinMin: number
    proteinMax: number
    caloriesMin: number
    caloriesMax: number
    calorieGoal: string
    deficitLevel: string | null
  }) => {
    setPendingChanges(prev => ({
      ...prev,
      fat_min_percent: macros.fatMin,
      fat_max_percent: macros.fatMax,
      carb_min_percent: macros.carbMin,
      carb_max_percent: macros.carbMax,
      protein_min_percent: macros.proteinMin,
      protein_max_percent: macros.proteinMax,
      calories_min: macros.caloriesMin,
      calories_max: macros.caloriesMax,
      calorie_goal: macros.calorieGoal,
      deficit_level: macros.deficitLevel,
    }))
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
      if (
        pendingChanges.weight_kg !== undefined &&
        pendingChanges.weight_kg !== activeProfile.weight_kg
      ) {
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

    // Clear pending changes BEFORE creating new profile to avoid race condition
    setPendingChanges({})

    try {
      // Copy basic info from FIRST profile if it exists (for profile cards after the first one)
      // This ensures new cards skip the basic info form if user has already filled it once
      const firstProfile = allProfiles.length > 0 ? allProfiles[0] : null
      const basicInfoData =
        firstProfile && nextNumber > 0
          ? {
              birth_date: firstProfile.birth_date,
              gender: firstProfile.gender,
              height_cm: firstProfile.height_cm,
              initial_weight_kg: firstProfile.initial_weight_kg,
            }
          : {}

      await createProfile.mutateAsync({
        profile_name: profileName,
        ...basicInfoData,
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

            {/* SCENARIO 2: Has basic info but no TDEE - Show TDEE options (and basic info ONLY for first profile) */}
            {hasBasicInfo && !hasTDEE && displayProfile && (
              <>
                {/* Only show BasicInfoFields at the top for the FIRST profile card */}
                {allProfiles.length === 1 && (
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
                )}
                <TDEEOptions
                  profileId={displayProfile.id}
                  initialWeight={displayProfile.initial_weight_kg}
                  height={displayProfile.height_cm}
                  birthDate={displayProfile.birth_date}
                  gender={displayProfile.gender}
                  tdee={displayProfile.tdee}
                  bodyFatPercentage={displayProfile.body_fat_percentage}
                  onTDEEChange={handleTDEEChange}
                  onManualTDEESuccess={handleManualTDEESuccess}
                  onBeforeNavigate={async () => {
                    if (activeProfile) {
                      await handleSaveProfile(activeProfile.id)
                    }
                  }}
                />

                {/* For profiles after the first, show BasicInfoFields in Advanced Settings */}
                {allProfiles.length > 1 && activeProfile && (
                  <AdvancedSettingsSection
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
                    profile={activeProfile}
                  />
                )}
              </>
            )}

            {/* SCENARIO 3: Has basic info AND TDEE - Show full profile */}
            {hasBasicInfo && hasTDEE && displayProfile && activeProfile && mergedProfile && (
              <>
                <BasicProfileForm
                  profile={mergedProfile}
                  onBodyFatChange={handleBodyFatChange}
                  onGoalChange={handleGoalChange}
                  onDeficitChange={handleDeficitChange}
                />

                {/* Weight Tracking - Use mergedProfile to show pending changes */}
                <WeightTracker profile={mergedProfile} onWeightChange={handleWeightChange} />

                {/* AT History - Show metabolic adaptation over time */}
                <ATHistoryCard
                  profileId={activeProfile.id}
                  baselineBMR={mergedProfile.baseline_bmr}
                  currentAccumulatedAT={mergedProfile.accumulated_at}
                />

                {/* Macro Distribution Settings */}
                <MacroDistributionCard
                  caloriesMin={mergedProfile.calories_min || mergedProfile.tdee || 0}
                  caloriesMax={mergedProfile.calories_max || mergedProfile.tdee || 0}
                  fatMinPercent={mergedProfile.fat_min_percent}
                  fatMaxPercent={mergedProfile.fat_max_percent}
                  carbMinPercent={mergedProfile.carb_min_percent}
                  carbMaxPercent={mergedProfile.carb_max_percent}
                  proteinMinPercent={mergedProfile.protein_min_percent}
                  proteinMaxPercent={mergedProfile.protein_max_percent}
                  onMacroChange={handleMacroChange}
                />

                {/* Meal Settings */}
                <MealSettingsCard tdee={activeProfile.tdee || 0} onMealChange={handleMealChange} />

                {/* Macro Modes Card */}
                <MacroModesCard profile={mergedProfile} onMacroModeApply={handleMacroModeApply} />

                {/* Advanced Settings - Collapsible section */}
                <AdvancedSettingsSection
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
                  profile={activeProfile}
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
          <div className="md:sticky md:top-20 md:self-start space-y-4">
            <ProfileCardSidebar
              onCreateNew={handleCreateNewProfile}
              onSelectProfile={handleSelectProfile}
              onSaveProfile={handleSaveProfile}
              onDeleteProfile={handleDeleteProfile}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={updateProfile.isPending}
              canSave={hasBasicInfo}
            />

            {/* Results Summary - Show BMR, TDEE, Calorie Range */}
            <ProfileResultsSummary profile={mergedProfile} />

            {/* Metabolic Info - Show Baseline BMR, AT, Effective BMR */}
            <MetabolicInfo profile={mergedProfile} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
