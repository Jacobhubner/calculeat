import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { calculateBMR, requiresBodyFat } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'
import { calculateTDEE } from '@/lib/calculations/tdee'
import type { PALSystem } from '@/lib/calculations/tdee'
import type { Gender, BMRFormula } from '@/lib/types'
import PALTableContainer from './calculator/PALTableContainer'
import BMRFormulaModal from './calculator/BMRFormulaModal'
import PALSystemModal from './calculator/PALSystemModal'
import EnergyGoalReferenceTable from './calculator/EnergyGoalReferenceTable'
import { useAuth } from '@/contexts/AuthContext'
import { translatePALSystem } from '@/lib/translations'
import { useProfileStore } from '@/stores/profileStore'
import { useUpdateProfile, useCreateProfile, useProfiles } from '@/hooks'
import { Lock } from 'lucide-react'
import FloatingProfileSaveCard from './FloatingProfileSaveCard'
import { ProfileFormSkeleton } from './ProfileFormSkeleton'

interface CalculatorResult {
  bmr: number
  tdee: number
  tdeeMin: number
  tdeeMax: number
}

type EnergyGoal = 'Maintain weight' | 'Weight gain' | 'Weight loss' | 'Custom TDEE' | ''
type DeficitLevel = '10-15%' | '20-25%' | '25-30%' | ''

interface MacroRanges {
  fatMin: number
  fatMax: number
  carbMin: number
  carbMax: number
  proteinMin: number
  proteinMax: number
}

interface MealSettings {
  meals: Array<{
    name: string
    percentage: number
  }>
}

interface UserProfileFormProps {
  onResultChange?: (result: CalculatorResult | null) => void
  macroRanges?: MacroRanges | null
  mealSettings?: MealSettings | null
  onBodyFatChange?: (bodyFat: string) => void
}

