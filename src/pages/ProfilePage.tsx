/**
 * ProfilePage - En profil per användare
 * Conditional rendering baserat på grundläggande information och TDEE-status
 */

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User, Save } from 'lucide-react'
import { useProfiles, useUpdateProfile, useCreateWeightHistory } from '@/hooks'
import { Button } from '@/components/ui/button'
import { useSyncMealSettings } from '@/hooks/useMealSettings'
import { useTodayLog, useSyncTodayLogFromProfile } from '@/hooks/useDailyLogs'
import { useProfileStore } from '@/stores/profileStore'
import type { Gender, Profile } from '@/lib/types'
import { toast } from 'sonner'

// Profile components
import ProfileResultsSummary from '@/components/profile/ProfileResultsSummary'
import MaxFatMetabolismCard from '@/components/profile/MaxFatMetabolismCard'
import BasicInfoFields from '@/components/profile/BasicInfoFields'
import TDEEOptions from '@/components/profile/TDEEOptions'
import BasicProfileForm from '@/components/profile/BasicProfileForm'
import WeightTracker from '@/components/profile/WeightTracker'
import MetabolicCalibration from '@/components/profile/MetabolicCalibration'

// Existing components (keep for now)
import MacroDistributionCard from '@/components/MacroDistributionCard'
import MealSettingsCard from '@/components/MealSettingsCard'
import MacroModesCard from '@/components/MacroModesCard'
import MacroConverterCard from '@/components/profile/MacroConverterCard'

