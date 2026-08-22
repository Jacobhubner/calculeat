/**
 * ProfilePage - En profil per användare
 * Conditional rendering baserat på grundläggande information och TDEE-status
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  hasScrollSettled,
  canScrollToSection,
  MAX_SCROLL_FRAMES,
  REQUIRED_SETTLED_FRAMES,
} from '@/lib/utils/deepLinkScroll'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { User, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfiles, useUpdateProfile, useCreateWeightHistory } from '@/hooks'
import { PreviewBlockedError } from '@/hooks/usePreviewMutation'
import { Button } from '@/components/ui/button'
import { useSyncMealSettings } from '@/hooks/useMealSettings'
import { useTodayLog, useSyncTodayLogFromProfile } from '@/hooks/useDailyLogs'
import { useProfileStore } from '@/stores/profileStore'
import type { Gender, Profile, ProfileFormData } from '@/lib/types'
import { toast } from 'sonner'

// Profile components
import ProfileResultsSummary from '@/components/profile/ProfileResultsSummary'
import MaxFatMetabolismCard from '@/components/profile/MaxFatMetabolismCard'
import TDEEOptions from '@/components/profile/TDEEOptions'
import { mifflinStJeor } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'
import BasicProfileForm from '@/components/profile/BasicProfileForm'
import WeightTracker from '@/components/profile/WeightTracker'
import SetupProfileForm from '@/components/profile/SetupProfileForm'

// Existing components (keep for now)
import MacroDistributionCard from '@/components/MacroDistributionCard'
import MealSettingsCard from '@/components/MealSettingsCard'
import MacroModesCard from '@/components/MacroModesCard'
import { PhaseConflictDialog } from '@/components/dashboard/PhaseConflictDialog'
import { useActiveDietPhase, useEndDietPhase } from '@/hooks/useDietPhases'
import { goalConflictsWithPhase } from '@/lib/calculations/dietPhases'
import MacroConverterCard from '@/components/profile/MacroConverterCard'
import { freeMacrosForGoal } from '@/lib/utils/macroModes'

// Beräknar kaloriintervall för ett mål (ren funktion — delas av handleGoalChange
// och handleTDEEChange så att målet från onboarding respekteras vid TDEE-beräkning).
function caloriesForGoal(
  tdee: number,
  goal: string,
  deficitLevel?: string | null
): { caloriesMin: number; caloriesMax: number; deficitLevel: string | null } {
  if (goal === 'Weight gain') {
    return { caloriesMin: tdee * 1.1, caloriesMax: tdee * 1.2, deficitLevel: null }
  }
  if (goal === 'Weight loss') {
    const d = deficitLevel || '10-15%'
    if (d === '20-25%')
      return { caloriesMin: tdee * 0.75, caloriesMax: tdee * 0.8, deficitLevel: d }
    if (d === '25-30%')
      return { caloriesMin: tdee * 0.7, caloriesMax: tdee * 0.75, deficitLevel: d }
    // 10-15% (standard) + fallback
    return { caloriesMin: tdee * 0.85, caloriesMax: tdee * 0.9, deficitLevel: '10-15%' }
  }
  // Maintain weight (och okänt mål)
  return { caloriesMin: tdee * 0.97, caloriesMax: tdee * 1.03, deficitLevel: null }
}

export default function ProfilePage() {
  const { t } = useTranslation('profile')
  const navigate = useNavigate()
  // Öppna manuell TDEE-inmatning direkt när användaren valde "Ange manuellt"
  // i det hopslagna setup-steget.
  const [openManualEntry, setOpenManualEntry] = useState(false)
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
    // Body composition — null = användaren har tömt fältet
    body_fat_percentage?: number | null
    body_composition_method?: string | null
    weight_kg?: number
    // TDEE
    tdee?: number
    bmr?: number
    tdee_source?: string
    tdee_calculated_at?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot?: any
    baseline_bmr?: number
    bmr_formula?: string | null
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
    // Starting weight (set when weight_kg is first provided)
    initial_weight_kg?: number
    // Display preferences
    show_energy_density?: boolean
  }>({})

  const { data: activePhase } = useActiveDietPhase()
  const endPhase = useEndDietPhase()
  const [conflictOpen, setConflictOpen] = useState(false)

  // Presentation-only save state — pendingChanges is source-of-truth
  type SaveState = 'pristine' | 'dirty' | 'saving' | 'saved' | 'error'
  const [saveState, setSaveState] = useState<SaveState>('pristine')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const weightSectionRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  /**
   * Djuplänk till viktspårningen (?weight=open).
   *
   * Beredskapskortet i Översikt uppmanar till en vägning; utan den här
   * länken fick användaren själv leta reda på sektionen på en lång
   * profilsida. WeightTracker är hopfälld som förval, så länken måste
   * både öppna sektionen och scrolla dit; den globala ScrollToTop hoppas
   * över via DEEP_LINK_PARAMS.
   */
  // Avsikten bärs av en ref, inte av URL:en. Städningen av parametern
  // startar om effekten, och en cleanup hann då avbryta scrollen innan
  // första ramen kört — samma fälla som deepLinkScroll.ts beskriver.
  const shouldScrollToWeight = useRef(false)
  const [openWeightForm, setOpenWeightForm] = useState(false)

  useEffect(() => {
    if (searchParams.get('weight') !== 'open') return
    shouldScrollToWeight.current = true
    setOpenWeightForm(true)
    const next = new URLSearchParams(searchParams)
    next.delete('weight')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    /**
     * Vänta tills sektionen FAKTISKT är öppen.
     *
     * Effekten kördes förut på [activeProfile?.id] — ett värde som ofta
     * inte ändras alls. Stod användaren redan på profilsidan, eller var
     * profilen färdigladdad när klicket kom, sattes refen men effekten
     * kördes aldrig. Därav "ibland korrekt": utfallet berodde på om
     * profil-id råkade bli klart efter avsikten registrerats.
     *
     * openWeightForm är tillståndet effekten ovan själv sätter, så den här
     * körs alltid när avsikten registrerats — samma mönster som
     * kalibreringens djuplänk, som fungerar.
     */
    if (
      !canScrollToSection({
        intentRegistered: shouldScrollToWeight.current,
        sectionExpanded: openWeightForm,
      })
    ) {
      return
    }

    shouldScrollToWeight.current = false

    /**
     * Sikta om tills positionen står still.
     *
     * En enda scrollIntoView landade fel: profilsidan växer medan den
     * laddas, och App.tsx har dessutom en global ScrollToTop. Samma
     * lösning som kalibreringens djuplänk använder.
     */
    let frames = 0
    let lastTop = -1
    let raf = 0
    // Räknare för stilla ramar i RAD — en ensam räcker inte, se
    // REQUIRED_SETTLED_FRAMES i deepLinkScroll.ts.
    let settledStreak = 0

    const aim = () => {
      const el = weightSectionRef.current
      if (!el) {
        raf = requestAnimationFrame(aim)
        return
      }
      const top = el.getBoundingClientRect().top
      el.scrollIntoView({ behavior: 'auto', block: 'start' })
      settledStreak = hasScrollSettled(lastTop, top) ? settledStreak + 1 : 0
      lastTop = top
      frames++
      if (settledStreak < REQUIRED_SETTLED_FRAMES && frames < MAX_SCROLL_FRAMES) {
        raf = requestAnimationFrame(aim)
      }
    }

    raf = requestAnimationFrame(aim)
    return () => cancelAnimationFrame(raf)
    // Kör när sektionen öppnas — INTE på searchParams. Den listan var det
    // som avbröt loopen: parametern städas bort i effekten ovan, vilket
    // triggade en omkörning vars cleanup dödade animationen direkt.
  }, [openWeightForm])

  // Derive saveState from pendingChanges.
  // setSaveState here is intentional: saveState is presentation-only state derived
  // from pendingChanges (the source-of-truth), not an external system sync.

  useEffect(() => {
    const hasPending = Object.keys(pendingChanges).length > 0
    if (hasPending) {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
        savedTimerRef.current = null
      }

      setSaveState(prev => (prev === 'saving' ? prev : 'dirty'))
    } else {
      setSaveState(prev =>
        prev === 'saving' || prev === 'saved' || prev === 'error' ? prev : 'pristine'
      )
    }
  }, [pendingChanges])

  // Auto-dismiss saved state after 2500ms, clear timer on state change or unmount
  useEffect(() => {
    if (saveState === 'saved') {
      savedTimerRef.current = setTimeout(() => {
        setSaveState('pristine')
        savedTimerRef.current = null
      }, 2500)
    }
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current)
        savedTimerRef.current = null
      }
    }
  }, [saveState])

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

  // Handlers for BasicProfileForm - update pending state
  const handleBodyFatChange = (bodyFat: number | undefined) => {
    setPendingChanges(prev => {
      if (bodyFat === activeProfile?.body_fat_percentage) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { body_fat_percentage, ...rest } = prev
        return rest
      }
      // NULL, inte undefined, när fältet töms: useUpdateProfile strippar
      // undefined så att en utelämnad nyckel inte skriver över befintligt
      // värde. Med undefined försvann alltså raderingen tyst och det gamla
      // värdet låg kvar efter "Spara".
      // Metoden nollställs samtidigt — en beräkningsmetod utan resultat
      // pekar på ett värde som inte längre finns.
      return {
        ...prev,
        body_fat_percentage: bodyFat ?? null,
        ...(bodyFat === undefined ? { body_composition_method: null } : {}),
      }
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
      const currentDeficit = mergedProfile?.deficit_level || '10-15%'
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

  const handleColorBalanceChange = (enabled: boolean) => {
    setPendingChanges(prev => {
      if (enabled === (activeProfile?.show_energy_density ?? false)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { show_energy_density, ...rest } = prev
        return rest
      }
      return { ...prev, show_energy_density: enabled }
    })
  }

  // Handler for WeightTracker - update pending state
  const handleWeightChange = (weight: number) => {
    // Spara profilvikten direkt när vikt loggas via WeightTracker
    if (activeProfile && weight !== activeProfile.weight_kg) {
      updateProfile.mutate({
        profileId: activeProfile.id,
        data: { weight_kg: weight } as Partial<ProfileFormData>,
      })
    }
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

  // Handler for SetupProfileForm — sparar direkt (inte pending) vid första inloggning
  const handleSetupSave = async (
    data: {
      birth_date: string
      gender: Gender
      height_cm: number
      weight_kg: number
    },
    method: 'calculate' | 'manual'
  ) => {
    if (!activeProfile) return

    const isNetworkError = (error: unknown) =>
      error instanceof TypeError && /fetch/i.test(error.message)

    const attemptSave = async () => {
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        data: {
          birth_date: data.birth_date,
          gender: data.gender,
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          initial_weight_kg: data.weight_kg,
          // calorie_goal, deficit_level och show_energy_density sätts INTE
          // här längre — de härleds från periodvalet efter att TDEE finns
          // (se applyPhaseSideEffects i useDietPhases). Att gissa dem innan
          // användaren angett riktning gav ett mål som inte matchade avsikten.
        },
      })
      await createWeightHistory.mutateAsync({ weight_kg: data.weight_kg })
    }

    // Efter lyckad sparning: gå vidare enligt vald metod. 'calculate' navigerar
    // till TDEE-kalkylatorn; 'manual' visar Scenario 2 med manuell inmatning öppen.
    const proceed = () => {
      if (method === 'calculate') {
        navigate('/app/tools/tdee-calculator')
      } else {
        setOpenManualEntry(true)
      }
    }

    try {
      await attemptSave()
      toast.success(t('toast.basicInfoSaved'))
      proceed()
    } catch (error) {
      if (error instanceof PreviewBlockedError) return

      // Nätverksglapp (t.ex. dålig mobiluppkoppling) är ofta övergående — ett
      // automatiskt återförsök löser problemet utan att användaren behöver göra något.
      if (isNetworkError(error)) {
        try {
          await attemptSave()
          toast.success(t('toast.basicInfoSaved'))
          proceed()
          return
        } catch (retryError) {
          if (retryError instanceof PreviewBlockedError) return
          console.error('Error saving setup info (after retry):', retryError)
        }
      } else {
        console.error('Error saving setup info:', error)
      }

      toast.error(t('toast.basicInfoSaveError'), {
        description: isNetworkError(error) ? t('toast.basicInfoSaveErrorNetwork') : undefined,
        action: {
          label: t('save.retryError'),
          onClick: () => {
            void handleSetupSave(data, method)
          },
        },
      })
    }
  }

  // Handler for TDEE changes (manual TDEE entry) - update pending state
  const handleTDEEChange = (data: {
    tdee: number
    bodyFat?: number
    bmr?: number
    baseline_bmr?: number
    weight_kg?: number
    tdee_source: string
    tdee_calculated_at: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tdee_calculation_snapshot: any
    calorie_goal: string
    calories_min: number
    calories_max: number
    accumulated_at?: number
  }) => {
    if (
      data.tdee_source === 'manual' &&
      activeProfile?.tdee &&
      !window.confirm(
        'Du har redan ett TDEE-värde sparat. Vill du skriva över det med det nya värdet?'
      )
    ) {
      return
    }

    // Respektera målet som redan valts (t.ex. i onboarding-uppsättningen) —
    // TDEE-verktygen skickar alltid 'Maintain weight' som default, vilket annars
    // skrev över användarens val. Finns ett mål redan: behåll det och räkna om
    // kaloriintervallet för det målet + befintligt deficit_level.
    const existingGoal = activeProfile?.calorie_goal
    const goalOverride =
      existingGoal && existingGoal !== data.calorie_goal
        ? (() => {
            const c = caloriesForGoal(data.tdee, existingGoal, activeProfile?.deficit_level)
            // Sätt makrofördelning för målets gratis-läge så kostläget matchar.
            // Premium-läge (viktuppgång/offseason) → null, inga makron tvingas på.
            const m = freeMacrosForGoal(existingGoal, {
              weight: data.weight_kg ?? activeProfile?.weight_kg ?? 0,
              caloriesMin: c.caloriesMin,
              caloriesMax: c.caloriesMax,
            })
            return {
              calorie_goal: existingGoal,
              calories_min: c.caloriesMin,
              calories_max: c.caloriesMax,
              deficit_level: c.deficitLevel,
              ...(m
                ? {
                    fat_min_percent: m.fatMinPercent,
                    fat_max_percent: m.fatMaxPercent,
                    carb_min_percent: m.carbMinPercent,
                    carb_max_percent: m.carbMaxPercent,
                    protein_min_percent: m.proteinMinPercent,
                    protein_max_percent: m.proteinMaxPercent,
                  }
                : {}),
            }
          })()
        : null

    setPendingChanges(prev => ({
      ...prev,
      tdee: data.tdee,
      // Only overwrite body_fat_percentage if the user explicitly provided a value.
      // Omitting the field preserves the existing profile value.
      ...(data.bodyFat !== undefined && { body_fat_percentage: data.bodyFat }),
      // Manuellt TDEE har ingen bakomliggande beräkning — nollställ ALLA
      // fält som hör till formelvägen, inte bara bmr_formula.
      //
      // Varför: ett kvarlämnat activity_level + pal_system får
      // useCalculations att räkna om TDEE ur formeln trots att användaren
      // angett värdet själv. I ett verkligt fall låg "Sedentary" kvar på en
      // profil med manuellt TDEE 3190, vilket motsvarar BMR × 1,2 = 2315 —
      // 875 kcal fel. Resultatet skrivs inte till profilen i dag, men fälten
      // ska ändå spegla att ingen formel används.
      ...(data.tdee_source === 'manual' && {
        bmr_formula: null,
        activity_level: null,
        pal_system: null,
        intensity_level: null,
        custom_pal: null,
      }),
      // Uppskattad Mifflin-BMR från ManualTDEEEntry (märkt i snapshot)
      ...(data.bmr !== undefined && { bmr: data.bmr }),
      baseline_bmr: data.baseline_bmr,
      weight_kg: data.weight_kg,
      tdee_source: data.tdee_source,
      tdee_calculated_at: data.tdee_calculated_at,
      tdee_calculation_snapshot: data.tdee_calculation_snapshot,
      calorie_goal: data.calorie_goal,
      calories_min: data.calories_min,
      calories_max: data.calories_max,
      accumulated_at: data.accumulated_at,
      // Skriv efter spread så målet + omräknade kalorier vinner över TDEE-defaults.
      ...(goalOverride ?? {}),
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
      toast.error(t('toast.incompleteBasicInfo'), {
        description: t('toast.incompleteBasicInfoDesc'),
      })
      return
    }

    // Makrofördelningens mittpunkter måste summera till exakt 100 %
    // (samma beräkning som MacroDistributionCard visar)
    const fatMid =
      ((displayProfile?.fat_min_percent ?? 25) + (displayProfile?.fat_max_percent ?? 40)) / 2
    const carbMid =
      ((displayProfile?.carb_min_percent ?? 45) + (displayProfile?.carb_max_percent ?? 60)) / 2
    const proteinMid =
      ((displayProfile?.protein_min_percent ?? 10) + (displayProfile?.protein_max_percent ?? 20)) /
      2
    const macroTotal = Math.round(fatMid + carbMid + proteinMid)
    if (macroTotal !== 100) {
      toast.error(t('toast.macroSumInvalid', { total: macroTotal }))
      return
    }

    // Måltidsfördelningen måste summera till exakt 100 %
    const meals = displayProfile?.meals_config?.meals
    if (meals && meals.length > 0) {
      const mealTotal = meals.reduce((sum, m) => sum + (m.percentage || 0), 0)
      if (mealTotal !== 100) {
        toast.error(t('toast.mealSumInvalid', { total: mealTotal }))
        return
      }
    }

    // Overwrite confirmation when manually setting TDEE over an existing value
    if (
      pendingChanges.tdee_source === 'manual' &&
      activeProfile.tdee &&
      !window.confirm(
        'Du har redan ett TDEE-värde sparat. Vill du skriva över det med det nya värdet?'
      )
    ) {
      return
    }

    // Sist av kontrollerna: krockar det nya målet med en pågående period?
    // Fråga i stället för att låta de två divergera tyst — triggern speglar
    // bara diet_phases → profiles, aldrig tvärtom. Ligger efter validering
    // så att frågan inte ställs för ett formulär som ändå inte kan sparas.
    if (goalConflictsWithPhase(pendingChanges.calorie_goal, activePhase)) {
      setConflictOpen(true)
      return
    }

    await persistProfile()
  }

  /** Själva sparningen — anropas direkt eller efter att en periodkrock bekräftats. */
  const persistProfile = async () => {
    if (!activeProfile) return
    try {
      setSaveState('saving')

      // If weight is being set and initial_weight_kg is not yet set, also set it as starting weight
      const dataToSave = { ...pendingChanges }
      if (dataToSave.weight_kg !== undefined && !activeProfile.initial_weight_kg) {
        dataToSave.initial_weight_kg = dataToSave.weight_kg
      }

      // Save profile changes
      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        data: dataToSave as Partial<ProfileFormData>,
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
          setPendingChanges({})
          setSaveState('saved')
        } catch (error) {
          console.error('Error syncing today log:', error)
          setPendingChanges({})
          setSaveState('saved')
          toast.success(t('toast.changesSaved'), {
            description: t('toast.profileSavedSyncFailed'),
            duration: 5000,
          })
        }
      } else {
        setPendingChanges({})
        setSaveState('saved')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveState('error')
      toast.error(t('toast.changesSaveError'))
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
          <User className="h-6 w-6 md:h-8 md:w-8 text-primary-600 dark:text-primary-300" />
          {t('header.title')}
        </h1>
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400">
          {t('header.description')}
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] min-w-0 overflow-x-clip">
          {/* Main content column - Conditional rendering */}
          <div className="space-y-6 min-w-0 overflow-hidden">
            {/* SCENARIO 1: No basic info - inline setup form */}
            {!hasBasicInfo && displayProfile && (
              <SetupProfileForm onSave={handleSetupSave} isSaving={updateProfile.isPending} />
            )}

            {/* SCENARIO 2: Has basic info but no TDEE - Show TDEE options only */}
            {hasBasicInfo && !hasTDEE && displayProfile && (
              <TDEEOptions
                initialWeight={displayProfile.weight_kg ?? activeProfile?.initial_weight_kg}
                height={displayProfile.height_cm}
                birthDate={displayProfile.birth_date}
                gender={displayProfile.gender}
                tdee={displayProfile.tdee}
                bodyFatPercentage={displayProfile.body_fat_percentage ?? undefined}
                onTDEEChange={handleTDEEChange}
                manualOnly={openManualEntry}
                onBeforeNavigate={async () => {
                  if (activeProfile) {
                    await handleSaveProfile(activeProfile.id)
                  }
                }}
              />
            )}

            {/* SCENARIO 3: Has basic info AND TDEE - Show full profile */}
            {hasBasicInfo && hasTDEE && displayProfile && activeProfile && mergedProfile && (
              <>
                <BasicProfileForm
                  profile={mergedProfile}
                  onBodyFatChange={handleBodyFatChange}
                  onGoalChange={handleGoalChange}
                  onDeficitChange={handleDeficitChange}
                  onColorBalanceChange={handleColorBalanceChange}
                />

                {/* Weight Tracking - Use mergedProfile to show pending changes */}
                {/* Mål för ?weight=open, så beredskapskortet i Översikt kan
                    länka hit. Utan det landade användaren högst upp på en
                    lång profilsida och fick leta själv. */}
                <div ref={weightSectionRef} className="scroll-mt-24">
                  <WeightTracker
                    profile={mergedProfile}
                    onWeightChange={handleWeightChange}
                    defaultOpenWithForm={openWeightForm}
                  />
                </div>

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
              </>
            )}

            {/* No active profile selected */}
            {!activeProfile && (
              <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                <p>{t('noProfile')}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="order-first lg:order-none lg:sticky lg:top-20 lg:self-start space-y-4 min-w-0 overflow-x-clip">
            {/* Results Summary - Show BMR, TDEE, Calorie Range */}
            <ProfileResultsSummary
              profile={mergedProfile}
              onTDEEEdit={newTdee => {
                // Backfill uppskattad Mifflin-BMR om profilen saknar BMR
                // (så BMR-beroende funktioner som TDEE-scenarier fungerar)
                const p = mergedProfile
                const estimatedBmr =
                  !p?.bmr &&
                  p?.weight_kg &&
                  p?.height_cm &&
                  p?.birth_date &&
                  (p?.gender === 'male' || p?.gender === 'female')
                    ? mifflinStJeor({
                        weight: p.weight_kg,
                        height: p.height_cm,
                        age: calculateAge(p.birth_date),
                        gender: p.gender,
                      })
                    : null

                setPendingChanges(prev => ({
                  ...prev,
                  tdee: newTdee,
                  ...(estimatedBmr ? { bmr: Math.round(estimatedBmr) } : {}),
                  tdee_source: 'manual',
                  tdee_calculated_at: new Date().toISOString(),
                  tdee_calculation_snapshot: {
                    ...activeProfile?.tdee_calculation_snapshot,
                    calculated_tdee: newTdee,
                    note: 'Manuellt angiven TDEE',
                    ...(estimatedBmr
                      ? {
                          estimated_bmr: Math.round(estimatedBmr),
                          estimated_bmr_formula: 'Mifflin-St Jeor equation',
                        }
                      : {}),
                  },
                  calorie_goal: activeProfile?.calorie_goal ?? 'Maintain weight',
                  calories_min: newTdee * 0.97,
                  calories_max: newTdee * 1.03,
                }))
              }}
            />

            {/* Maximal fettmetabolism - Show max fat metabolism */}
            <MaxFatMetabolismCard profile={mergedProfile} />
          </div>
        </div>
      </div>

      {/* Save bar — mobile: fixed bottom above nav | desktop: fixed top-right below header */}
      {hasBasicInfo && saveState !== 'pristine' && (
        <>
          {/* Mobile */}
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-16 inset-x-0 z-40 px-4 pointer-events-auto lg:hidden"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
          >
            <div
              className={cn(
                'rounded-xl border px-4 py-3 flex items-center justify-between shadow-lg',
                saveState === 'dirty' &&
                  'bg-primary-50 border-primary-200 dark:bg-primary-900/25 dark:border-primary-800',
                saveState === 'saving' &&
                  'bg-primary-50 border-primary-200 dark:bg-primary-900/25 dark:border-primary-800',
                saveState === 'saved' &&
                  'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
                saveState === 'error' &&
                  'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-800'
              )}
            >
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {saveState === 'dirty' && t('save.unsavedChanges')}
                {saveState === 'saving' && t('save.saving')}
                {saveState === 'saved' && t('save.saved')}
                {saveState === 'error' && t('save.saveError')}
              </span>
              {(saveState === 'dirty' || saveState === 'error') && (
                <Button
                  size="sm"
                  variant={saveState === 'error' ? 'destructive' : 'primary'}
                  onClick={() => activeProfile && handleSaveProfile(activeProfile.id)}
                >
                  {t('save.saveChanges')}
                </Button>
              )}
            </div>
          </div>

          {/* Desktop — fixed top-right below header */}
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'hidden lg:flex fixed top-20 right-6 z-40 pointer-events-auto items-center gap-3 rounded-xl border px-4 py-3 shadow-lg',
              saveState === 'dirty' &&
                'bg-primary-50 border-primary-200 dark:bg-primary-900/25 dark:border-primary-800',
              saveState === 'saving' &&
                'bg-primary-50 border-primary-200 dark:bg-primary-900/25 dark:border-primary-800',
              saveState === 'saved' &&
                'bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-800',
              saveState === 'error' &&
                'bg-red-50 border-red-200 dark:bg-red-900/25 dark:border-red-800'
            )}
          >
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {saveState === 'dirty' && t('save.unsavedChanges')}
              {saveState === 'saving' && t('save.saving')}
              {saveState === 'saved' && t('save.saved')}
              {saveState === 'error' && t('save.saveError')}
            </span>
            {saveState === 'saving' && (
              <Loader2 className="h-4 w-4 animate-spin text-primary-600 dark:text-primary-300" />
            )}
            {saveState === 'saved' && (
              <Check className="h-4 w-4 text-green-600 dark:text-green-300" />
            )}
            {(saveState === 'dirty' || saveState === 'error') && (
              <Button
                size="sm"
                variant={saveState === 'error' ? 'destructive' : 'primary'}
                onClick={() => activeProfile && handleSaveProfile(activeProfile.id)}
              >
                {t('save.saveChanges')}
              </Button>
            )}
          </div>
        </>
      )}

      {activePhase && (
        <PhaseConflictDialog
          open={conflictOpen}
          onOpenChange={setConflictOpen}
          phase={activePhase}
          isPending={endPhase.isPending || updateProfile.isPending}
          onConfirm={async () => {
            // Perioden avslutas FÖRE profilskrivningen: triggern sätter
            // calorie_goal när en period ändras, så motsatt ordning skulle
            // skriva över det mål användaren just valde.
            await endPhase.mutateAsync(activePhase.id)
            setConflictOpen(false)
            await persistProfile()
          }}
        />
      )}
    </DashboardLayout>
  )
}
