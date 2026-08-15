import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Save, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import EmptyState from '@/components/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProfileData } from '@/hooks/useProfileData'
import { useUpdateProfile, useActiveProfile, useWeightHistory } from '@/hooks'
import { calculateBMRWithFormula, requiresBodyFat } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import type { PALSystem, ActivityLevel, IntensityLevel, DailySteps } from '@/lib/calculations/tdee'
import { calculateAge } from '@/lib/calculations/helpers'
import { toast } from 'sonner'
import type { TDEECalculationSnapshot, BMRFormula, CalorieGoal, DeficitLevel } from '@/lib/types'
import BMRFormulaModal from '@/components/calculator/BMRFormulaModal'
import PALSystemModal from '@/components/calculator/PALSystemModal'
import PALTableContainer from '@/components/calculator/PALTableContainer'
import { useActivityIntensityText } from '@/hooks/useActivityIntensityText'
import ComparisonTab from './ComparisonTab'
import { PremiumGate } from '@/components/premium/PremiumGate'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { FREE_BMR_FORMULAS, FREE_PAL_SYSTEMS } from '@/lib/constants/entitlements'
import { freeMacrosForGoal } from '@/lib/utils/macroModes'
import MetabolicCalibration from '@/components/profile/MetabolicCalibration'
import { PhasePickerDialog } from '@/components/dashboard/PhasePickerDialog'
import { useActiveDietPhase } from '@/hooks/useDietPhases'

// Returns a finite number, or undefined. Handles '', NaN, null, and non-numeric strings.
function toFiniteOrUndefined(value: unknown): number | undefined {
  const n = parseFloat(String(value ?? ''))
  return isFinite(n) ? n : undefined
}

// Kaloriintervall + mål för DB-sparning. Bevarar profilens redan valda mål
// (t.ex. från onboarding-uppsättningen) i stället för att hårdkoda maintenance.
// Utan tidigare mål (helt ny profil): maintenance ±3%.
function caloriesForGoalPreset(
  tdee: number,
  goal?: string | null,
  deficitLevel?: string | null
): {
  calorie_goal: CalorieGoal
  calories_min: number
  calories_max: number
  deficit_level?: DeficitLevel
} {
  if (goal === 'Weight gain') {
    return {
      calorie_goal: 'Weight gain',
      calories_min: tdee * 1.1,
      calories_max: tdee * 1.2,
    }
  }
  if (goal === 'Weight loss') {
    const d: DeficitLevel =
      deficitLevel === '25-30%' || deficitLevel === '10-15%' ? deficitLevel : '20-25%'
    const mult = d === '25-30%' ? [0.7, 0.75] : d === '10-15%' ? [0.85, 0.9] : [0.75, 0.8] // 20-25% standard
    return {
      calorie_goal: 'Weight loss',
      calories_min: tdee * mult[0],
      calories_max: tdee * mult[1],
      deficit_level: d,
    }
  }
  // Maintain weight (och ingen/okänt mål)
  return {
    calorie_goal: 'Maintain weight',
    calories_min: tdee * 0.97,
    calories_max: tdee * 1.03,
  }
}

// Formel-råvärde → i18n-nyckel (tdeeCalc.bmr.formulas.*) för läsraden.
const BMR_FORMULA_I18N_KEY: Record<string, string> = {
  'Mifflin-St Jeor equation': 'mifflin',
  'Revised Harris-Benedict equation': 'revisedHarrisBenedict',
  'Original Harris-Benedict equation': 'originalHarrisBenedict',
  'Schofield equation': 'schofield',
  'Oxford/Henry equation': 'oxford',
  'MacroFactor standard equation': 'macrofactorStandard',
  'Cunningham equation': 'cunningham',
  'MacroFactor FFM equation': 'macrofactorFFM',
  'MacroFactor athlete equation': 'macrofactorAthlete',
  'Fitness Stuff Podcast equation': 'fitnessStuff',
}

