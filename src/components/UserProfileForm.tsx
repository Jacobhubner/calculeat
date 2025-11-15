import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { Button } from './ui/button'
import { calculateBMR, requiresBodyFat } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'
import { calculateTDEE } from '@/lib/calculations/tdee'
import type { PALSystem } from '@/lib/calculations/tdee'
import type { Gender, BMRFormula } from '@/lib/types'
import PALTableContainer from './calculator/PALTableContainer'
import BMRFormulaModal from './calculator/BMRFormulaModal'
import EnergyGoalReferenceTable from './calculator/EnergyGoalReferenceTable'
import { useAuth } from '@/contexts/AuthContext'
import { translatePALSystem } from '@/lib/translations'

interface CalculatorResult {
  bmr: number
  tdee: number
  tdeeMin: number
  tdeeMax: number
}

type EnergyGoal = 'Maintain weight' | 'Weight gain' | 'Weight loss' | 'Custom TDEE' | ''
type DeficitLevel = '10-15%' | '20-25%' | '25-30%' | ''

export default function UserProfileForm() {
  const { profile, updateProfile } = useAuth()

  // Load initial values from profile
  const [profileName, setProfileName] = useState(profile?.profile_name || '')
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '')
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() || '')
  const [height, setHeight] = useState(profile?.height_cm?.toString() || '')
  const [gender, setGender] = useState<Gender | ''>(profile?.gender || '')
  const [bodyFatPercentage, setBodyFatPercentage] = useState(
    profile?.body_fat_percentage?.toString() || ''
  )
  const [bmrFormula, setBmrFormula] = useState<BMRFormula | ''>(
    (profile?.bmr_formula as BMRFormula) || ''
  )
  const [palSystem, setPalSystem] = useState<PALSystem | ''>(
    (profile?.pal_system as PALSystem) || ''
  )
  const [energyGoal, setEnergyGoal] = useState<EnergyGoal>('')
  const [deficitLevel, setDeficitLevel] = useState<DeficitLevel>('')
  const [customTdee, setCustomTdee] = useState('')

  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [showBMRModal, setShowBMRModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Create a form data object for PAL table
  const formData = useMemo(() => {
    return {
      pal_system: palSystem,
      activity_level: profile?.activity_level,
      intensity_level: profile?.intensity_level,
      training_frequency_per_week: profile?.training_frequency_per_week,
      training_duration_minutes: profile?.training_duration_minutes,
      daily_steps: profile?.daily_steps,
      custom_pal: profile?.custom_pal,
    }
  }, [palSystem, profile])

  // Dummy register function for PAL table
  const register = (name: string) => {
    return {
      name,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // This is a simplified implementation - the actual PAL values
        // will be used when calculating on save
        console.log('Field changed:', name, e.target.value)
      },
    }
  }

  const watch = (name?: string) => {
    if (!name) return formData
    return formData[name as keyof typeof formData]
  }

  const handleCalculate = () => {
    // Validate inputs
    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height)
    const bodyFatNum = bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined
    const customTdeeNum = customTdee ? parseFloat(customTdee) : undefined

    if (!profileName) {
      alert('Vänligen ange ett profilnamn')
      return
    }

    if (!energyGoal) {
      alert('Vänligen välj ett energimål')
      return
    }

    // For Custom TDEE, only validate TDEE input
    if (energyGoal === 'Custom TDEE') {
      if (!customTdeeNum || customTdeeNum < 500 || customTdeeNum > 10000) {
        alert('Vänligen ange ett giltigt TDEE-värde (500-10000 kcal)')
        return
      }

      // Calculate ±3% range
      const tdeeMin = Math.round(customTdeeNum * 0.97)
      const tdeeMax = Math.round(customTdeeNum * 1.03)

      setResult({
        bmr: 0, // Will display as N/A
        tdee: Math.round(customTdeeNum),
        tdeeMin,
        tdeeMax,
      })
      return
    }

    // For other goals, validate all fields
    if (!birthDate) {
      alert('Vänligen ange ditt födelsedatum')
      return
    }

    if (!weightNum || !heightNum || !gender || !bmrFormula || !palSystem) {
      alert('Vänligen fyll i alla obligatoriska fält')
      return
    }

    if (energyGoal === 'Weight loss' && !deficitLevel) {
      alert('Vänligen välj en viktnedgångstakt')
      return
    }

    if (weightNum < 20 || weightNum > 300) {
      alert('Vikt måste vara mellan 20 och 300 kg')
      return
    }

    if (heightNum < 100 || heightNum > 250) {
      alert('Längd måste vara mellan 100 och 250 cm')
      return
    }

    // Check if body fat is required but not provided
    if (requiresBodyFat(bmrFormula) && !bodyFatNum) {
      alert('Denna BMR-formel kräver kroppsfettprocent. Vänligen fyll i kroppsfettprocent.')
      return
    }

    // Calculate age from birth date
    const age = calculateAge(birthDate)

    if (age < 1 || age > 120) {
      alert('Ålder måste vara mellan 1 och 120 år')
      return
    }

    // Calculate BMR
    const bmr = calculateBMR(bmrFormula, {
      gender,
      age,
      weight: weightNum,
      height: heightNum,
      bodyFatPercentage: bodyFatNum,
    })

    if (!bmr) {
      alert('Det gick inte att beräkna BMR. Kontrollera dina värden.')
      return
    }

    // Calculate TDEE using the selected PAL system and user's activity data
    const baseTdee = calculateTDEE({
      bmr,
      palSystem: palSystem as PALSystem,
      activityLevel: profile?.activity_level || 'Moderately active',
      gender,
      intensityLevel: profile?.intensity_level,
      trainingFrequencyPerWeek: profile?.training_frequency_per_week,
      trainingDurationMinutes: profile?.training_duration_minutes,
      dailySteps: profile?.daily_steps,
      customPAL: profile?.custom_pal,
    })

    // Calculate TDEE range based on energy goal
    let tdeeMin = baseTdee
    let tdeeMax = baseTdee

    if (energyGoal === 'Maintain weight') {
      // ±3% range for maintain weight
      tdeeMin = Math.round(baseTdee * 0.97)
      tdeeMax = Math.round(baseTdee * 1.03)
    } else if (energyGoal === 'Weight loss') {
      if (deficitLevel === '10-15%') {
        tdeeMin = Math.round(baseTdee * 0.85)
        tdeeMax = Math.round(baseTdee * 0.9)
      } else if (deficitLevel === '20-25%') {
        tdeeMin = Math.round(baseTdee * 0.75)
        tdeeMax = Math.round(baseTdee * 0.8)
      } else if (deficitLevel === '25-30%') {
        tdeeMin = Math.round(baseTdee * 0.7)
        tdeeMax = Math.round(baseTdee * 0.75)
      }
    } else if (energyGoal === 'Weight gain') {
      // Weight gain 10-20%
      tdeeMin = Math.round(baseTdee * 1.1)
      tdeeMax = Math.round(baseTdee * 1.2)
    }

    setResult({
      bmr: Math.round(bmr),
      tdee: baseTdee,
      tdeeMin,
      tdeeMax,
    })
  }

  const handleSave = async () => {
    if (!result) {
      alert('Vänligen beräkna dina värden först')
      return
    }

    setIsSaving(true)
    try {
      const weightNum = parseFloat(weight)
      const heightNum = parseFloat(height)
      const bodyFatNum = bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined

      await updateProfile({
        profile_name: profileName,
        birth_date: birthDate,
        gender: gender === '' ? undefined : gender,
        weight_kg: weightNum,
        height_cm: heightNum,
        body_fat_percentage: bodyFatNum,
        bmr_formula: bmrFormula === '' ? undefined : bmrFormula,
        pal_system: palSystem === '' ? undefined : palSystem,
        bmr: result.bmr,
        tdee: result.tdee,
      })
      alert('Profil sparad!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Fel vid sparande av profil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* SECTION 1: Profile Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Profilnamn *</label>
          <input
            type="text"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Mitt namn"
          />
        </div>

        {/* SECTION 2: Basic Information */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">Grundläggande information</h3>

          {/* Birth Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Födelsedatum *
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Gender Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Kön *</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={e => setGender(e.target.value as Gender | '')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-neutral-700">Man</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={e => setGender(e.target.value as Gender | '')}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-neutral-700">Kvinna</span>
              </label>
            </div>
          </div>

          {/* Height */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Längd (cm) *</label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="180"
              min="100"
              max="250"
            />
          </div>

          {/* Weight */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Vikt (kg) *</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="75"
              min="20"
              max="300"
              step="0.1"
            />
          </div>

          {/* Body Fat Percentage */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kroppsfettprocent (%) {bmrFormula && requiresBodyFat(bmrFormula) && '*'}
            </label>
            <input
              type="number"
              value={bodyFatPercentage}
              onChange={e => setBodyFatPercentage(e.target.value)}
              className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="15"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        {/* SECTION 3: BMR Formula */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">BMR-formel</h3>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-neutral-700">BMR-formel *</label>
              {bmrFormula && (
                <button
                  type="button"
                  onClick={() => setShowBMRModal(true)}
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                  aria-label="Visa information om formeln"
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={bmrFormula}
              onChange={e => setBmrFormula(e.target.value as BMRFormula | '')}
              className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Välj BMR-formel...</option>
              <option value="Mifflin-St Jeor equation">Mifflin-St Jeor (Rekommenderad)</option>
              <option value="Revised Harris-Benedict equation">Revised Harris-Benedict</option>
              <option value="Original Harris-Benedict equation">Original Harris-Benedict</option>
              <option value="Schofield equation">Schofield</option>
              <option value="Oxford/Henry equation">Oxford/Henry</option>
              <option value="MacroFactor standard equation">MacroFactor Standard</option>
              <option value="Cunningham equation">Cunningham (Kräver kroppsfett%)</option>
              <option value="MacroFactor FFM equation">MacroFactor FFM (Kräver kroppsfett%)</option>
              <option value="MacroFactor athlete equation">
                MacroFactor Athlete (Kräver kroppsfett%)
              </option>
              <option value="Fitness Stuff Podcast equation">
                Fitness Stuff Podcast (Kräver kroppsfett%)
              </option>
            </select>

            {/* Warning if body fat required */}
            {bmrFormula && requiresBodyFat(bmrFormula) && !bodyFatPercentage && (
              <div className="mt-3 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                  Denna formel kräver kroppsfettprocent. Vänligen fyll i kroppsfettprocent ovan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: PAL System */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">
            PAL-system (Aktivitetsnivå)
          </h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">PAL-system *</label>
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
                register={
                  register as unknown as Parameters<typeof PALTableContainer>[0]['register']
                }
                watch={watch as unknown as Parameters<typeof PALTableContainer>[0]['watch']}
              />
            </div>
          )}
        </div>

        {/* SECTION 5: Energy Goal */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">Energimål</h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Energimål *</label>
            <select
              value={energyGoal}
              onChange={e => setEnergyGoal(e.target.value as EnergyGoal)}
              className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Välj energimål...</option>
              <option value="Maintain weight">Behåll vikt</option>
              <option value="Weight gain">Viktuppgång (10–20%)</option>
              <option value="Weight loss">Viktnedgång</option>
              <option value="Custom TDEE">Anpassat TDEE-värde</option>
            </select>
          </div>

          {/* Show custom TDEE input */}
          {energyGoal === 'Custom TDEE' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                TDEE-värde (kcal) *
              </label>
              <input
                type="number"
                value={customTdee}
                onChange={e => setCustomTdee(e.target.value)}
                className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="2500"
                min="500"
                max="10000"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Ange ditt eget TDEE-värde direkt (hoppar över BMR/PAL beräkningar)
              </p>
            </div>
          )}

          {/* Show deficit level for weight loss */}
          {energyGoal === 'Weight loss' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Viktnedgångstakt *
              </label>
              <select
                value={deficitLevel}
                onChange={e => setDeficitLevel(e.target.value as DeficitLevel)}
                className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Välj viktnedgångstakt...</option>
                <option value="10-15%">Litet underskott (10–15%)</option>
                <option value="20-25%">Måttligt underskott (20–25%)</option>
                <option value="25-30%">Stort underskott (25–30%)</option>
              </select>
            </div>
          )}

          {/* Energy Goal Reference Table */}
          {result && (
            <EnergyGoalReferenceTable
              tdee={result.tdee}
              selectedGoal={energyGoal}
              selectedDeficit={deficitLevel}
            />
          )}
        </div>

        {/* Calculate Button */}
        <div className="border-t pt-6">
          <Button onClick={handleCalculate} className="w-full">
            Beräkna
          </Button>
        </div>

        {/* SECTION 6: Results */}
        {result && (
          <div className="mt-6 rounded-2xl border border-lime-200 bg-lime-50 p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">Dina resultat</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-primary-50 p-4 border border-primary-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  BMR <span className="text-xs">(kcal/dag i vila)</span>
                </p>
                <p className="text-3xl font-bold text-primary-600">
                  {result.bmr === 0 ? 'N/A' : `${result.bmr} kcal`}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Basal Metabolic Rate</p>
              </div>

              <div className="rounded-xl bg-accent-50 p-4 border border-accent-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  TDEE <span className="text-xs">(kcal/dag totalt)</span>
                </p>
                <p className="text-3xl font-bold text-accent-600">
                  {energyGoal === 'Maintain weight' || energyGoal === 'Custom TDEE'
                    ? `${result.tdeeMin} - ${result.tdeeMax} kcal `
                    : result.tdeeMin === result.tdeeMax
                      ? `${result.tdee} kcal`
                      : `${result.tdeeMin} - ${result.tdeeMax} kcal `}
                  {(energyGoal === 'Maintain weight' || energyGoal === 'Custom TDEE') && (
                    <span className="text-xl text-accent-500">({result.tdee} kcal)</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Total Daily Energy Expenditure</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6">
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? 'Sparar...' : 'Spara profil'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* BMR Formula Modal */}
      {bmrFormula && (
        <BMRFormulaModal
          formula={bmrFormula}
          isOpen={showBMRModal}
          onClose={() => setShowBMRModal(false)}
        />
      )}
    </div>
  )
}
