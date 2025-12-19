import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProfileData } from '@/hooks/useProfileData'
import { useUpdateProfile, useActiveProfile } from '@/hooks'
import { calculateBMRWithFormula, requiresBodyFat } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import type { PALSystem } from '@/lib/calculations/tdee'
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

export default function TDEECalculatorTool() {
  const navigate = useNavigate()
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
      activity_level: '',
      intensity_level: '',
      training_frequency_per_week: '',
      training_duration_minutes: '',
      daily_steps: '',
      custom_pal: '',
    },
  })

  // Watch form values
  const activityLevel = watch('activity_level')
  const intensityLevel = watch('intensity_level')
  const trainingFrequency = watch('training_frequency_per_week')
  const trainingDuration = watch('training_duration_minutes')
  const dailySteps = watch('daily_steps')
  const customPAL = watch('custom_pal')

  // Local state
  const [isSaving, setIsSaving] = useState(false)

  // Weight state (local override for calculator)
  const [localWeight, setLocalWeight] = useState(profileData?.weight_kg?.toString() || '')

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

    if (
      !weight ||
      !profileData?.height_cm ||
      !age ||
      !profileData?.gender ||
      !bmrFormula
    ) {
      return null
    }

    const calculatedBMR = calculateBMRWithFormula(bmrFormula, {
      gender: profileData.gender,
      age,
      weight,
      height: profileData.height_cm,
      bodyFatPercentage: profileData.body_fat_percentage,
    })

    // Validate BMR result
    if (!calculatedBMR || calculatedBMR <= 0) {
      return null
    }

    return calculatedBMR
  }, [profileData, age, bmrFormula, localWeight])

  // Beräkna TDEE
  const tdee = useMemo(() => {
    if (!bmr || !palSystem || !profileData?.gender) return null

    // Calculate TDEE using the selected PAL system and user's activity data
    const calculatedTDEE = calculateTDEE({
      bmr,
      palSystem: palSystem as PALSystem,
      activityLevel: activityLevel || 'Moderately active',
      gender: profileData.gender,
      intensityLevel: intensityLevel || undefined,
      trainingFrequencyPerWeek: trainingFrequency || undefined,
      trainingDurationMinutes: trainingDuration || undefined,
      dailySteps: dailySteps || undefined,
      customPAL: customPAL ? parseFloat(customPAL) : undefined,
    })

    // Validate TDEE result
    if (!calculatedTDEE || calculatedTDEE <= 0 || !isFinite(calculatedTDEE)) {
      return null
    }

    return calculatedTDEE
  }, [bmr, palSystem, activityLevel, intensityLevel, trainingFrequency, trainingDuration, dailySteps, customPAL, profileData?.gender])

  // Save TDEE to profile
  const handleSaveToProfile = async () => {
    if (!activeProfile || !bmr || !tdee) {
      toast.error('Kan inte spara: saknade data')
      return
    }

    // Check if TDEE already exists - show confirmation dialog
    if (activeProfile.tdee) {
      const confirmed = window.confirm(
        'Du har redan ett TDEE-värde sparat. Vill du skriva över det med den nya beräkningen?'
      )
      if (!confirmed) return
    }

    setIsSaving(true)

    try {
      // Create TDEE calculation snapshot
      const weightNum = localWeight ? parseFloat(localWeight) : profileData?.weight_kg
      const snapshot: TDEECalculationSnapshot = {
        weight_kg: weightNum,
        height_cm: profileData?.height_cm,
        age,
        gender: profileData?.gender,
        bmr_formula: bmrFormula,
        pal_system: palSystem as PALSystem,
        activity_level: activityLevel || 'Moderately active',
        intensity_level: intensityLevel || undefined,
        training_frequency_per_week: trainingFrequency || undefined,
        training_duration_minutes: trainingDuration || undefined,
        daily_steps: dailySteps || undefined,
        custom_pal: customPAL ? parseFloat(customPAL) : undefined,
        calculated_bmr: bmr,
        calculated_tdee: tdee,
      }

      await updateProfile.mutateAsync({
        profileId: activeProfile.id,
        data: {
          bmr,
          tdee,
          bmr_formula: bmrFormula,
          pal_system: palSystem as PALSystem,
          activity_level: activityLevel || 'Moderately active',
          intensity_level: intensityLevel || undefined,
          training_frequency_per_week: trainingFrequency || undefined,
          training_duration_minutes: trainingDuration || undefined,
          daily_steps: dailySteps || undefined,
          custom_pal: customPAL ? parseFloat(customPAL) : undefined,
          // Set weight_kg and initial_weight_kg
          weight_kg: weightNum,
          initial_weight_kg: activeProfile.initial_weight_kg || weightNum,
          // TDEE metadata
          tdee_calculated_at: new Date().toISOString(),
          tdee_source: 'tdee_calculator_tool',
          tdee_calculation_snapshot: snapshot,
        },
      })

      toast.success('TDEE har sparats till din profil!')

      // Navigate back to profile page
      setTimeout(() => {
        navigate('/app/profile')
      }, 1000)
    } catch (error) {
      console.error('Error saving TDEE:', error)
      toast.error('Kunde inte spara TDEE')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">TDEE & Kaloriuträknare</h2>
          <p className="text-neutral-600 mt-1">
            Beräkna ditt totala dagliga energibehov och kaloriintervall för dina mål
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          Energi & Metabol
        </Badge>
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      {/* Weight Input - Minimal Compact Design */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-900 mb-1.5">
              Vikt (kg) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={localWeight}
              onChange={e => setLocalWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-primary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-medium"
              placeholder="75"
              min="20"
              max="300"
              step="0.1"
            />
          </div>
          <div className="flex-1 text-xs text-neutral-600 leading-relaxed">
            Detta värde används för att beräkna BMR och TDEE. När du sparar till profil kommer detta att sparas som både din nuvarande vikt och startvikt.
          </div>
        </div>
      </div>

      {/* BMR Formula Selection */}
      <Card>
        <CardHeader>
          <CardTitle>BMR/RMR-formel</CardTitle>
          <CardDescription>Välj formel för att beräkna din basalmetabolism</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  BMR/RMR-formel <span className="text-red-600">*</span>
                </label>
                {bmrFormula && (
                  <button
                    type="button"
                    onClick={() => setShowBMRModal(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 underline transition-colors"
                  >
                    Fakta om denna formel
                  </button>
                )}
              </div>
              <select
                value={bmrFormula}
                onChange={e => setBmrFormula(e.target.value as BMRFormula | '')}
                className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Välj BMR/RMR-formel...</option>
                <option value="Mifflin-St Jeor equation">Mifflin-St Jeor (Rekommenderad)</option>
                <option value="Revised Harris-Benedict equation">Revised Harris-Benedict</option>
                <option value="Original Harris-Benedict equation">Original Harris-Benedict</option>
                <option value="Schofield equation">Schofield</option>
                <option value="Oxford/Henry equation">Oxford/Henry</option>
                <option value="MacroFactor standard equation">MacroFactor Standard</option>
                <option value="Cunningham equation">Cunningham (Kräver kroppsfett%)</option>
                <option value="MacroFactor FFM equation">
                  MacroFactor FFM (Kräver kroppsfett%)
                </option>
                <option value="MacroFactor athlete equation">
                  MacroFactor Athlete (Kräver kroppsfett%)
                </option>
                <option value="Fitness Stuff Podcast equation">
                  Fitness Stuff Podcast (Kräver kroppsfett%)
                </option>
              </select>

              {/* Warning if body fat required */}
              {bmrFormula && requiresBodyFat(bmrFormula) && !profileData?.body_fat_percentage && (
                <div className="mt-3 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-xl text-amber-600 flex-shrink-0">⚠</span>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Denna formel kräver kroppsfettprocent. Vänligen fyll i kroppsfettprocent i din profil.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PAL System Selection */}
      <Card>
        <CardHeader>
          <CardTitle>PAL-system (Aktivitetsnivå)</CardTitle>
          <CardDescription>Välj system för att beräkna din fysiska aktivitetsnivå</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  PAL-system <span className="text-red-600">*</span>
                </label>
                {palSystem && (
                  <button
                    type="button"
                    onClick={() => setShowPALModal(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 underline transition-colors"
                  >
                    Fakta om detta PAL-system
                  </button>
                )}
              </div>
              <select
                value={palSystem}
                onChange={e => setPalSystem(e.target.value as PALSystem | '')}
                className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Välj PAL-system...</option>
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
                <option value="Basic internet PAL values">
                  {translatePALSystem('Basic internet PAL values')}
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
              <span className="text-2xl">📊</span> Dina Resultat
            </CardTitle>
            <CardDescription>Basalmetabolism och total daglig energiförbrukning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Results Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* BMR Result */}
              {bmr && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                  <p className="text-xs font-medium text-neutral-600 mb-1">BASALMETABOLISM</p>
                  <p className="text-sm text-blue-600 font-semibold mb-2">BMR</p>
                  <p className="text-5xl font-bold text-blue-700 mb-1">{Math.round(bmr)}</p>
                  <p className="text-sm text-neutral-500">kcal/dag</p>
                  <p className="mt-3 text-xs text-neutral-500 border-t border-blue-200 pt-3">
                    {bmrFormula}
                  </p>
                </div>
              )}

              {/* TDEE Result */}
              {tdee && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <p className="text-xs font-medium text-neutral-600 mb-1">TOTAL ENERGIFÖRBRUKNING</p>
                  <p className="text-sm text-green-600 font-semibold mb-2">TDEE</p>
                  <p className="text-5xl font-bold text-green-700 mb-1">{Math.round(tdee)}</p>
                  <p className="text-sm text-neutral-500">kcal/dag</p>
                  <p className="mt-3 text-xs text-neutral-500 border-t border-green-200 pt-3">
                    {translatePALSystem(palSystem as PALSystem)}
                    {activityLevel && ` · ${activityLevel}`}
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
                {isSaving ? 'Sparar...' : 'Lägg till i profilkort'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
    </div>
  )
}