export default function TDEECalculatorTool() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('tools')
  const { palSystemName } = useActivityIntensityText()
  const isEn = i18n.language?.startsWith('en')
  const { profile: activeProfile } = useActiveProfile()
  const updateProfile = useUpdateProfile()
  const profileData = useProfileData([
    'weight_kg',
    'height_cm',
    'birth_date',
    'gender',
    'body_fat_percentage',
  ])

  // React Hook Form
  const { register, watch, setValue } = useForm({
    defaultValues: {
      // Förvalt i stället för tomt. Utan värde returnerade beräkningen null och
      // HELA resultatkortet försvann utan felmeddelande — användaren såg en tom
      // sida utan att förstå vad som saknades. Koden antog redan 'Moderately
      // active' som fallback på två ställen (se sparningen nedan), men guarden
      // ovanför hann returnera null först, så den nåddes aldrig.
      activity_level: 'Moderately active',
      intensity_level: '',
      training_frequency_per_week: '',
      training_duration_minutes: '',
      daily_steps: '',
      custom_pal: '',
      // Beräkna din aktivitetsnivå fields
      training_activity_id: '',
      training_days_per_week: 0,
      training_minutes_per_session: 0,
      walking_activity_id: '17190',
      steps_per_day: undefined,
      hours_standing_per_day: 0,
      household_activity_id: '',
      household_hours_per_day: 0,
      spa_factor: 1.0,
    },
  })

  // Watch form values
  const activityLevel = watch('activity_level')
  const intensityLevel = watch('intensity_level')
  const trainingFrequency = watch('training_frequency_per_week')
  const trainingDuration = watch('training_duration_minutes')
  const dailySteps = watch('daily_steps')
  const customPAL = watch('custom_pal')
  // Beräkna din aktivitetsnivå values
  const trainingActivityId = watch('training_activity_id')
  const trainingDaysPerWeek = watch('training_days_per_week')
  const trainingMinutesPerSession = watch('training_minutes_per_session')
  const walkingActivityId = watch('walking_activity_id')
  const stepsPerDay = watch('steps_per_day')
  const hoursStandingPerDay = watch('hours_standing_per_day')
  const householdActivityId = watch('household_activity_id')
  const householdHoursPerDay = watch('household_hours_per_day')
  const spaFactor = watch('spa_factor')

  // Tab state
  const [activeTab, setActiveTab] = useState<'kalkylator' | 'jämförelse'>('kalkylator')

  // Local state
  const [isSaving, setIsSaving] = useState(false)
  /** Öppnas direkt efter sparat TDEE när användaren saknar pågående period */
  const [phasePickerOpen, setPhasePickerOpen] = useState(false)
  const { data: activePhase } = useActiveDietPhase()

  // Get user's weight history (shared across all profiles)
  const { data: weightHistory = [] } = useWeightHistory()

  // Calculate latest logged weight from weight history
  const latestLoggedWeight = useMemo(() => {
    if (weightHistory.length === 0) return null
    const sorted = [...weightHistory].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    )
    return sorted[0].weight_kg
  }, [weightHistory])

  // Weight state (local override for calculator)
  const [useLoggedWeight, setUseLoggedWeight] = useState(true) // Start with logged weight by default
  const [localWeight, setLocalWeight] = useState('')

  // Body fat percentage state
  const [useSavedBodyFat, setUseSavedBodyFat] = useState(true)
  const [manualBodyFat, setManualBodyFat] = useState('')
  const localBodyFat =
    useSavedBodyFat && profileData?.body_fat_percentage
      ? profileData.body_fat_percentage.toString()
      : manualBodyFat

  // Set weight when weight history or selection changes.
  // Fall tillbaka på profilvikten när ingen loggad vikt finns — annars blir
  // fältet tomt för nya användare (och i preview) som fyllt i profilvikt men
  // ännu inte loggat någon vikt.
  useEffect(() => {
    if (useLoggedWeight && latestLoggedWeight) {
      setLocalWeight(latestLoggedWeight.toString())
    } else if (profileData?.weight_kg) {
      setLocalWeight(profileData.weight_kg.toString())
    }
  }, [useLoggedWeight, latestLoggedWeight, profileData?.weight_kg])

  // Profilens sparade aktivitetsnivå vinner över standardvärdet, så en
  // återvändande användare möter sitt eget val och inte en tyst återställning.
  useEffect(() => {
    if (activeProfile?.activity_level) {
      setValue('activity_level', activeProfile.activity_level)
    }
  }, [activeProfile?.activity_level, setValue])

  // BMR and PAL state. Mifflin är förvald standard (grepp 2) — nybörjaren
  // behöver inte välja formel; expertvalet göms bakom "Avancerat".
  const [bmrFormula, setBmrFormula] = useState<BMRFormula | ''>('Mifflin-St Jeor equation')
  // Grundläggande PAL är förvald standard (grepp 5) — nybörjaren möter bara
  // aktivitetsnivå-dropdownen; systembytet göms bakom "Avancerat".
  const [palSystem, setPalSystem] = useState<PALSystem | ''>('Basic internet PAL values')
  const [showBMRModal, setShowBMRModal] = useState(false)
  const [showPALModal, setShowPALModal] = useState(false)

  // Plan-gating: free = Mifflin + standard-PAL; övriga formler/system premium
  const { limits } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)

  const isFormulaLocked = (formula: string) =>
    !limits.all_tdee_formulas && !FREE_BMR_FORMULAS.includes(formula)
  const isPalLocked = (system: string) =>
    !limits.all_tdee_formulas && !FREE_PAL_SYSTEMS.includes(system)

  const handleBmrFormulaChange = (formula: BMRFormula | '') => {
    if (formula && isFormulaLocked(formula)) {
      openUpgradeModal('all_tdee_formulas')
      return
    }
    setBmrFormula(formula)
  }

  // Systemväljaren ligger inuti <details>-blocket medan tabellen renderas
  // utanför det. Byter man till "Beräkna din aktivitetsnivå" ersätts en liten
  // dropdown av ett formulär på nio fält som växer fram långt nedanför — sidan
  // hoppar och det ser ut som en omladdning. Scrollen tar användaren dit.
  const palTableRef = useRef<HTMLDivElement>(null)

  const handlePalSystemChange = (system: PALSystem | '') => {
    if (system && isPalLocked(system)) {
      openUpgradeModal('all_tdee_formulas')
      return
    }
    setPalSystem(system)
    if (!system) return
    // Efter renderingen av den nya tabellen, annars scrollar vi till den gamla.
    requestAnimationFrame(() => {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      palTableRef.current?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }

  const premiumSuffix = (locked: boolean) => (locked ? ' — Premium' : '')

  // Calculate age from birth_date
  const age = useMemo(() => {
    if (!profileData?.birth_date) return null
    return calculateAge(profileData.birth_date)
  }, [profileData?.birth_date])

  // Beräkna BMR
  const bmr = useMemo(() => {
    const weight = localWeight ? parseFloat(localWeight) : null
    const bodyFat = localBodyFat ? parseFloat(localBodyFat) : undefined

    if (!weight || !profileData?.height_cm || !age || !profileData?.gender || !bmrFormula) {
      return null
    }

    const calculatedBMR = calculateBMRWithFormula(bmrFormula, {
      gender: profileData.gender,
      age,
      weight,
      height: profileData.height_cm,
      bodyFatPercentage: bodyFat,
    })

    // Validate BMR result
    if (!calculatedBMR || calculatedBMR <= 0) {
      return null
    }

    return calculatedBMR
  }, [profileData, age, bmrFormula, localWeight, localBodyFat])

  // Beräkna TDEE
  const tdee = useMemo(() => {
    if (!bmr || !palSystem || !profileData?.gender) return null

    // Require custom PAL value when Custom PAL system is selected
    if (palSystem === 'Custom PAL' && !customPAL) return null

    // Require activity level for PAL systems that use it (all except Beräkna and Custom PAL)
    const palSystemsRequiringActivityLevel: PALSystem[] = [
      'FAO/WHO/UNU based PAL values',
      'DAMNRIPPED PAL values',
      'Pro Physique PAL values',
      'Basic internet PAL values',
    ]
    if (palSystemsRequiringActivityLevel.includes(palSystem as PALSystem) && !activityLevel) {
      return null
    }

    // Require intensity level for systems that use it
    const palSystemsRequiringIntensityLevel: PALSystem[] = [
      'DAMNRIPPED PAL values',
      'Pro Physique PAL values',
    ]
    if (palSystemsRequiringIntensityLevel.includes(palSystem as PALSystem) && !intensityLevel) {
      return null
    }

    // Require training fields for Pro Physique
    if (palSystem === 'Pro Physique PAL values') {
      const tDays = Number(trainingFrequency) || 0
      const tMinutes = Number(trainingDuration) || 0
      if (tDays <= 0 || tMinutes <= 0) return null
    }

    // Require training fields and daily steps for Fitness Stuff
    if (palSystem === 'Fitness Stuff PAL values') {
      const tDays = Number(trainingFrequency) || 0
      const tMinutes = Number(trainingDuration) || 0
      if (tDays <= 0 || tMinutes <= 0 || !dailySteps) return null
    }

    // Special validation for Beräkna din aktivitetsnivå
    if (palSystem === 'Beräkna din aktivitetsnivå') {
      // Require only 4 fields to be filled:
      // 1. Antal dagar per vecka du tränar
      // 2. Antal minuter per träningspass
      // 3. Välj träningsaktivitet
      // 4. Genomsnittligt antal steg per dag
      const tDays = Number(trainingDaysPerWeek) || 0
      const tMinutes = Number(trainingMinutesPerSession) || 0
      const hHours = Number(householdHoursPerDay) || 0
      const householdOk = hHours === 0 || !!householdActivityId

      const allRequiredFieldsFilled =
        tDays > 0 &&
        tMinutes > 0 &&
        !!trainingActivityId &&
        (Number(stepsPerDay) || 0) > 0 &&
        householdOk

      if (!allRequiredFieldsFilled) {
        return null
      }
    }

    const weight = localWeight ? parseFloat(localWeight) : null

    // Calculate TDEE using the selected PAL system and user's activity data
    const calculatedTDEE = calculateTDEE({
      bmr,
      palSystem: palSystem as PALSystem,
      activityLevel: (activityLevel || 'Moderately active') as ActivityLevel,
      gender: profileData.gender,
      intensityLevel: (intensityLevel || undefined) as IntensityLevel | undefined,
      trainingFrequencyPerWeek: trainingFrequency ? parseFloat(trainingFrequency) : undefined,
      trainingDurationMinutes: trainingDuration ? parseFloat(trainingDuration) : undefined,
      dailySteps: (dailySteps || undefined) as DailySteps | undefined,
      customPAL: customPAL ? parseFloat(customPAL) : undefined,
      // Beräkna din aktivitetsnivå fields
      weightKg: weight || undefined,
      trainingActivityId: trainingActivityId || undefined,
      trainingDaysPerWeek: Number(trainingDaysPerWeek) || 0,
      trainingMinutesPerSession: Number(trainingMinutesPerSession) || 0,
      walkingActivityId: walkingActivityId || undefined,
      stepsPerDay: Number(stepsPerDay) || undefined,
      hoursStandingPerDay: Number(hoursStandingPerDay) || 0,
      householdActivityId: householdActivityId || undefined,
      householdHoursPerDay: Number(householdHoursPerDay) || 0,
      spaFactor: Number(spaFactor) || 1.0,
    })

    // Validate TDEE result
    if (!calculatedTDEE || calculatedTDEE <= 0 || !isFinite(calculatedTDEE)) {
      return null
    }

    return calculatedTDEE
  }, [
    bmr,
    palSystem,
    activityLevel,
    intensityLevel,
    trainingFrequency,
    trainingDuration,
    dailySteps,
    customPAL,
    profileData?.gender,
    localWeight,
    trainingActivityId,
    trainingDaysPerWeek,
    trainingMinutesPerSession,
    walkingActivityId,
    stepsPerDay,
    hoursStandingPerDay,
    householdActivityId,
    householdHoursPerDay,
    spaFactor,
  ])

  // Kaloriintervallet för användarens mål — det svar de faktiskt kom för.
  //
  // Räknades tidigare ut enbart inne i sparningen, så BMR och TDEE visades på
  // sidan medan "hur mycket ska jag äta?" bara gick att se efter att man sparat
  // och navigerat vidare. Samma funktion som sparningen använder, så visat och
  // sparat värde aldrig kan divergera.
  const goalCalories = useMemo(() => {
    if (!tdee) return null
    return caloriesForGoalPreset(tdee, activeProfile?.calorie_goal, activeProfile?.deficit_level)
  }, [tdee, activeProfile?.calorie_goal, activeProfile?.deficit_level])

  // Save TDEE to profile
  const handleSaveToProfile = async () => {
    if (!activeProfile || !bmr || !tdee) {
      toast.error(t('tdeeCalc.toast.cannotSave'))
      return
    }

    // Check if TDEE already exists - show confirmation dialog
    if (activeProfile.tdee) {
      const confirmed = window.confirm(t('tdeeCalc.toast.overwriteConfirm'))
      if (!confirmed) return
    }

    setIsSaving(true)

    try {
      // Parse body fat percentage if provided
      const bodyFatNum = localBodyFat ? parseFloat(localBodyFat) : undefined

      // Create TDEE calculation snapshot
      const weightNum = localWeight ? parseFloat(localWeight) : profileData?.weight_kg
      const snapshot: TDEECalculationSnapshot = {
        weight_kg: weightNum,
        height_cm: profileData?.height_cm,
        age: age ?? undefined,
        gender: profileData?.gender,
        body_fat_percentage: bodyFatNum,
        bmr_formula: bmrFormula || undefined,
        pal_system: palSystem as PALSystem,
        activity_level: (activityLevel || 'Moderately active') as ActivityLevel,
        intensity_level: (intensityLevel || undefined) as IntensityLevel | undefined,
        training_frequency_per_week: trainingFrequency ? parseFloat(trainingFrequency) : undefined,
        training_duration_minutes: trainingDuration ? parseFloat(trainingDuration) : undefined,
        daily_steps: (dailySteps || undefined) as DailySteps | undefined,
        custom_pal: customPAL ? parseFloat(customPAL) : undefined,
        // Beräkna din aktivitetsnivå fields
        training_activity_id: trainingActivityId || undefined,
        training_days_per_week: trainingDaysPerWeek || undefined,
        training_minutes_per_session: trainingMinutesPerSession || undefined,
        walking_activity_id: walkingActivityId || undefined,
        steps_per_day: stepsPerDay || undefined,
        hours_standing_per_day: hoursStandingPerDay || undefined,
        household_activity_id: householdActivityId || undefined,
        household_hours_per_day: householdHoursPerDay || undefined,
        calculated_bmr: bmr,
        calculated_tdee: tdee,
      }

      // Bevara målet + räkna om kalorier, och sätt makrofördelningen för det
      // målets standardläge — men bara om det läget är gratis. Viktuppgång
      // mappar till offseason (premium) → inga makron tvingas på (freeMacrosForGoal
      // returnerar null); då sätts bara mål + kalorier.
      const goalPreset = caloriesForGoalPreset(
        tdee,
        activeProfile.calorie_goal,
        activeProfile.deficit_level
      )
      const macros = freeMacrosForGoal(goalPreset.calorie_goal, {
        weight: weightNum ?? 0,
        caloriesMin: goalPreset.calories_min,
        caloriesMax: goalPreset.calories_max,
      })

      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        data: {
          bmr,
          tdee,
          bmr_formula: bmrFormula || undefined,
          pal_system: palSystem as PALSystem,
          activity_level: (activityLevel || 'Moderately active') as ActivityLevel,
          intensity_level: (intensityLevel || undefined) as IntensityLevel | undefined,
          training_frequency_per_week: toFiniteOrUndefined(trainingFrequency),
          training_duration_minutes: toFiniteOrUndefined(trainingDuration),
          daily_steps: (dailySteps || undefined) as DailySteps | undefined,
          custom_pal: toFiniteOrUndefined(customPAL),
          // Beräkna din aktivitetsnivå fields
          training_activity_id: trainingActivityId || undefined,
          training_days_per_week: Number(trainingDaysPerWeek) || undefined,
          training_minutes_per_session: Number(trainingMinutesPerSession) || undefined,
          walking_activity_id: walkingActivityId || undefined,
          steps_per_day: Number(stepsPerDay) || undefined,
          hours_standing_per_day: Number(hoursStandingPerDay) || undefined,
          household_activity_id: householdActivityId || undefined,
          household_hours_per_day: Number(householdHoursPerDay) || undefined,
          // Set weight_kg (initial_weight_kg is no longer used - weight is tracked via WeightTracker)
          weight_kg: weightNum,

          // TDEE metadata
          tdee_calculated_at: new Date().toISOString(),
          tdee_source: 'tdee_calculator_tool',
          tdee_calculation_snapshot: snapshot,
          // Behåll det mål användaren redan valt (t.ex. i onboarding) och räkna om
          // kaloriintervallet för det. Utan tidigare mål: maintenance ±3% som default.
          ...goalPreset,
          // Makrofördelning för målets gratis-läge (så kostläget matchar). Vid
          // premium-läge (viktuppgång/offseason) är macros null → inga makron sätts.
          ...(macros
            ? {
                fat_min_percent: macros.fatMinPercent,
                fat_max_percent: macros.fatMaxPercent,
                carb_min_percent: macros.carbMinPercent,
                carb_max_percent: macros.carbMaxPercent,
                protein_min_percent: macros.proteinMinPercent,
                protein_max_percent: macros.proteinMaxPercent,
              }
            : {}),
        },
      })

      toast.success(t('tdeeCalc.toast.saved'))

      // Riktningen frågas inte längre i grunduppgifterna — den väljs som en
      // period, och först HÄR finns TDEE så att dialogen kan visa kalorier och
      // makron för varje alternativ. Utan detta steg landar användaren på ett
      // underhållsmål hen aldrig valt och måste själv hitta periodkortet.
      // Har man redan en pågående period behövs ingen fråga.
      if (!activePhase) {
        setPhasePickerOpen(true)
        return
      }
      navigate('/app/profile')
    } catch (error) {
      console.error('Error saving TDEE:', error)
      toast.error(t('tdeeCalc.toast.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  // Check if profile exists - show empty state if no profile
  if (!activeProfile) {
    return (
      <EmptyState
        icon={User}
        title={t('tdeeCalc.noProfile.title')}
        description={t('tdeeCalc.noProfile.description')}
        action={{
          label: t('tdeeCalc.noProfile.action'),
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            {t('tdeeCalc.header.title')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {t('tdeeCalc.header.description')}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
        >
          {t('tdeeCalc.header.badge')}
        </Badge>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700">
        {(['kalkylator', 'jämförelse'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:border-neutral-600'
            }`}
          >
            {tab === 'kalkylator' ? t('tdeeCalc.tabs.calculator') : t('tdeeCalc.tabs.comparison')}
          </button>
        ))}
      </div>

      {activeTab === 'jämförelse' && (
        <PremiumGate feature="all_tdee_formulas" title={t('tdeeCalc.tabs.comparison')}>
          <ComparisonTab
            profileGender={profileData?.gender}
            profileAge={age}
            profileWeight={profileData?.weight_kg}
            profileHeight={profileData?.height_cm}
            profileBodyFat={profileData?.body_fat_percentage}
          />
        </PremiumGate>
      )}

      {activeTab === 'kalkylator' && (
        <>
          {/* Weight Input - With Choice Between Latest Logged Weight and Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tdeeCalc.weight.title')}</CardTitle>
              <CardDescription>{t('tdeeCalc.weight.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Radio buttons for weight choice - only show if weight history exists */}
              {latestLoggedWeight && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors dark:border-neutral-700 dark:hover:bg-primary-900/25">
                    <input
                      type="radio"
                      checked={useLoggedWeight}
                      onChange={() => setUseLoggedWeight(true)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {t('tdeeCalc.weight.useLogged')}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {t('tdeeCalc.weight.useLoggedDetail', { weight: latestLoggedWeight })}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors dark:border-neutral-700 dark:hover:bg-primary-900/25">
                    <input
                      type="radio"
                      checked={!useLoggedWeight}
                      onChange={() => setUseLoggedWeight(false)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {t('tdeeCalc.weight.useManual')}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {t('tdeeCalc.weight.useManualDetail')}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Weight input field - shown when manual entry is selected or no logged weight exists */}
              {(!useLoggedWeight || !latestLoggedWeight) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {t('tdeeCalc.weight.fieldLabel')}{' '}
                    <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={localWeight}
                    onChange={e => setLocalWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-medium dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    placeholder="75"
                    min="20"
                    max="300"
                    step="0.1"
                  />
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
                    {t('tdeeCalc.weight.fieldHint')}
                    {!latestLoggedWeight && t('tdeeCalc.weight.logHint')}
                  </p>
                </div>
              )}

              {/* Display selected weight */}
              {useLoggedWeight && latestLoggedWeight && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/25 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    <strong>{t('tdeeCalc.weight.selectedWeight')}</strong> {latestLoggedWeight} kg
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BMR Formula Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tdeeCalc.bmr.title')}</CardTitle>
              <CardDescription>{t('tdeeCalc.bmr.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  {/* Läsrad: vilken formel som används (standard = Mifflin). */}
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {t('tdeeCalc.bmr.usingLabel')}:{' '}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {bmrFormula && BMR_FORMULA_I18N_KEY[bmrFormula]
                        ? (t as (k: string) => string)(
                            `tdeeCalc.bmr.formulas.${BMR_FORMULA_I18N_KEY[bmrFormula]}`
                          )
                        : t('tdeeCalc.bmr.placeholder')}
                    </span>
                    {bmrFormula === 'Mifflin-St Jeor equation' && (
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {' '}
                        ({t('tdeeCalc.bmr.usingStandard')})
                      </span>
                    )}
                    {/* Faktaknappen hör hemma här, inte inne i Avancerat: den
                        förklarar formeln man FAKTISKT använder, vilket är
                        relevant även för den som aldrig byter. */}
                    {bmrFormula && (
                      <>
                        {' '}
                        <button
                          type="button"
                          onClick={() => setShowBMRModal(true)}
                          className="text-sm text-primary-600 underline transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          {t('tdeeCalc.bmr.factLink')}
                        </button>
                      </>
                    )}
                  </p>

                  {/* Expertval — göms bakom "Avancerat" (grepp 2). */}
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 select-none dark:text-primary-400 dark:hover:text-primary-300">
                      {limits.all_tdee_formulas
                        ? t('tdeeCalc.bmr.advancedToggle')
                        : t('tdeeCalc.bmr.advancedTogglePremium')}
                    </summary>
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('tdeeCalc.bmr.fieldLabel')}{' '}
                          <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                      </div>
                      <select
                        value={bmrFormula}
                        onChange={e => handleBmrFormulaChange(e.target.value as BMRFormula | '')}
                        className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">{t('tdeeCalc.bmr.placeholder')}</option>
                        <option value="Mifflin-St Jeor equation">
                          {t('tdeeCalc.bmr.formulas.mifflin')}
                        </option>
                        <option value="Revised Harris-Benedict equation">
                          {t('tdeeCalc.bmr.formulas.revisedHarrisBenedict')}
                          {premiumSuffix(isFormulaLocked('Revised Harris-Benedict equation'))}
                        </option>
                        <option value="Original Harris-Benedict equation">
                          {t('tdeeCalc.bmr.formulas.originalHarrisBenedict')}
                          {premiumSuffix(isFormulaLocked('Original Harris-Benedict equation'))}
                        </option>
                        <option value="Schofield equation">
                          {t('tdeeCalc.bmr.formulas.schofield')}
                          {premiumSuffix(isFormulaLocked('Schofield equation'))}
                        </option>
                        <option value="Oxford/Henry equation">
                          {t('tdeeCalc.bmr.formulas.oxford')}
                          {premiumSuffix(isFormulaLocked('Oxford/Henry equation'))}
                        </option>
                        <option value="MacroFactor standard equation">
                          {t('tdeeCalc.bmr.formulas.macrofactorStandard')}
                          {premiumSuffix(isFormulaLocked('MacroFactor standard equation'))}
                        </option>
                        <option value="Cunningham equation">
                          {t('tdeeCalc.bmr.formulas.cunningham')}
                          {premiumSuffix(isFormulaLocked('Cunningham equation'))}
                        </option>
                        <option value="MacroFactor FFM equation">
                          {t('tdeeCalc.bmr.formulas.macrofactorFFM')}
                          {premiumSuffix(isFormulaLocked('MacroFactor FFM equation'))}
                        </option>
                        <option value="MacroFactor athlete equation">
                          {t('tdeeCalc.bmr.formulas.macrofactorAthlete')}
                          {premiumSuffix(isFormulaLocked('MacroFactor athlete equation'))}
                        </option>
                        <option value="Fitness Stuff Podcast equation">
                          {t('tdeeCalc.bmr.formulas.fitnessStuff')}
                          {premiumSuffix(isFormulaLocked('Fitness Stuff Podcast equation'))}
                        </option>
                      </select>
                    </div>
                  </details>

                  {/* Body fat — shown inline when formula requires it */}
                  {bmrFormula && requiresBodyFat(bmrFormula) && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 space-y-3">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {t('tdeeCalc.bodyFat.title')}
                      </p>
                      {profileData?.body_fat_percentage && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setUseSavedBodyFat(true)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              useSavedBodyFat
                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            {t('tdeeCalc.bodyFat.savedLabel')} {profileData.body_fat_percentage}%
                          </button>
                          <button
                            type="button"
                            onClick={() => setUseSavedBodyFat(false)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              !useSavedBodyFat
                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            {(t as (k: string) => string)('tdeeCalc.bodyFat.otherValue')}
                          </button>
                        </div>
                      )}
                      {(!profileData?.body_fat_percentage || !useSavedBodyFat) && (
                        <div>
                          <input
                            type="number"
                            value={manualBodyFat}
                            onChange={e => setManualBodyFat(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-medium dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            placeholder={t('tdeeCalc.bodyFat.fieldLabel')}
                            min="3"
                            max="60"
                            step="0.1"
                          />
                          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {t('tdeeCalc.bodyFat.fieldHint')}
                          </p>
                        </div>
                      )}
                      {!localBodyFat && (
                        <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-900/25 dark:border-amber-800">
                          <span className="text-amber-600 dark:text-amber-300 flex-shrink-0">
                            ⚠
                          </span>
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            {t('tdeeCalc.bmr.bodyFatWarning')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PAL System Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tdeeCalc.pal.title')}</CardTitle>
              <CardDescription>{t('tdeeCalc.pal.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  {/* Läsrad: vilket system som används (standard = Grundläggande PAL). */}
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {t('tdeeCalc.pal.usingLabel')}:{' '}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {palSystem ? palSystemName(palSystem) : t('tdeeCalc.pal.placeholder')}
                    </span>
                    {palSystem === 'Basic internet PAL values' && (
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {' '}
                        ({t('tdeeCalc.pal.usingStandard')})
                      </span>
                    )}
                    {/* Se kommentaren vid BMR-läsraden ovan. */}
                    {palSystem && (
                      <>
                        {' '}
                        <button
                          type="button"
                          onClick={() => setShowPALModal(true)}
                          className="text-sm text-primary-600 underline transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          {t('tdeeCalc.pal.factLink')}
                        </button>
                      </>
                    )}
                  </p>

                  {/* Expertval — göms bakom "Avancerat" (grepp 5). */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 select-none dark:text-primary-400 dark:hover:text-primary-300">
                      {limits.all_tdee_formulas
                        ? t('tdeeCalc.pal.advancedToggle')
                        : t('tdeeCalc.pal.advancedTogglePremium')}
                    </summary>
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {t('tdeeCalc.pal.fieldLabel')}{' '}
                          <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                      </div>
                      <select
                        value={palSystem}
                        onChange={e => handlePalSystemChange(e.target.value as PALSystem | '')}
                        className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <option value="">{t('tdeeCalc.pal.placeholder')}</option>
                        <option value="Basic internet PAL values">
                          {t('tdeeCalc.pal.systems.basicInternet')}
                        </option>
                        <option value="FAO/WHO/UNU based PAL values">
                          {palSystemName('FAO/WHO/UNU based PAL values')}
                          {premiumSuffix(isPalLocked('FAO/WHO/UNU based PAL values'))}
                        </option>
                        <option value="DAMNRIPPED PAL values">
                          {palSystemName('DAMNRIPPED PAL values')}
                          {premiumSuffix(isPalLocked('DAMNRIPPED PAL values'))}
                        </option>
                        <option value="Pro Physique PAL values">
                          {palSystemName('Pro Physique PAL values')}
                          {premiumSuffix(isPalLocked('Pro Physique PAL values'))}
                        </option>
                        <option value="Fitness Stuff PAL values">
                          {palSystemName('Fitness Stuff PAL values')}
                          {premiumSuffix(isPalLocked('Fitness Stuff PAL values'))}
                        </option>
                        <option value="Beräkna din aktivitetsnivå">
                          {t('tdeeCalc.pal.calculateLevel')}
                          {premiumSuffix(isPalLocked('Beräkna din aktivitetsnivå'))}
                        </option>
                        <option value="Custom PAL">{palSystemName('Custom PAL')}</option>
                      </select>
                    </div>
                  </details>
                </div>

                {/* Show PAL table if system is selected */}
                {palSystem && (
                  <div className="mt-4" ref={palTableRef}>
                    <PALTableContainer
                      system={palSystem}
                      register={register}
                      watch={watch}
                      bmr={bmr}
                      weight={localWeight ? parseFloat(localWeight) : null}
                      tdee={tdee}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BMR & TDEE Results - Combined Clean Display */}
          {(bmr || tdee) && (
            <Card className="border-2 border-primary-200 dark:border-primary-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span> {t('tdeeCalc.results.title')}
                </CardTitle>
                <CardDescription>{t('tdeeCalc.results.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Kaloriintervallet först: det är frågan användaren kom med.
                    BMR och TDEE är underlaget och står därför under. */}
                {goalCalories && (
                  <div className="rounded-xl border-2 border-primary-300 bg-primary-50 p-6 text-center dark:border-primary-700 dark:bg-primary-900/25">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary-800 dark:text-primary-200">
                      {t('tdeeCalc.results.goalTitle')}
                    </p>
                    <p className="mt-2 text-4xl font-bold text-primary-800 dark:text-primary-100">
                      {Math.round(goalCalories.calories_min)}–
                      {Math.round(goalCalories.calories_max)}
                    </p>
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      {t('tdeeCalc.results.kcalPerDay')}{' '}
                      {goalCalories.calorie_goal === 'Weight loss'
                        ? t('tdeeCalc.results.goalLoss')
                        : goalCalories.calorie_goal === 'Weight gain'
                          ? t('tdeeCalc.results.goalGain')
                          : t('tdeeCalc.results.goalMaintain')}
                    </p>
                    <p className="mt-3 text-xs text-primary-700/80 dark:text-primary-300/80">
                      {t('tdeeCalc.results.goalExplain')} {t('tdeeCalc.results.goalChangeHint')}
                    </p>
                  </div>
                )}

                {/* Results Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* BMR Result */}
                  {bmr && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 text-center dark:from-blue-900/25 dark:to-purple-900/25 dark:border-blue-800">
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                        {t('tdeeCalc.results.bmrLabel')}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold mb-2">
                        BMR
                      </p>
                      <p className="text-5xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                        {Math.round(bmr)}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('tdeeCalc.results.kcalPerDay')}
                      </p>
                      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {t('tdeeCalc.results.bmrExplain')}
                      </p>
                      {/* Översatt namn, inte råsträngen: {bmrFormula} visade
                          "Mifflin-St Jeor equation" på engelska mitt i svensk
                          text, till skillnad från TDEE-kortet som redan
                          översatte via palSystemName. */}
                      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-blue-200 dark:border-blue-800 pt-3">
                        {bmrFormula && BMR_FORMULA_I18N_KEY[bmrFormula]
                          ? (t as (k: string) => string)(
                              `tdeeCalc.bmr.formulas.${BMR_FORMULA_I18N_KEY[bmrFormula]}`
                            )
                          : bmrFormula}
                      </p>
                    </div>
                  )}

                  {/* TDEE Result */}
                  {tdee && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center dark:from-green-900/25 dark:to-emerald-900/25 dark:border-green-800">
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">
                        {t('tdeeCalc.results.tdeeLabel')}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300 font-semibold mb-2">
                        TDEE
                      </p>
                      <p className="text-5xl font-bold text-green-700 dark:text-green-300 mb-1">
                        {Math.round(tdee)}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('tdeeCalc.results.kcalPerDay')}
                      </p>
                      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {t('tdeeCalc.results.tdeeExplain')}
                      </p>
                      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 border-t border-green-200 dark:border-green-800 pt-3">
                        {palSystemName(palSystem as PALSystem)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                {tdee && (
                  <Button
                    onClick={handleSaveToProfile}
                    disabled={isSaving || !activeProfile}
                    className="w-full"
                    size="lg"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? t('tdeeCalc.results.saving') : t('tdeeCalc.results.saveButton')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metabolic Calibration */}
          {activeProfile && activeProfile.tdee && <MetabolicCalibration profile={activeProfile} />}

          {/* Begreppsartiklar sist: fyra länkar om BMR/RMR/PAL/MET/LBM/FFM
              låg tidigare FÖRE första inmatningsfältet och signalerade att man
              måste läsa på innan verktyget gick att använda. Här är de en
              fördjupning för den som vill förstå sitt resultat. */}
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                to: isEn ? '/en/articles/bmr-vs-rmr' : '/artiklar/bmr-vs-rmr',
                label: isEn ? 'What is BMR and RMR?' : 'Vad är BMR och RMR?',
              },
              {
                to: isEn ? '/en/articles/what-is-pal-and-met' : '/artiklar/vad-ar-pal-och-met',
                label: isEn ? 'What is PAL and MET?' : 'Vad är PAL och MET?',
              },
              {
                to: isEn ? '/en/articles/what-is-tdee' : '/artiklar/vad-ar-tdee',
                label: isEn ? 'What is TDEE?' : 'Vad är TDEE?',
              },
              {
                to: isEn ? '/en/articles/lbm-vs-ffm' : '/artiklar/lbm-vs-ffm',
                label: isEn ? 'Difference between LBM and FFM?' : 'Skillnad på LBM och FFM?',
              },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-700 transition-colors dark:border-neutral-700 dark:bg-neutral-850 dark:text-neutral-300 dark:hover:border-primary-700"
              >
                {label}
                <span className="text-xs text-primary-600 dark:text-primary-400 whitespace-nowrap">
                  Läs mer →
                </span>
              </Link>
            ))}
          </div>

          {/* Modals */}
          {bmrFormula && (
            <BMRFormulaModal
              formula={bmrFormula}
              isOpen={showBMRModal}
              onClose={() => setShowBMRModal(false)}
            />
          )}

          {palSystem && (
            <PALSystemModal
              system={palSystem}
              isOpen={showPALModal}
              onClose={() => setShowPALModal(false)}
            />
          )}
        </>
      )}

      {/*
        Riktningsvalet efter sparat TDEE. Stänger användaren dialogen utan att
        välja hamnar hen ändå på profilen — periodkortet på dashboarden ställer
        samma fråga, så ingen fastnar.
      */}
      {tdee && activeProfile?.weight_kg && (
        <PhasePickerDialog
          open={phasePickerOpen}
          onOpenChange={open => {
            setPhasePickerOpen(open)
            if (!open) navigate('/app/profile')
          }}
          tdee={tdee}
          weightKg={activeProfile.weight_kg}
          bodyFatPercentage={activeProfile.body_fat_percentage}
        />
      )}
    </div>
  )
}