export default function UserProfileForm({
  onResultChange,
  macroRanges,
  mealSettings,
  onBodyFatChange,
}: UserProfileFormProps = {}) {
  const { profile } = useAuth() // Keep for backward compatibility during transition
  const activeProfile = useProfileStore(state => state.activeProfile)
  const previousProfile = useProfileStore(state => state.previousProfile)
  const { data: allProfiles = [] } = useProfiles()
  const updateProfileMutation = useUpdateProfile()
  const createProfileMutation = useCreateProfile()

  // Use activeProfile from store if available, fallback to old profile
  const currentProfile = activeProfile || profile

  // Determine if birth date, gender and height should be locked
  // These can ONLY be edited if you have exactly ONE profile
  const canEditLockedFields = useMemo(() => {
    // If creating new profile (activeProfile is null), lock the fields
    if (!activeProfile && allProfiles.length > 0) return false

    // If exactly ONE profile exists, allow editing
    if (allProfiles && allProfiles.length === 1) return true

    // If no profiles (new user), allow editing
    if (!allProfiles || allProfiles.length === 0) return true

    // If more than one profile, lock the fields
    return false
  }, [allProfiles, activeProfile])

  // Load initial values from profile
  const [profileName, setProfileName] = useState(currentProfile?.profile_name || '')
  const [birthDate, setBirthDate] = useState(currentProfile?.birth_date || '')

  // Parse birth date into day, month, year for dropdowns
  const parsedDate = birthDate ? new Date(birthDate) : null
  const [birthDay, setBirthDay] = useState(parsedDate?.getDate().toString() || '')
  const [birthMonth, setBirthMonth] = useState(
    parsedDate ? (parsedDate.getMonth() + 1).toString() : ''
  )
  const [birthYear, setBirthYear] = useState(parsedDate?.getFullYear().toString() || '')

  const [weight, setWeight] = useState(currentProfile?.weight_kg?.toString() || '')
  const [height, setHeight] = useState(currentProfile?.height_cm?.toString() || '')
  const [gender, setGender] = useState<Gender | ''>(currentProfile?.gender || '')
  const [bodyFatPercentage, setBodyFatPercentage] = useState(
    currentProfile?.body_fat_percentage?.toString() || ''
  )
  const [bmrFormula, setBmrFormula] = useState<BMRFormula | ''>(
    (currentProfile?.bmr_formula as BMRFormula) || ''
  )
  const [palSystem, setPalSystem] = useState<PALSystem | ''>(
    (currentProfile?.pal_system as PALSystem) || ''
  )
  const [energyGoal, setEnergyGoal] = useState<EnergyGoal>('Maintain weight')
  const [deficitLevel, setDeficitLevel] = useState<DeficitLevel>('')
  const [customTdee, setCustomTdee] = useState('')

  // PAL-related state variables for real-time tracking
  const [activityLevel, setActivityLevel] = useState(currentProfile?.activity_level || '')
  const [intensityLevel, setIntensityLevel] = useState(currentProfile?.intensity_level || '')
  const [trainingFrequency, setTrainingFrequency] = useState(
    currentProfile?.training_frequency_per_week || ''
  )
  const [trainingDuration, setTrainingDuration] = useState(
    currentProfile?.training_duration_minutes || ''
  )
  const [dailySteps, setDailySteps] = useState(currentProfile?.daily_steps || '')
  const [customPAL, setCustomPAL] = useState(currentProfile?.custom_pal?.toString() || '')

  const [result, setResultState] = useState<CalculatorResult | null>(null)
  const [showBMRModal, setShowBMRModal] = useState(false)
  const [showPALModal, setShowPALModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Wrapper to update both local state and notify parent
  const setResult = useCallback(
    (newResult: CalculatorResult | null) => {
      setResultState(newResult)
      onResultChange?.(newResult)
    },
    [onResultChange]
  )

  // Notify parent when body fat percentage changes
  useEffect(() => {
    onBodyFatChange?.(bodyFatPercentage)
  }, [bodyFatPercentage, onBodyFatChange])

  // Sync birth date dropdowns when birthDate changes
  useEffect(() => {
    if (birthDate) {
      const date = new Date(birthDate)
      setBirthDay(date.getDate().toString())
      setBirthMonth((date.getMonth() + 1).toString())
      setBirthYear(date.getFullYear().toString())
    } else {
      setBirthDay('')
      setBirthMonth('')
      setBirthYear('')
    }
  }, [birthDate])

  // Sync form fields when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      // IMPORTANT: Wait for full profile data from Supabase before loading
      // activeProfile from store might only have {id, profile_name} after page refresh
      // We need to find the complete profile data from allProfiles array
      const fullProfile = allProfiles.find(p => p.id === activeProfile.id)

      // Only load if we have complete profile data
      if (!fullProfile) {
        // Data is still loading from Supabase, wait
        return
      }

      // Load existing profile data from the complete profile object
      setProfileName(fullProfile.profile_name || '')
      setBirthDate(fullProfile.birth_date || '')
      setWeight(fullProfile.weight_kg?.toString() || '')
      setHeight(fullProfile.height_cm?.toString() || '')
      setGender(fullProfile.gender || '')
      setBodyFatPercentage(fullProfile.body_fat_percentage?.toString() || '')
      setBmrFormula((fullProfile.bmr_formula as BMRFormula) || '')
      setPalSystem((fullProfile.pal_system as PALSystem) || '')
      setActivityLevel(fullProfile.activity_level || '')
      setIntensityLevel(fullProfile.intensity_level || '')
      setTrainingFrequency(fullProfile.training_frequency_per_week?.toString() || '')
      setTrainingDuration(fullProfile.training_duration_minutes?.toString() || '')
      setDailySteps(fullProfile.daily_steps || '')
      setCustomPAL(fullProfile.custom_pal?.toString() || '')

      if (fullProfile.calorie_goal) {
        setEnergyGoal(fullProfile.calorie_goal as EnergyGoal)
      }
      if (fullProfile.deficit_level) {
        setDeficitLevel(fullProfile.deficit_level as DeficitLevel)
      }
      if (fullProfile.custom_tdee) {
        setCustomTdee(fullProfile.custom_tdee.toString())
      }
    } else if (activeProfile === null && allProfiles.length > 0) {
      // New profile mode - copy all fields from previously viewed profile
      // Use previousProfile if available, otherwise use first profile
      const sourceProfile =
        previousProfile ||
        [...allProfiles].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateA - dateB
        })[0]

      if (!sourceProfile) {
        // No valid profile to copy from, just reset
        return
      }

      // Copy all editable fields from source profile
      setProfileName('')
      setWeight(sourceProfile.weight_kg?.toString() || '')
      setBodyFatPercentage(sourceProfile.body_fat_percentage?.toString() || '')
      setBmrFormula((sourceProfile.bmr_formula as BMRFormula) || '')
      setPalSystem((sourceProfile.pal_system as PALSystem) || '')
      setActivityLevel(sourceProfile.activity_level || '')
      setIntensityLevel(sourceProfile.intensity_level || '')
      setTrainingFrequency(sourceProfile.training_frequency_per_week?.toString() || '')
      setTrainingDuration(sourceProfile.training_duration_minutes?.toString() || '')
      setDailySteps(sourceProfile.daily_steps || '')
      setCustomPAL(sourceProfile.custom_pal?.toString() || '')

      if (sourceProfile.calorie_goal) {
        setEnergyGoal(sourceProfile.calorie_goal as EnergyGoal)
      } else {
        setEnergyGoal('Maintain weight')
      }
      if (sourceProfile.deficit_level) {
        setDeficitLevel(sourceProfile.deficit_level as DeficitLevel)
      } else {
        setDeficitLevel('')
      }
      if (sourceProfile.custom_tdee) {
        setCustomTdee(sourceProfile.custom_tdee.toString())
      } else {
        setCustomTdee('')
      }

      setResult(null) // Clear results

      // Keep locked fields from source profile (birth date, gender, height)
      setBirthDate(sourceProfile.birth_date || '')
      setGender(sourceProfile.gender || '')
      setHeight(sourceProfile.height_cm?.toString() || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id, allProfiles])

  // Create a form data object for PAL table with current state values
  const formData = useMemo(() => {
    return {
      pal_system: palSystem,
      activity_level: activityLevel,
      intensity_level: intensityLevel,
      training_frequency_per_week: trainingFrequency,
      training_duration_minutes: trainingDuration,
      daily_steps: dailySteps,
      custom_pal: customPAL ? parseFloat(customPAL) : undefined,
    }
  }, [
    palSystem,
    activityLevel,
    intensityLevel,
    trainingFrequency,
    trainingDuration,
    dailySteps,
    customPAL,
  ])

  // Check if there are unsaved changes compared to the saved profile
  const hasUnsavedChanges = useMemo(() => {
    // If no active profile, we're creating a new profile - show save card if we have results
    if (!activeProfile) {
      return !!result
    }

    // Get the full profile data from allProfiles
    const fullProfile = allProfiles.find(p => p.id === activeProfile.id)
    if (!fullProfile) {
      // Still loading, no changes yet
      return false
    }

    // Compare current form values with saved profile values
    const hasProfileNameChange = profileName !== (fullProfile.profile_name || '')
    const hasWeightChange = weight !== (fullProfile.weight_kg?.toString() || '')
    const hasBodyFatChange =
      bodyFatPercentage !== (fullProfile.body_fat_percentage?.toString() || '')
    const hasBmrFormulaChange = bmrFormula !== (fullProfile.bmr_formula || '')
    const hasPalSystemChange = palSystem !== (fullProfile.pal_system || '')
    const hasActivityLevelChange = activityLevel !== (fullProfile.activity_level || '')
    const hasIntensityLevelChange = intensityLevel !== (fullProfile.intensity_level || '')
    const hasTrainingFreqChange =
      trainingFrequency !== (fullProfile.training_frequency_per_week || '')
    const hasTrainingDurChange = trainingDuration !== (fullProfile.training_duration_minutes || '')
    const hasDailyStepsChange = dailySteps !== (fullProfile.daily_steps || '')
    const hasCustomPALChange = customPAL !== (fullProfile.custom_pal?.toString() || '')
    const hasEnergyGoalChange = energyGoal !== (fullProfile.calorie_goal || '')
    const hasDeficitLevelChange = deficitLevel !== (fullProfile.deficit_level || '')
    const hasCustomTdeeChange = customTdee !== (fullProfile.custom_tdee?.toString() || '')

    // Also check if calculated results have changed (e.g., from PAL system activity level changes)
    const hasResultChange =
      result &&
      (Math.abs((result.tdee || 0) - (fullProfile.tdee || 0)) > 1 ||
        Math.abs((result.bmr || 0) - (fullProfile.bmr || 0)) > 1)

    // Check if macro distribution has changed
    const hasMacroChange =
      macroRanges &&
      (macroRanges.fatMin !== fullProfile.fat_min_percent ||
        macroRanges.fatMax !== fullProfile.fat_max_percent ||
        macroRanges.carbMin !== fullProfile.carb_min_percent ||
        macroRanges.carbMax !== fullProfile.carb_max_percent ||
        macroRanges.proteinMin !== fullProfile.protein_min_percent ||
        macroRanges.proteinMax !== fullProfile.protein_max_percent)

    // Check if meal settings have changed
    const hasMealSettingsChange =
      mealSettings && JSON.stringify(mealSettings) !== JSON.stringify(fullProfile.meals_config)

    return (
      hasProfileNameChange ||
      hasWeightChange ||
      hasBodyFatChange ||
      hasBmrFormulaChange ||
      hasPalSystemChange ||
      hasActivityLevelChange ||
      hasIntensityLevelChange ||
      hasTrainingFreqChange ||
      hasTrainingDurChange ||
      hasDailyStepsChange ||
      hasCustomPALChange ||
      hasEnergyGoalChange ||
      hasDeficitLevelChange ||
      hasCustomTdeeChange ||
      hasResultChange ||
      hasMacroChange ||
      hasMealSettingsChange
    )
  }, [
    activeProfile,
    allProfiles,
    profileName,
    weight,
    bodyFatPercentage,
    bmrFormula,
    palSystem,
    activityLevel,
    intensityLevel,
    trainingFrequency,
    trainingDuration,
    dailySteps,
    customPAL,
    energyGoal,
    deficitLevel,
    customTdee,
    result,
    macroRanges,
    mealSettings,
  ])

  // Register function for PAL table - updates state in real-time
  const register = (name: string) => {
    // Get current value from state
    let currentValue = ''
    switch (name) {
      case 'activity_level':
        currentValue = activityLevel
        break
      case 'intensity_level':
        currentValue = intensityLevel
        break
      case 'training_frequency_per_week':
        currentValue = trainingFrequency
        break
      case 'training_duration_minutes':
        currentValue = trainingDuration
        break
      case 'daily_steps':
        currentValue = dailySteps
        break
      case 'custom_pal':
        currentValue = customPAL
        break
    }

    return {
      name,
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value

        switch (name) {
          case 'activity_level':
            setActivityLevel(value)
            break
          case 'intensity_level':
            setIntensityLevel(value)
            break
          case 'training_frequency_per_week':
            setTrainingFrequency(value)
            break
          case 'training_duration_minutes':
            setTrainingDuration(value)
            break
          case 'daily_steps':
            setDailySteps(value)
            break
          case 'custom_pal':
            setCustomPAL(value)
            break
        }
      },
    }
  }

  // Handler for birth date dropdowns - combines day/month/year into ISO format
  const handleBirthDateChange = (day: string, month: string, year: string) => {
    if (day && month && year) {
      // Validate date
      const dayNum = parseInt(day)
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)

      // Check if date is valid
      const date = new Date(yearNum, monthNum - 1, dayNum)
      if (
        date.getDate() === dayNum &&
        date.getMonth() === monthNum - 1 &&
        date.getFullYear() === yearNum
      ) {
        // Valid date - format as ISO string (YYYY-MM-DD)
        const isoDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`
        setBirthDate(isoDate)
      }
    } else {
      // If any field is empty, clear birthDate
      setBirthDate('')
    }
  }

  const handleDayChange = (value: string) => {
    setBirthDay(value)
    handleBirthDateChange(value, birthMonth, birthYear)
  }

  const handleMonthChange = (value: string) => {
    setBirthMonth(value)
    handleBirthDateChange(birthDay, value, birthYear)
  }

  const handleYearChange = (value: string) => {
    setBirthYear(value)
    handleBirthDateChange(birthDay, birthMonth, value)
  }

  // Watch function - returns current state values
  const watch = (name?: string) => {
    if (!name) return formData
    return formData[name as keyof typeof formData]
  }

  const handleCalculate = useCallback(() => {
    // Validate inputs
    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height)
    const bodyFatNum = bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined
    const customTdeeNum = customTdee ? parseFloat(customTdee) : undefined

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

    if (
      !weightNum ||
      !heightNum ||
      (gender !== 'male' && gender !== 'female') ||
      !bmrFormula ||
      !palSystem
    ) {
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
      activityLevel: activityLevel || 'Moderately active',
      gender,
      intensityLevel: intensityLevel || undefined,
      trainingFrequencyPerWeek: trainingFrequency || undefined,
      trainingDurationMinutes: trainingDuration || undefined,
      dailySteps: dailySteps || undefined,
      customPAL: customPAL ? parseFloat(customPAL) : undefined,
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
  }, [
    energyGoal,
    customTdee,
    birthDate,
    weight,
    height,
    gender,
    bmrFormula,
    palSystem,
    activityLevel,
    customPAL,
    deficitLevel,
    bodyFatPercentage,
    intensityLevel,
    trainingFrequency,
    trainingDuration,
    dailySteps,
    setResult,
  ])

  // Auto-calculate when all required fields are filled
  useEffect(() => {
    // Check if all required fields are filled based on energy goal
    if (!energyGoal) {
      return
    }

    // For Custom TDEE, only need customTdee
    if (energyGoal === 'Custom TDEE') {
      const customTdeeNum = customTdee ? parseFloat(customTdee) : 0
      if (customTdeeNum >= 500 && customTdeeNum <= 10000) {
        handleCalculate()
      }
      return
    }

    // For other goals, need all basic fields
    const weightNum = weight ? parseFloat(weight) : 0
    const heightNum = height ? parseFloat(height) : 0

    if (
      !birthDate ||
      !weight ||
      !height ||
      (gender !== 'male' && gender !== 'female') ||
      !bmrFormula ||
      !palSystem
    ) {
      return
    }

    // Validate numeric ranges before triggering calculation
    if (weightNum < 20 || weightNum > 300 || heightNum < 100 || heightNum > 250) {
      return
    }

    // For PAL-based calculations, check required fields based on specific PAL system
    if (palSystem === 'Custom PAL') {
      // Custom PAL only requires the custom PAL value
      if (!customPAL) {
        return
      }
    } else if (palSystem === 'DAMNRIPPED PAL values') {
      // DAMNRIPPED requires activity level and intensity level
      if (!activityLevel || !intensityLevel) {
        return
      }
    } else if (palSystem === 'Pro Physique PAL values') {
      // Pro Physique requires activity level, intensity level, frequency and duration
      if (!activityLevel || !intensityLevel || !trainingFrequency || !trainingDuration) {
        return
      }
    } else if (palSystem === 'Fitness Stuff PAL values') {
      // Fitness Stuff requires training frequency, duration, and daily steps
      if (!trainingFrequency || !trainingDuration || !dailySteps) {
        return
      }
    } else {
      // FAO/WHO/UNU and Basic Internet only need activity level
      if (!activityLevel) {
        return
      }
    }

    // For Weight loss, also need deficit level
    if (energyGoal === 'Weight loss' && !deficitLevel) {
      return
    }

    // Trigger calculation
    handleCalculate()
  }, [
    handleCalculate,
    profileName,
    birthDate,
    weight,
    height,
    gender,
    bmrFormula,
    palSystem,
    energyGoal,
    deficitLevel,
    customTdee,
    bodyFatPercentage,
    activityLevel,
    intensityLevel,
    trainingFrequency,
    trainingDuration,
    dailySteps,
    customPAL,
  ])

  const handleSave = async () => {
    if (!result) {
      alert('Vänligen beräkna dina värden först')
      return
    }

    if (!profileName) {
      alert('Vänligen ange ett profilnamn för att spara')
      return
    }

    setIsSaving(true)
    try {
      const weightNum = parseFloat(weight)
      const heightNum = parseFloat(height)
      const bodyFatNum = bodyFatPercentage ? parseFloat(bodyFatPercentage) : null
      const customTdeeNum = customTdee ? parseFloat(customTdee) : null
      const trainingFreqNum = trainingFrequency ? parseFloat(trainingFrequency) : null
      const trainingDurNum = trainingDuration ? parseFloat(trainingDuration) : null
      const customPALNum = customPAL ? parseFloat(customPAL) : null

      // Calculate calorie range based on energy goal
      let caloriesMin: number | undefined
      let caloriesMax: number | undefined

      const tdeeValue = result.tdee
      const customTdeeValue = customTdeeNum || tdeeValue

      if (energyGoal === 'Maintain weight') {
        caloriesMin = Math.round(tdeeValue * 0.97)
        caloriesMax = Math.round(tdeeValue * 1.03)
      } else if (energyGoal === 'Weight gain') {
        caloriesMin = Math.round(tdeeValue * 1.1)
        caloriesMax = Math.round(tdeeValue * 1.2)
      } else if (energyGoal === 'Weight loss') {
        if (deficitLevel === '10-15%') {
          caloriesMin = Math.round(tdeeValue * 0.85)
          caloriesMax = Math.round(tdeeValue * 0.9)
        } else if (deficitLevel === '20-25%') {
          caloriesMin = Math.round(tdeeValue * 0.75)
          caloriesMax = Math.round(tdeeValue * 0.8)
        } else if (deficitLevel === '25-30%') {
          caloriesMin = Math.round(tdeeValue * 0.7)
          caloriesMax = Math.round(tdeeValue * 0.75)
        }
      } else if (energyGoal === 'Custom TDEE' && customTdeeValue) {
        caloriesMin = Math.round(customTdeeValue * 0.97)
        caloriesMax = Math.round(customTdeeValue * 1.03)
      }

      const profileData = {
        profile_name: profileName,
        birth_date: birthDate,
        gender: gender === '' ? undefined : gender,
        weight_kg: weightNum,
        height_cm: heightNum,
        body_fat_percentage: bodyFatNum,
        bmr_formula: bmrFormula === '' ? undefined : bmrFormula,
        pal_system: palSystem === '' ? undefined : palSystem,
        activity_level: activityLevel || undefined,
        intensity_level: intensityLevel || undefined,
        training_frequency_per_week: trainingFreqNum,
        training_duration_minutes: trainingDurNum,
        daily_steps: dailySteps || undefined,
        custom_pal: customPALNum,
        calorie_goal:
          energyGoal === ''
            ? undefined
            : (energyGoal as 'Maintain weight' | 'Weight gain' | 'Weight loss' | 'Custom TDEE'),
        deficit_level: deficitLevel || undefined,
        custom_tdee: customTdeeNum,
        bmr: result.bmr,
        tdee: result.tdee,
        calories_min: caloriesMin,
        calories_max: caloriesMax,
        // Include macro ranges if they exist
        fat_min_percent: macroRanges?.fatMin,
        fat_max_percent: macroRanges?.fatMax,
        carb_min_percent: macroRanges?.carbMin,
        carb_max_percent: macroRanges?.carbMax,
        protein_min_percent: macroRanges?.proteinMin,
        protein_max_percent: macroRanges?.proteinMax,
        // Include meal settings if they exist
        meals_config: mealSettings || undefined,
      }

      // If activeProfile exists, update it. Otherwise, create new profile
      if (activeProfile?.id) {
        await updateProfileMutation.mutateAsync({
          profileId: activeProfile.id,
          data: profileData,
        })
        // Toast is handled by useUpdateProfile hook
      } else {
        await createProfileMutation.mutateAsync(profileData)
        // Toast is handled by useCreateProfile hook
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      // Error toast is handled by the hooks
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading skeleton while profile data is being fetched
  // This happens when activeProfile has only {id, profile_name} from localStorage
  // and we're waiting for the full data from useProfiles()
  if (activeProfile && !allProfiles.find(p => p.id === activeProfile.id)) {
    return <ProfileFormSkeleton />
  }

  return (
    <div className="space-y-6 pb-20 md:pb-28">
      {/* Calculator Card */}
      <Card>
        <CardHeader>
          <CardTitle>Grundläggande information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning if creating new profile but locked fields (gender) are missing */}
          {!activeProfile && allProfiles.length > 0 && gender !== 'male' && gender !== 'female' && (
            <div className="mb-4 p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Kön saknas i din första profil
                  </h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    För att skapa fler profiler måste din första profil ha ett kön angivet. Kön,
                    födelsedatum och längd delas mellan alla dina profiler.
                  </p>
                  <p className="text-sm text-yellow-800">
                    <strong>Åtgärd:</strong> Gå tillbaka till din första profil och ange kön innan
                    du skapar fler profiler.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Birth Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              Födelsedatum <span className="text-red-600">*</span>
              {!canEditLockedFields && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 font-normal">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day Dropdown */}
              <div className="relative">
                {!canEditLockedFields && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
                )}
                <select
                  value={birthDay}
                  onChange={e => handleDayChange(e.target.value)}
                  disabled={!canEditLockedFields}
                  className={`block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    !canEditLockedFields
                      ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-9'
                      : 'border-neutral-300'
                  }`}
                  title={
                    !canEditLockedFields
                      ? 'Födelsedatum, kön och längd kan endast ändras om du har en enda profil. Radera övriga profiler för att ändra.'
                      : ''
                  }
                >
                  <option value="">Dag</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                {!canEditLockedFields && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
                )}
                <select
                  value={birthMonth}
                  onChange={e => handleMonthChange(e.target.value)}
                  disabled={!canEditLockedFields}
                  className={`block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    !canEditLockedFields
                      ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-9'
                      : 'border-neutral-300'
                  }`}
                  title={
                    !canEditLockedFields
                      ? 'Födelsedatum, kön och längd kan endast ändras om du har en enda profil. Radera övriga profiler för att ändra.'
                      : ''
                  }
                >
                  <option value="">Månad</option>
                  {[
                    'Januari',
                    'Februari',
                    'Mars',
                    'April',
                    'Maj',
                    'Juni',
                    'Juli',
                    'Augusti',
                    'September',
                    'Oktober',
                    'November',
                    'December',
                  ].map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                {!canEditLockedFields && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
                )}
                <select
                  value={birthYear}
                  onChange={e => handleYearChange(e.target.value)}
                  disabled={!canEditLockedFields}
                  className={`block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    !canEditLockedFields
                      ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-9'
                      : 'border-neutral-300'
                  }`}
                  title={
                    !canEditLockedFields
                      ? 'Födelsedatum, kön och längd kan endast ändras om du har en enda profil. Radera övriga profiler för att ändra.'
                      : ''
                  }
                >
                  <option value="">År</option>
                  {Array.from({ length: 105 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!canEditLockedFields && (
              <p className="text-xs text-neutral-500 mt-1">
                Kan endast ändras om du har en enda profil
              </p>
            )}
          </div>

          {/* Gender Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              Kön <span className="text-red-600">*</span>
              {!canEditLockedFields && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 font-normal">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
              )}
            </label>
            <div
              className={`flex gap-4 p-3 rounded-xl ${
                !canEditLockedFields
                  ? 'bg-neutral-200 border-dashed border-2 border-neutral-300'
                  : ''
              }`}
            >
              <label
                className={`flex items-center ${!canEditLockedFields ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={
                  !canEditLockedFields
                    ? 'Kön kan endast ändras om du har en enda profil. Radera övriga profiler för att ändra.'
                    : ''
                }
              >
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={e => setGender(e.target.value as Gender | '')}
                  disabled={!canEditLockedFields}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <span className={!canEditLockedFields ? 'text-neutral-400' : 'text-neutral-700'}>
                  Man
                </span>
              </label>
              <label
                className={`flex items-center ${!canEditLockedFields ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={
                  !canEditLockedFields
                    ? 'Kön kan endast ändras om du har en enda profil. Radera övriga profiler för att ändra.'
                    : ''
                }
              >
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={e => setGender(e.target.value as Gender | '')}
                  disabled={!canEditLockedFields}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <span className={!canEditLockedFields ? 'text-neutral-400' : 'text-neutral-700'}>
                  Kvinna
                </span>
              </label>
            </div>
            {!canEditLockedFields && (
              <p className="text-xs text-neutral-500 mt-1">
                Kan endast ändras om du har en enda profil
              </p>
            )}
          </div>

          {/* Height */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              Längd (cm) <span className="text-red-600">*</span>
              {!canEditLockedFields && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 font-normal">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
              )}
            </label>
            <div className="relative">
              {!canEditLockedFields && (
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
              )}
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                disabled={!canEditLockedFields}
                className={`mt-1 block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                  !canEditLockedFields
                    ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-10'
                    : 'border-neutral-300'
                }`}
                placeholder="180"
                min="100"
                max="250"
                title={
                  !canEditLockedFields
                    ? 'Längd kan endast ändras om du har en enda profil. Radera övriga profiler för att ändra.'
                    : ''
                }
              />
            </div>
            {!canEditLockedFields && (
              <p className="text-xs text-neutral-500 mt-1">
                Kan endast ändras om du har en enda profil
              </p>
            )}
          </div>

          {/* Weight */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Vikt (kg) <span className="text-red-600">*</span>
            </label>
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
              Kroppsfettprocent (%){' '}
              {bmrFormula && requiresBodyFat(bmrFormula) ? (
                <span className="text-red-600">*</span>
              ) : (
                <span className="text-neutral-500">(valfritt)</span>
              )}
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

          {/* SECTION 3: BMR Formula */}
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">BMR-formel</h3>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-neutral-700">
                  BMR-formel <span className="text-red-600">*</span>
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
                <option value="">Välj BMR-formel...</option>
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
              {bmrFormula && requiresBodyFat(bmrFormula) && !bodyFatPercentage && (
                <div className="mt-3 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-xl text-amber-600 flex-shrink-0">⚠</span>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Denna formel kräver kroppsfettprocent. Vänligen fyll i kroppsfettprocent ovan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: PAL System */}
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              PAL-system (Aktivitetsnivå)
            </h3>

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
                  register={
                    register as unknown as Parameters<typeof PALTableContainer>[0]['register']
                  }
                  watch={watch as unknown as Parameters<typeof PALTableContainer>[0]['watch']}
                />
              </div>
            )}
          </div>

          {/* SECTION 5: Energy Goal */}
          {result && (
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Energimål</h3>

              <EnergyGoalReferenceTable
                tdee={result.tdee}
                selectedGoal={energyGoal}
                selectedDeficit={deficitLevel}
                onGoalSelect={setEnergyGoal}
                onDeficitSelect={setDeficitLevel}
              />

              {/* Show custom TDEE input below table when selected */}
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
            </div>
          )}

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
            </div>
          )}
        </CardContent>
      </Card>

      {/* BMR Formula Modal */}
      {bmrFormula && (
        <BMRFormulaModal
          formula={bmrFormula}
          isOpen={showBMRModal}
          onClose={() => setShowBMRModal(false)}
        />
      )}

      {/* PAL System Modal */}
      {palSystem && (
        <PALSystemModal
          system={palSystem}
          isOpen={showPALModal}
          onClose={() => setShowPALModal(false)}
        />
      )}

      {/* Floating Profile Save Card - appears after scrolling */}
      <FloatingProfileSaveCard
        profileName={profileName}
        onProfileNameChange={setProfileName}
        onSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasUnsavedChanges}
      />
    </div>
  )
}
