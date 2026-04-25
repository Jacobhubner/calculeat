import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { TDEECalculationSnapshot, BMRFormula } from '@/lib/types'
import BMRFormulaModal from '@/components/calculator/BMRFormulaModal'
import PALSystemModal from '@/components/calculator/PALSystemModal'
import PALTableContainer from '@/components/calculator/PALTableContainer'
import InfoCardWithModal from '@/components/InfoCardWithModal'
import BMRvsRMRContent from '@/components/info/BMRvsRMRContent'
import PALvsMETContent from '@/components/info/PALvsMETContent'
import TDEEContent from '@/components/info/TDEEContent'
import LBMvsFFMContent from '@/components/info/LBMvsFFMContent'
import { translatePALSystem } from '@/lib/translations'
import ComparisonTab from './ComparisonTab'
import MetabolicCalibration from '@/components/profile/MetabolicCalibration'

// Returns a finite number, or undefined. Handles '', NaN, null, and non-numeric strings.
function toFiniteOrUndefined(value: unknown): number | undefined {
  const n = parseFloat(String(value ?? ''))
  return isFinite(n) ? n : undefined
}

export default function TDEECalculatorTool() {
  const navigate = useNavigate()
  const { t } = useTranslation('tools')
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
  const { register, watch } = useForm({
    defaultValues: {
      activity_level: '',
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
  const localBodyFat = useSavedBodyFat
    ? (profileData?.body_fat_percentage?.toString() ?? '')
    : manualBodyFat

  // Set weight when weight history or selection changes
  useMemo(() => {
    if (useLoggedWeight && latestLoggedWeight) {
      setLocalWeight(latestLoggedWeight.toString())
    } else if (!useLoggedWeight && profileData?.weight_kg) {
      setLocalWeight(profileData.weight_kg.toString())
    }
  }, [useLoggedWeight, latestLoggedWeight, profileData?.weight_kg])

  // BMR and PAL state
  const [bmrFormula, setBmrFormula] = useState<BMRFormula | ''>('')
  const [palSystem, setPalSystem] = useState<PALSystem | ''>('')
  const [showBMRModal, setShowBMRModal] = useState(false)
  const [showPALModal, setShowPALModal] = useState(false)

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

    // Require activity level for PAL systems that use it (all except Beräkna and Custom PAL)
    const palSystemsRequiringActivityLevel: PALSystem[] = [
      'FAO/WHO/UNU based PAL values',
      'DAMNRIPPED PAL values',
      'Pro Physique PAL values',
      'Fitness Stuff PAL values',
      'Basic internet PAL values',
    ]
    if (palSystemsRequiringActivityLevel.includes(palSystem as PALSystem) && !activityLevel) {
      return null
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
          // Only overwrite body_fat_percentage if the user explicitly provided a value.
          ...(bodyFatNum !== undefined && { body_fat_percentage: bodyFatNum }),
          // TDEE metadata
          tdee_calculated_at: new Date().toISOString(),
          tdee_source: 'tdee_calculator_tool',
          tdee_calculation_snapshot: snapshot,
          // Set default calorie goal and interval (maintenance ±3%)
          calorie_goal: 'Maintain weight',
          calories_min: tdee * 0.97,
          calories_max: tdee * 1.03,
        },
      })

      toast.success(t('tdeeCalc.toast.saved'))
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
          <h2 className="text-2xl font-bold text-gray-900">{t('tdeeCalc.header.title')}</h2>
          <p className="text-neutral-600 mt-1">{t('tdeeCalc.header.description')}</p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          {t('tdeeCalc.header.badge')}
        </Badge>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-neutral-200">
        {(['kalkylator', 'jämförelse'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {tab === 'kalkylator' ? t('tdeeCalc.tabs.calculator') : t('tdeeCalc.tabs.comparison')}
          </button>
        ))}
      </div>

      {activeTab === 'jämförelse' && (
        <ComparisonTab
          profileGender={profileData?.gender}
          profileAge={age}
          profileWeight={profileData?.weight_kg}
          profileHeight={profileData?.height_cm}
          profileBodyFat={profileData?.body_fat_percentage}
        />
      )}

      {activeTab === 'kalkylator' && (
        <>
          {/* Information Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCardWithModal
              title={t('tdeeCalc.infoCards.bmrRmr')}
              modalTitle={t('tdeeCalc.infoCards.bmrRmrModal')}
              modalContent={<BMRvsRMRContent />}
            />

            <InfoCardWithModal
              title={t('tdeeCalc.infoCards.palMet')}
              modalTitle={t('tdeeCalc.infoCards.palMetModal')}
              modalContent={<PALvsMETContent />}
            />

            <InfoCardWithModal
              title={t('tdeeCalc.infoCards.tdee')}
              modalTitle={t('tdeeCalc.infoCards.tdeeModal')}
              modalContent={<TDEEContent />}
            />

            <InfoCardWithModal
              title={t('tdeeCalc.infoCards.lbmFfm')}
              modalTitle={t('tdeeCalc.infoCards.lbmFfmModal')}
              modalContent={<LBMvsFFMContent />}
            />
          </div>

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
                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
                    <input
                      type="radio"
                      checked={useLoggedWeight}
                      onChange={() => setUseLoggedWeight(true)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {t('tdeeCalc.weight.useLogged')}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {t('tdeeCalc.weight.useLoggedDetail', { weight: latestLoggedWeight })}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
                    <input
                      type="radio"
                      checked={!useLoggedWeight}
                      onChange={() => setUseLoggedWeight(false)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {t('tdeeCalc.weight.useManual')}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {t('tdeeCalc.weight.useManualDetail')}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Weight input field - shown when manual entry is selected or no logged weight exists */}
              {(!useLoggedWeight || !latestLoggedWeight) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    {t('tdeeCalc.weight.fieldLabel')} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={localWeight}
                    onChange={e => setLocalWeight(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-medium"
                    placeholder="75"
                    min="20"
                    max="300"
                    step="0.1"
                  />
                  <p className="mt-2 text-xs text-neutral-600">
                    {t('tdeeCalc.weight.fieldHint')}
                    {!latestLoggedWeight && t('tdeeCalc.weight.logHint')}
                  </p>
                </div>
              )}

              {/* Display selected weight */}
              {useLoggedWeight && latestLoggedWeight && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
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
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      {t('tdeeCalc.bmr.fieldLabel')} <span className="text-red-600">*</span>
                    </label>
                    {bmrFormula && (
                      <button
                        type="button"
                        onClick={() => setShowBMRModal(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 underline transition-colors"
                      >
                        {t('tdeeCalc.bmr.factLink')}
                      </button>
                    )}
                  </div>
                  <select
                    value={bmrFormula}
                    onChange={e => setBmrFormula(e.target.value as BMRFormula | '')}
                    className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">{t('tdeeCalc.bmr.placeholder')}</option>
                    <option value="Mifflin-St Jeor equation">
                      {t('tdeeCalc.bmr.formulas.mifflin')}
                    </option>
                    <option value="Revised Harris-Benedict equation">
                      {t('tdeeCalc.bmr.formulas.revisedHarrisBenedict')}
                    </option>
                    <option value="Original Harris-Benedict equation">
                      {t('tdeeCalc.bmr.formulas.originalHarrisBenedict')}
                    </option>
                    <option value="Schofield equation">
                      {t('tdeeCalc.bmr.formulas.schofield')}
                    </option>
                    <option value="Oxford/Henry equation">
                      {t('tdeeCalc.bmr.formulas.oxford')}
                    </option>
                    <option value="MacroFactor standard equation">
                      {t('tdeeCalc.bmr.formulas.macrofactorStandard')}
                    </option>
                    <option value="Cunningham equation">
                      {t('tdeeCalc.bmr.formulas.cunningham')}
                    </option>
                    <option value="MacroFactor FFM equation">
                      {t('tdeeCalc.bmr.formulas.macrofactorFFM')}
                    </option>
                    <option value="MacroFactor athlete equation">
                      {t('tdeeCalc.bmr.formulas.macrofactorAthlete')}
                    </option>
                    <option value="Fitness Stuff Podcast equation">
                      {t('tdeeCalc.bmr.formulas.fitnessStuff')}
                    </option>
                  </select>

                  {/* Body fat — shown inline when formula requires it */}
                  {bmrFormula && requiresBodyFat(bmrFormula) && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                      <p className="text-sm font-medium text-neutral-700">
                        {t('tdeeCalc.bodyFat.title')}
                      </p>
                      {profileData?.body_fat_percentage && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setUseSavedBodyFat(true)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              useSavedBodyFat
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            {t('tdeeCalc.bodyFat.savedLabel')} {profileData.body_fat_percentage}%
                          </button>
                          <button
                            type="button"
                            onClick={() => setUseSavedBodyFat(false)}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              !useSavedBodyFat
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
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
                            className="w-full px-3 py-2 rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-medium"
                            placeholder={t('tdeeCalc.bodyFat.fieldLabel')}
                            min="3"
                            max="60"
                            step="0.1"
                          />
                          <p className="mt-1.5 text-xs text-neutral-500">
                            {t('tdeeCalc.bodyFat.fieldHint')}
                          </p>
                        </div>
                      )}
                      {!localBodyFat && (
                        <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <span className="text-amber-600 flex-shrink-0">⚠</span>
                          <p className="text-sm text-amber-800">
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
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      {t('tdeeCalc.pal.fieldLabel')} <span className="text-red-600">*</span>
                    </label>
                    {palSystem && (
                      <button
                        type="button"
                        onClick={() => setShowPALModal(true)}
                        className="text-sm text-primary-600 hover:text-primary-700 underline transition-colors"
                      >
                        {t('tdeeCalc.pal.factLink')}
                      </button>
                    )}
                  </div>
                  <select
                    value={palSystem}
                    onChange={e => setPalSystem(e.target.value as PALSystem | '')}
                    className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">{t('tdeeCalc.pal.placeholder')}</option>
                    <option value="Basic internet PAL values">
                      {translatePALSystem('Basic internet PAL values')}
                    </option>
                    <option value="FAO/WHO/UNU based PAL values">
                      {translatePALSystem('FAO/WHO/UNU based PAL values')}
                    </option>
                    <option value="DAMNRIPPED PAL values">
                      {translatePALSystem('DAMNRIPPED PAL values')}
                    </option>
                    <option value="Pro Physique PAL values">
                      {translatePALSystem('Pro Physique PAL values')}
                    </option>
                    <option value="Fitness Stuff PAL values">
                      {translatePALSystem('Fitness Stuff PAL values')}
                    </option>
                    <option value="Beräkna din aktivitetsnivå">
                      {t('tdeeCalc.pal.calculateLevel')}
                    </option>
                    <option value="Custom PAL">{translatePALSystem('Custom PAL')}</option>
                  </select>
                </div>

                {/* Show PAL table if system is selected */}
                {palSystem && (
                  <div className="mt-4">
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
            <Card className="border-2 border-primary-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span> {t('tdeeCalc.results.title')}
                </CardTitle>
                <CardDescription>{t('tdeeCalc.results.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Results Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* BMR Result */}
                  {bmr && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                      <p className="text-xs font-medium text-neutral-600 mb-1">
                        {t('tdeeCalc.results.bmrLabel')}
                      </p>
                      <p className="text-sm text-blue-600 font-semibold mb-2">BMR</p>
                      <p className="text-5xl font-bold text-blue-700 mb-1">{Math.round(bmr)}</p>
                      <p className="text-sm text-neutral-500">{t('tdeeCalc.results.kcalPerDay')}</p>
                      <p className="mt-3 text-xs text-neutral-500 border-t border-blue-200 pt-3">
                        {bmrFormula}
                      </p>
                    </div>
                  )}

                  {/* TDEE Result */}
                  {tdee && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                      <p className="text-xs font-medium text-neutral-600 mb-1">
                        {t('tdeeCalc.results.tdeeLabel')}
                      </p>
                      <p className="text-sm text-green-600 font-semibold mb-2">TDEE</p>
                      <p className="text-5xl font-bold text-green-700 mb-1">{Math.round(tdee)}</p>
                      <p className="text-sm text-neutral-500">{t('tdeeCalc.results.kcalPerDay')}</p>
                      <p className="mt-3 text-xs text-neutral-500 border-t border-green-200 pt-3">
                        {translatePALSystem(palSystem as PALSystem)}
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
    </div>
  )
}