export default function ProfilePage() {
  // Load profiles
  const { data: allProfiles = [] } = useProfiles()

  // Get active profile from store
  const activeProfileFromStore = useProfileStore(state => state.activeProfile)

  // Get FULL active profile from React Query
  const activeProfile = allProfiles.find(p => p.id === activeProfileFromStore?.id)

  // Hooks for profile operations
  const updateProfile = useUpdateProfile()
  const createWeightHistory = useCreateWeightHistory()
  const syncMealSettings = useSyncMealSettings()

  // Hooks for auto-syncing today's log
  const { data: todayLog } = useTodayLog()
  const syncFromProfile = useSyncTodayLogFromProfile()

  // NOTE: macroRanges and mealSettings previously used for local state
  // Now handled via pendingChanges state

  // Local state for pending changes (not saved until disk icon clicked)
  const [pendingChanges, setPendingChanges] = useState<{
    // Basic info
    birth_date?: string
    gender?: Gender | ''
    height_cm?: number
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
  // Height must be >= 100 to prevent scenario switch while user is still typing (e.g. "1" of "183")
  // Weight must also be filled before TDEE options appear
  const hasBasicInfo = !!(
    displayProfile?.birth_date &&
    displayProfile?.gender &&
    displayProfile?.height_cm &&
    displayProfile.height_cm >= 100 &&
    displayProfile?.weight_kg
  )

  // Check if TDEE exists (using display profile to include pending changes)
  const hasTDEE = !!displayProfile?.tdee

  // Fields should be locked as soon as basic info is complete
  // Fields lock when basic info is complete
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
        const updated = { ...prev }
        delete updated.fat_min_percent
        delete updated.fat_max_percent
        delete updated.carb_min_percent
        delete updated.carb_max_percent
        delete updated.protein_min_percent
        delete updated.protein_max_percent
        return updated
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

  // Handler for profile save - save pending changes
  const handleSaveProfile = async (_profileId: string) => {
    if (!activeProfile || Object.keys(pendingChanges).length === 0) return

    // Check if basic info is complete (using display profile with pending changes)
    const isBasicInfoComplete = !!(
      displayProfile?.birth_date &&
      displayProfile?.gender &&
      displayProfile?.height_cm &&
      displayProfile?.weight_kg
    )

    if (!isBasicInfoComplete) {
      toast.error('Fyll i all grundläggande information innan du sparar', {
        description: 'Födelsedatum, kön, längd och vikt krävs',
      })
      return
    }

    try {
      // If weight is being set and initial_weight_kg is not yet set, also set it as starting weight
      const dataToSave = { ...pendingChanges }
      if (dataToSave.weight_kg !== undefined && !activeProfile.initial_weight_kg) {
        dataToSave.initial_weight_kg = dataToSave.weight_kg
      }

      // Save profile changes
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        data: dataToSave,
      })

      // If weight was changed, add to weight history (user-based, shared across profiles)
      if (dataToSave.weight_kg !== undefined && dataToSave.weight_kg !== activeProfile.weight_kg) {
        await createWeightHistory.mutateAsync({
          weight_kg: dataToSave.weight_kg,
        })
      }

      // If meals_config was changed, sync to user_meal_settings table
      // This ensures TodayPage (which reads from user_meal_settings) stays in sync
      if (pendingChanges.meals_config?.meals) {
        await syncMealSettings.mutateAsync({
          profileId: activeProfile.id,
          meals: pendingChanges.meals_config.meals,
        })
      }

      // Auto-sync today's log if calorie or macro goals were changed
      const goalsChanged =
        pendingChanges.calories_min !== undefined ||
        pendingChanges.calories_max !== undefined ||
        pendingChanges.fat_min_percent !== undefined ||
        pendingChanges.fat_max_percent !== undefined ||
        pendingChanges.carb_min_percent !== undefined ||
        pendingChanges.carb_max_percent !== undefined ||
        pendingChanges.protein_min_percent !== undefined ||
        pendingChanges.protein_max_percent !== undefined

      if (goalsChanged && todayLog) {
        try {
          await syncFromProfile.mutateAsync(todayLog.id)
          setPendingChanges({}) // Clear pending changes after successful save
          toast.success('Profil sparad! Dagens mål har uppdaterats automatiskt.', {
            duration: 4000,
          })
        } catch (error) {
          console.error('Error syncing today log:', error)
          setPendingChanges({}) // Clear pending changes even if sync fails
          toast.success('Profil sparad', {
            description: 'Obs: Kunde inte uppdatera dagens mål. Försök synkronisera manuellt.',
            duration: 5000,
          })
        }
      } else {
        setPendingChanges({}) // Clear pending changes after successful save
        toast.success('Ändringar sparade')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Kunde inte spara ändringar')
    }
  }

  // Handler for manual TDEE success
  const handleManualTDEESuccess = () => {
    toast.success('TDEE har sparats! Du kan nu använda resten av appen.')
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
          <User className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
          Min Profil
        </h1>
        <p className="text-sm md:text-base text-neutral-600">
          Hantera din profil och personliga inställningar.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content column - Conditional rendering */}
          <div className="space-y-4">
            {/* SCENARIO 1: No basic info - Only show BasicInfoFields */}
            {!hasBasicInfo && displayProfile && (
              <BasicInfoFields
                birthDate={displayProfile.birth_date}
                gender={displayProfile.gender}
                height={displayProfile.height_cm}
                weight={displayProfile.weight_kg}
                onBirthDateChange={handleBirthDateChange}
                onGenderChange={handleGenderChange}
                onHeightChange={handleHeightChange}
                onWeightChange={handleWeightChange}
                locked={false}
                showLockNotice={false}
              />
            )}

            {/* SCENARIO 2: Has basic info but no TDEE - Show BasicInfoFields + TDEE options */}
            {hasBasicInfo && !hasTDEE && displayProfile && (
              <>
                <BasicInfoFields
                  birthDate={displayProfile.birth_date}
                  gender={displayProfile.gender}
                  height={displayProfile.height_cm}
                  weight={displayProfile.weight_kg}
                  onBirthDateChange={handleBirthDateChange}
                  onGenderChange={handleGenderChange}
                  onHeightChange={handleHeightChange}
                  onWeightChange={handleWeightChange}
                  locked={fieldsAreLocked}
                  showLockNotice={fieldsAreLocked}
                />
                <TDEEOptions
                  profileId={displayProfile.id}
                  initialWeight={displayProfile.weight_kg ?? displayProfile.initial_weight_kg}
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

                {/* Metabolic Calibration - Manual TDEE calibration based on weight changes */}
                {activeProfile && activeProfile.tdee && (
                  <MetabolicCalibration profile={mergedProfile} />
                )}

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

                {/* Omvandling av makrovärden */}
                <MacroConverterCard profile={mergedProfile} />

                {/* Grundläggande information - Collapsible section */}
                <BasicInfoFields
                  birthDate={displayProfile.birth_date}
                  gender={displayProfile.gender}
                  height={displayProfile.height_cm}
                  onBirthDateChange={handleBirthDateChange}
                  onGenderChange={handleGenderChange}
                  onHeightChange={handleHeightChange}
                  locked={fieldsAreLocked}
                  showLockNotice={fieldsAreLocked}
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

          {/* Sidebar */}
          <div className="order-first lg:order-none lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Save button */}
            {hasBasicInfo && (
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <Button
                  onClick={() => activeProfile && handleSaveProfile(activeProfile.id)}
                  disabled={!hasUnsavedChanges || updateProfile.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? 'Sparar...' : 'Spara ändringar'}
                </Button>
              </div>
            )}

            {/* Results Summary - Show BMR, TDEE, Calorie Range */}
            <ProfileResultsSummary profile={mergedProfile} />

            {/* Maximal fettmetabolism - Show max fat metabolism */}
            <MaxFatMetabolismCard profile={mergedProfile} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
