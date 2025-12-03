import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import MethodSelectionCard from '@/components/body-composition/MethodSelectionCard'
import VariationSelector from '@/components/body-composition/VariationSelector'
import CaliperMeasurementsSection from '@/components/body-composition/CaliperMeasurementsSection'
import TapeMeasurementsSection from '@/components/body-composition/TapeMeasurementsSection'
import DensityConversionSelector from '@/components/body-composition/DensityConversionSelector'
import BodyCompositionResults from '@/components/body-composition/BodyCompositionResults'
import TabNavigation from '@/components/body-composition/TabNavigation'
import AllMeasurementsForm from '@/components/body-composition/AllMeasurementsForm'
import MethodComparisonTable from '@/components/body-composition/MethodComparisonTable'
import MeasurementSetSidebar from '@/components/body-composition/MeasurementSetSidebar'
import CollapsibleSidebar from '@/components/CollapsibleSidebar'
import EmptyState from '@/components/EmptyState'
import { Activity, Scale } from 'lucide-react'
import { useProfileStore } from '@/stores/profileStore'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import {
  useProfiles,
  useUpdateProfile,
  useCreateMeasurementSet,
  useUpdateMeasurementSet,
} from '@/hooks'
import {
  getRequiredFields,
  isDensityBasedMethod,
  getMethodVariations,
  getCalculableMethods,
  type MethodComparisonResult,
} from '@/lib/helpers/bodyCompositionHelpers'
import {
  calculateBodyFat,
  siriEquation,
  brozekEquation,
  getBodyFatCategory,
  type BodyCompositionMethod,
  type MethodVariation,
  type CaliperMeasurements,
  type TapeMeasurements,
  type BodyCompositionParams,
} from '@/lib/calculations/bodyComposition'
import { calculateBMI } from '@/lib/calculations/helpers'
import { toast } from 'sonner'

function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function BodyCompositionPage() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: allProfiles } = useProfiles()
  const profile = allProfiles?.find(p => p.id === activeProfile?.id)
  const updateProfileMutation = useUpdateProfile()

  // Measurement sets
  const activeMeasurementSet = useMeasurementSetStore(state => state.activeMeasurementSet)
  const setActiveMeasurementSet = useMeasurementSetStore(state => state.setActiveMeasurementSet)
  const measurementSets = useMeasurementSetStore(state => state.measurementSets)
  const unsavedMeasurementSets = useMeasurementSetStore(state => state.unsavedMeasurementSets)
  const addUnsavedMeasurementSet = useMeasurementSetStore(state => state.addUnsavedMeasurementSet)
  const removeUnsavedMeasurementSet = useMeasurementSetStore(
    state => state.removeUnsavedMeasurementSet
  )
  const getMeasurementSetById = useMeasurementSetStore(state => state.getMeasurementSetById)

  const createMeasurementSetMutation = useCreateMeasurementSet()
  const updateMeasurementSetMutation = useUpdateMeasurementSet()

  // Workflow state
  const [activeWorkflow, setActiveWorkflow] = useState<'method-first' | 'measurements-first'>(
    'method-first'
  )

  // Workflow 1: Method-first states
  const [selectedMethod, setSelectedMethod] = useState<BodyCompositionMethod | ''>('')
  const [selectedVariation, setSelectedVariation] = useState<MethodVariation | undefined>(undefined)
  const [conversionMethod, setConversionMethod] = useState<'siri' | 'brozek'>('siri')

  // Workflow 2: Conversion method (separate state from Workflow 1)
  const [conversionMethod2, setConversionMethod2] = useState<'siri' | 'brozek'>('siri')

  // Caliper measurements (mm) - for Workflow 1
  const [caliperMeasurements, setCaliperMeasurements] = useState<CaliperMeasurements>({
    chest: undefined,
    abdominal: undefined,
    thigh: undefined,
    tricep: undefined,
    subscapular: undefined,
    suprailiac: undefined,
    midaxillary: undefined,
    bicep: undefined,
    lowerBack: undefined,
    calf: undefined,
  })

  // Tape measurements (cm) - for Workflow 1
  const [tapeMeasurements, setTapeMeasurements] = useState<TapeMeasurements>({
    neck: undefined,
    waist: undefined,
    hip: undefined,
    wrist: undefined,
    forearm: undefined,
    thighCirc: undefined,
    calfCirc: undefined,
  })

  // Workflow 2: Measurements-first states
  const [allCaliperMeasurements, setAllCaliperMeasurements] = useState<CaliperMeasurements>({})
  const [allTapeMeasurements, setAllTapeMeasurements] = useState<TapeMeasurements>({})
  const [comparisonResults, setComparisonResults] = useState<MethodComparisonResult[]>([])

  // Results (for Workflow 1)
  const [bodyDensity, setBodyDensity] = useState<number | null>(null)
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number | null>(null)
  const [category, setCategory] = useState<ReturnType<typeof getBodyFatCategory> | null>(null)

  // UI state
  const [isSaving, setIsSaving] = useState(false)

  // Reset measurements when method changes and set default variation
  useEffect(() => {
    setCaliperMeasurements({
      chest: undefined,
      abdominal: undefined,
      thigh: undefined,
      tricep: undefined,
      subscapular: undefined,
      suprailiac: undefined,
      midaxillary: undefined,
      bicep: undefined,
      lowerBack: undefined,
      calf: undefined,
    })
    setTapeMeasurements({
      neck: undefined,
      waist: undefined,
      hip: undefined,
      wrist: undefined,
      forearm: undefined,
      thighCirc: undefined,
      calfCirc: undefined,
    })
    setBodyDensity(null)
    setBodyFatPercentage(null)
    setCategory(null)

    // Set default variation if method has variations
    if (selectedMethod && profile) {
      const variations = getMethodVariations(selectedMethod, profile.gender)
      if (variations.length > 0) {
        setSelectedVariation(variations[0])
      } else {
        setSelectedVariation(undefined)
      }
    }
  }, [selectedMethod, profile])

  // Calculate body fat whenever inputs change
  useEffect(() => {
    if (!selectedMethod || !profile) {
      setBodyDensity(null)
      setBodyFatPercentage(null)
      setCategory(null)
      return
    }

    const params: BodyCompositionParams = {
      age: calculateAge(profile.birth_date),
      gender: profile.gender,
      weight: profile.weight_kg,
      height: profile.height_cm,
      bmi: calculateBMI(profile.weight_kg, profile.height_cm),
      caliperMeasurements,
      tapeMeasurements,
      bmr: profile.bmr,
    }

    // Calculate body fat using selected method and variation
    const result = calculateBodyFat(selectedMethod, params, selectedVariation)

    if (result === null) {
      // Not enough measurements yet
      setBodyFatPercentage(null)
      setCategory(null)
      return
    }

    // For density-based methods, calculate density first
    if (isDensityBasedMethod(selectedMethod, selectedVariation)) {
      const density = result as number
      setBodyDensity(density)

      // Then convert to body fat %
      const bf = conversionMethod === 'siri' ? siriEquation(density) : brozekEquation(density)
      setBodyFatPercentage(bf)
    } else {
      // Direct calculation methods
      setBodyDensity(null)
      setBodyFatPercentage(result)
    }
  }, [
    selectedMethod,
    selectedVariation,
    conversionMethod,
    caliperMeasurements,
    tapeMeasurements,
    profile,
  ])

  // Calculate category when body fat % is available
  useEffect(() => {
    if (bodyFatPercentage && profile) {
      const cat = getBodyFatCategory({
        bodyFatPercentage,
        age: calculateAge(profile.birth_date),
        gender: profile.gender,
      })
      setCategory(cat)
    }
  }, [bodyFatPercentage, profile])

  // Workflow 2: Calculate all available methods when measurements change
  useEffect(() => {
    if (activeWorkflow === 'measurements-first' && profile) {
      const age = calculateAge(profile.birth_date)
      const bmi = calculateBMI(profile.weight_kg, profile.height_cm)

      // Get all calculable methods
      const methods = getCalculableMethods({
        gender: profile.gender,
        age,
        weight: profile.weight_kg,
        height: profile.height_cm,
        bmi,
        bmr: profile.bmr,
        caliperMeasurements: allCaliperMeasurements,
        tapeMeasurements: allTapeMeasurements,
      })

      // Calculate results for each method
      const results: MethodComparisonResult[] = methods.map(({ method, variation }) => {
        const params: BodyCompositionParams = {
          age,
          gender: profile.gender,
          weight: profile.weight_kg,
          height: profile.height_cm,
          bmi,
          caliperMeasurements: allCaliperMeasurements,
          tapeMeasurements: allTapeMeasurements,
          bmr: profile.bmr,
        }

        // Calculate body fat using the method
        const result = calculateBodyFat(method, params, variation)

        let bodyFatPercentage = 0
        let bodyDensity: number | undefined = undefined
        if (result !== null) {
          // For density-based methods, convert to body fat %
          if (isDensityBasedMethod(method, variation)) {
            bodyDensity = result as number
            bodyFatPercentage =
              conversionMethod2 === 'siri' ? siriEquation(bodyDensity) : brozekEquation(bodyDensity)
          } else {
            bodyFatPercentage = result
          }
        }

        // Get category
        const category = getBodyFatCategory({
          bodyFatPercentage,
          age,
          gender: profile.gender,
        })

        // Calculate lean body mass and fat mass
        const leanBodyMass = profile.weight_kg * (1 - bodyFatPercentage / 100)
        const fatMass = profile.weight_kg * (bodyFatPercentage / 100)

        return {
          method,
          variation,
          bodyDensity,
          bodyFatPercentage,
          category: category.category,
          categoryColor: category.color,
          leanBodyMass,
          fatMass,
        }
      })

      setComparisonResults(results)
    }
  }, [activeWorkflow, allCaliperMeasurements, allTapeMeasurements, profile, conversionMethod2])

  // Auto-fill measurements when a measurement set is selected
  useEffect(() => {
    if (activeMeasurementSet) {
      // Workflow 1 - method-first
      setCaliperMeasurements({
        chest: activeMeasurementSet.chest,
        abdominal: activeMeasurementSet.abdominal,
        thigh: activeMeasurementSet.thigh,
        tricep: activeMeasurementSet.tricep,
        subscapular: activeMeasurementSet.subscapular,
        suprailiac: activeMeasurementSet.suprailiac,
        midaxillary: activeMeasurementSet.midaxillary,
        bicep: activeMeasurementSet.bicep,
        lowerBack: activeMeasurementSet.lower_back,
        calf: activeMeasurementSet.calf,
      })

      setTapeMeasurements({
        neck: activeMeasurementSet.neck,
        waist: activeMeasurementSet.waist,
        hip: activeMeasurementSet.hip,
        wrist: activeMeasurementSet.wrist,
        forearm: activeMeasurementSet.forearm,
        thighCirc: activeMeasurementSet.thigh_circ,
        calfCirc: activeMeasurementSet.calf_circ,
      })

      // Workflow 2 - measurements-first
      setAllCaliperMeasurements({
        chest: activeMeasurementSet.chest,
        abdominal: activeMeasurementSet.abdominal,
        thigh: activeMeasurementSet.thigh,
        tricep: activeMeasurementSet.tricep,
        subscapular: activeMeasurementSet.subscapular,
        suprailiac: activeMeasurementSet.suprailiac,
        midaxillary: activeMeasurementSet.midaxillary,
        bicep: activeMeasurementSet.bicep,
        lowerBack: activeMeasurementSet.lower_back,
        calf: activeMeasurementSet.calf,
      })

      setAllTapeMeasurements({
        neck: activeMeasurementSet.neck,
        waist: activeMeasurementSet.waist,
        hip: activeMeasurementSet.hip,
        wrist: activeMeasurementSet.wrist,
        forearm: activeMeasurementSet.forearm,
        thighCirc: activeMeasurementSet.thigh_circ,
        calfCirc: activeMeasurementSet.calf_circ,
      })
    }
  }, [activeMeasurementSet])

  const handleCaliperChange = (field: keyof CaliperMeasurements, value: number | undefined) => {
    setCaliperMeasurements(prev => ({ ...prev, [field]: value }))
  }

  const handleTapeChange = (field: keyof TapeMeasurements, value: number | undefined) => {
    setTapeMeasurements(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveToProfile = async () => {
    if (!activeProfile || bodyFatPercentage === null) {
      toast.error('Ingen aktiv profil eller resultat att spara')
      return
    }

    setIsSaving(true)

    try {
      await updateProfileMutation.mutateAsync({
        profileId: activeProfile.id,
        data: {
          body_fat_percentage: bodyFatPercentage,
          body_composition_method: selectedMethod,
        },
      })

      toast.success('Profil uppdaterad!')
    } catch (error) {
      toast.error('Kunde inte spara till profil')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveComparisonResult = async (result: MethodComparisonResult) => {
    if (!activeProfile) return

    setIsSaving(true)

    try {
      await updateProfileMutation.mutateAsync({
        profileId: activeProfile.id,
        data: {
          body_fat_percentage: result.bodyFatPercentage,
          body_composition_method: result.method,
        },
      })

      toast.success('Profil uppdaterad!')
    } catch (error) {
      toast.error('Kunde inte spara till profil')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handler for creating new measurement set
  const handleCreateNewMeasurement = (preserveCurrentMeasurements = false) => {
    // Check for unsaved changes (only if we're not auto-creating the first card)
    if (hasUnsavedMeasurements && !preserveCurrentMeasurements) {
      const confirmed = window.confirm(
        'Du har osparade ändringar. Vill du fortsätta? Ändringar kommer att förloras.'
      )
      if (!confirmed) return
    }

    // If preserving measurements, use current values; otherwise use undefined
    const newSet = {
      id: `temp-${Date.now()}`,
      user_id: profile?.id || '',
      set_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      // Copy current measurements if preserving, otherwise undefined
      chest: preserveCurrentMeasurements
        ? (caliperMeasurements.chest ?? allCaliperMeasurements.chest)
        : undefined,
      abdominal: preserveCurrentMeasurements
        ? (caliperMeasurements.abdominal ?? allCaliperMeasurements.abdominal)
        : undefined,
      thigh: preserveCurrentMeasurements
        ? (caliperMeasurements.thigh ?? allCaliperMeasurements.thigh)
        : undefined,
      tricep: preserveCurrentMeasurements
        ? (caliperMeasurements.tricep ?? allCaliperMeasurements.tricep)
        : undefined,
      subscapular: preserveCurrentMeasurements
        ? (caliperMeasurements.subscapular ?? allCaliperMeasurements.subscapular)
        : undefined,
      suprailiac: preserveCurrentMeasurements
        ? (caliperMeasurements.suprailiac ?? allCaliperMeasurements.suprailiac)
        : undefined,
      midaxillary: preserveCurrentMeasurements
        ? (caliperMeasurements.midaxillary ?? allCaliperMeasurements.midaxillary)
        : undefined,
      bicep: preserveCurrentMeasurements
        ? (caliperMeasurements.bicep ?? allCaliperMeasurements.bicep)
        : undefined,
      lower_back: preserveCurrentMeasurements
        ? (caliperMeasurements.lowerBack ?? allCaliperMeasurements.lowerBack)
        : undefined,
      calf: preserveCurrentMeasurements
        ? (caliperMeasurements.calf ?? allCaliperMeasurements.calf)
        : undefined,
      neck: preserveCurrentMeasurements
        ? (tapeMeasurements.neck ?? allTapeMeasurements.neck)
        : undefined,
      waist: preserveCurrentMeasurements
        ? (tapeMeasurements.waist ?? allTapeMeasurements.waist)
        : undefined,
      hip: preserveCurrentMeasurements
        ? (tapeMeasurements.hip ?? allTapeMeasurements.hip)
        : undefined,
      wrist: preserveCurrentMeasurements
        ? (tapeMeasurements.wrist ?? allTapeMeasurements.wrist)
        : undefined,
      forearm: preserveCurrentMeasurements
        ? (tapeMeasurements.forearm ?? allTapeMeasurements.forearm)
        : undefined,
      thigh_circ: preserveCurrentMeasurements
        ? (tapeMeasurements.thighCirc ?? allTapeMeasurements.thighCirc)
        : undefined,
      calf_circ: preserveCurrentMeasurements
        ? (tapeMeasurements.calfCirc ?? allTapeMeasurements.calfCirc)
        : undefined,
    }

    addUnsavedMeasurementSet(newSet)
  }

  // Handler for selecting a measurement set
  const handleSelectMeasurementSet = (setId: string) => {
    const set = getMeasurementSetById(setId)
    if (set) {
      setActiveMeasurementSet(set)
    }
  }

  // Handler for saving measurement set (create new or update existing)
  const handleSaveMeasurementSet = async (setId: string) => {
    const set = getMeasurementSetById(setId)
    if (!set) return

    const today = new Date().toISOString().split('T')[0]

    // Collect all measurements, converting undefined to null
    const allMeasurements = {
      // Caliper measurements
      chest: caliperMeasurements.chest ?? allCaliperMeasurements.chest ?? null,
      abdominal: caliperMeasurements.abdominal ?? allCaliperMeasurements.abdominal ?? null,
      thigh: caliperMeasurements.thigh ?? allCaliperMeasurements.thigh ?? null,
      tricep: caliperMeasurements.tricep ?? allCaliperMeasurements.tricep ?? null,
      subscapular: caliperMeasurements.subscapular ?? allCaliperMeasurements.subscapular ?? null,
      suprailiac: caliperMeasurements.suprailiac ?? allCaliperMeasurements.suprailiac ?? null,
      midaxillary: caliperMeasurements.midaxillary ?? allCaliperMeasurements.midaxillary ?? null,
      bicep: caliperMeasurements.bicep ?? allCaliperMeasurements.bicep ?? null,
      lower_back: caliperMeasurements.lowerBack ?? allCaliperMeasurements.lowerBack ?? null,
      calf: caliperMeasurements.calf ?? allCaliperMeasurements.calf ?? null,
      // Tape measurements
      neck: tapeMeasurements.neck ?? allTapeMeasurements.neck ?? null,
      waist: tapeMeasurements.waist ?? allTapeMeasurements.waist ?? null,
      hip: tapeMeasurements.hip ?? allTapeMeasurements.hip ?? null,
      wrist: tapeMeasurements.wrist ?? allTapeMeasurements.wrist ?? null,
      forearm: tapeMeasurements.forearm ?? allTapeMeasurements.forearm ?? null,
      thigh_circ: tapeMeasurements.thighCirc ?? allTapeMeasurements.thighCirc ?? null,
      calf_circ: tapeMeasurements.calfCirc ?? allTapeMeasurements.calfCirc ?? null,
    }

    // Filter out null values - only send fields that have actual values
    const measurementData = Object.fromEntries(
      Object.entries(allMeasurements).filter(([_, value]) => value !== null && value !== undefined)
    )

    // Debug logging
    console.log('Saving measurement data:', measurementData)

    try {
      // If it's an unsaved (temp) set, create new in database
      if (setId.startsWith('temp-')) {
        await createMeasurementSetMutation.mutateAsync({
          set_date: today,
          ...measurementData,
        })
        // Remove from unsaved sets
        removeUnsavedMeasurementSet(setId)
      }
      // If it's an existing set, update it
      else {
        await updateMeasurementSetMutation.mutateAsync({
          id: setId,
          data: {
            set_date: today,
            ...measurementData,
          },
        })
      }
      // Success toast is handled by the hooks
    } catch (error) {
      // Error toast is handled by the hooks
      console.error('Error saving measurement set:', error)
      console.error('Failed data:', measurementData)
    }
  }

  // Auto-create first card when user fills in measurements (no cards exist)
  useEffect(() => {
    const hasWorkflow1Measurements =
      Object.values(caliperMeasurements).some(v => v !== undefined) ||
      Object.values(tapeMeasurements).some(v => v !== undefined)
    const hasWorkflow2Measurements =
      Object.values(allCaliperMeasurements).some(v => v !== undefined) ||
      Object.values(allTapeMeasurements).some(v => v !== undefined)

    // Only auto-create if:
    // 1. No cards exist (saved or unsaved)
    // 2. No active set
    // 3. User has entered measurements
    if (
      measurementSets.length === 0 &&
      unsavedMeasurementSets.length === 0 &&
      !activeMeasurementSet &&
      (hasWorkflow1Measurements || hasWorkflow2Measurements)
    ) {
      // Pass true to preserve current measurements when auto-creating
      handleCreateNewMeasurement(true)
    }
  }, [
    caliperMeasurements,
    tapeMeasurements,
    allCaliperMeasurements,
    allTapeMeasurements,
    measurementSets.length,
    unsavedMeasurementSets.length,
    activeMeasurementSet,
  ])

  // Detect unsaved measurement changes
  const hasUnsavedMeasurements = useMemo(() => {
    if (!activeMeasurementSet) {
      return false
    }

    // For unsaved (temp) cards, show save icon if ANY measurements exist
    if (activeMeasurementSet.id.startsWith('temp-')) {
      const hasWorkflow1 =
        Object.values(caliperMeasurements).some(v => v !== undefined) ||
        Object.values(tapeMeasurements).some(v => v !== undefined)
      const hasWorkflow2 =
        Object.values(allCaliperMeasurements).some(v => v !== undefined) ||
        Object.values(allTapeMeasurements).some(v => v !== undefined)
      return hasWorkflow1 || hasWorkflow2
    }

    // For saved sets, compare with saved values
    const currentCaliper =
      activeWorkflow === 'method-first' ? caliperMeasurements : allCaliperMeasurements
    const currentTape = activeWorkflow === 'method-first' ? tapeMeasurements : allTapeMeasurements

    const caliperChanged = Object.entries(currentCaliper).some(([key, value]) => {
      const savedKey = key === 'lowerBack' ? 'lower_back' : key
      return value !== activeMeasurementSet[savedKey as keyof typeof activeMeasurementSet]
    })

    const tapeChanged = Object.entries(currentTape).some(([key, value]) => {
      const savedKey = key === 'thighCirc' ? 'thigh_circ' : key === 'calfCirc' ? 'calf_circ' : key
      return value !== activeMeasurementSet[savedKey as keyof typeof activeMeasurementSet]
    })

    return caliperChanged || tapeChanged
  }, [
    activeMeasurementSet,
    caliperMeasurements,
    tapeMeasurements,
    allCaliperMeasurements,
    allTapeMeasurements,
    activeWorkflow,
  ])

  if (!profile) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={Scale}
          title="Ingen aktiv profil"
          description="Du måste ha en profil för att använda kroppssammansättningskalkylatorn."
          action={{
            label: 'Gå till profil',
            onClick: () => (window.location.href = '/app/profile'),
          }}
        />
      </DashboardLayout>
    )
  }

  const requirements = selectedMethod
    ? getRequiredFields(selectedMethod, selectedVariation, profile.gender)
    : null
  const fatFreeMass =
    bodyFatPercentage && profile.weight_kg ? profile.weight_kg * (1 - bodyFatPercentage / 100) : 0
  const fatMass =
    bodyFatPercentage && profile.weight_kg ? profile.weight_kg * (bodyFatPercentage / 100) : 0

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary-600" />
          Kroppssammansättning
        </h1>
        <p className="text-neutral-600">
          Beräkna din kroppsfettsprocent med 12 olika metoder. Välj metod och fyll i dina mätningar.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main content column */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <TabNavigation activeTab={activeWorkflow} onTabChange={setActiveWorkflow} />

            {/* Workflow 1: Method-First */}
            {activeWorkflow === 'method-first' && (
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                {/* Left Column - Input */}
                <div className="space-y-6">
                  {/* Method Selection */}
                  <MethodSelectionCard
                    selectedMethod={selectedMethod}
                    onMethodChange={setSelectedMethod}
                    gender={profile?.gender}
                  />

                  {/* Variation Selection - Show when method has variations */}
                  {selectedMethod && profile && (
                    <VariationSelector
                      method={selectedMethod}
                      gender={profile.gender}
                      selectedVariation={selectedVariation}
                      onChange={setSelectedVariation}
                    />
                  )}

                  {/* Measurement Input - Only show when method is selected */}
                  {requirements && (
                    <>
                      {requirements.type === 'caliper' && (
                        <>
                          <CaliperMeasurementsSection
                            measurements={caliperMeasurements}
                            requiredFields={requirements.fields}
                            onChange={handleCaliperChange}
                          />
                          {requirements.tapeFields && requirements.tapeFields.length > 0 && (
                            <TapeMeasurementsSection
                              measurements={tapeMeasurements}
                              requiredFields={requirements.tapeFields}
                              onChange={handleTapeChange}
                            />
                          )}
                        </>
                      )}

                      {requirements.type === 'tape' && (
                        <TapeMeasurementsSection
                          measurements={tapeMeasurements}
                          requiredFields={requirements.fields}
                          onChange={handleTapeChange}
                        />
                      )}

                      {requirements.type === 'profile' && (
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                          <p className="text-sm text-neutral-600 mb-4">
                            Denna metod använder data från din profil:
                          </p>
                          <ul className="space-y-2 text-sm">
                            {requirements.fields.includes('bmi') && (
                              <li>
                                <span className="font-medium">BMI:</span>{' '}
                                {profile.height_cm && profile.weight_kg
                                  ? calculateBMI(profile.weight_kg, profile.height_cm).toFixed(1)
                                  : 'Saknas'}
                              </li>
                            )}
                            {requirements.fields.includes('age') && (
                              <li>
                                <span className="font-medium">Ålder:</span>{' '}
                                {calculateAge(profile.birth_date)} år
                              </li>
                            )}
                            {requirements.fields.includes('gender') && (
                              <li>
                                <span className="font-medium">Kön:</span>{' '}
                                {profile.gender === 'male' ? 'Man' : 'Kvinna'}
                              </li>
                            )}
                            {requirements.fields.includes('bmr') && (
                              <li>
                                <span className="font-medium">BMR:</span>{' '}
                                {profile.bmr ? `${Math.round(profile.bmr)} kcal` : 'Saknas'}
                              </li>
                            )}
                            {requirements.fields.includes('weight') && (
                              <li>
                                <span className="font-medium">Vikt:</span>{' '}
                                {profile.weight_kg ? `${profile.weight_kg} kg` : 'Saknas'}
                              </li>
                            )}
                          </ul>
                          <p className="text-xs text-neutral-500 mt-4">
                            Uppdatera din profil om dessa värden är felaktiga.
                          </p>
                        </div>
                      )}

                      {/* Density Conversion Selector - Only for density-based methods */}
                      {isDensityBasedMethod(selectedMethod) && (
                        <DensityConversionSelector
                          conversionMethod={conversionMethod}
                          onMethodChange={setConversionMethod}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Right Column - Results */}
                <div>
                  {bodyFatPercentage !== null && category && (
                    <BodyCompositionResults
                      bodyDensity={bodyDensity}
                      bodyFatPercentage={bodyFatPercentage}
                      category={category}
                      fatFreeMass={fatFreeMass}
                      fatMass={fatMass}
                      selectedMethod={selectedMethod as BodyCompositionMethod}
                      conversionMethod={conversionMethod}
                      onSave={handleSaveToProfile}
                      isSaving={isSaving}
                    />
                  )}

                  {!selectedMethod && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                      <p className="text-neutral-600">Välj en beräkningsmetod för att börja</p>
                    </div>
                  )}

                  {selectedMethod && bodyFatPercentage === null && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                      <p className="text-neutral-600">
                        Fyll i alla obligatoriska fält för att se resultat
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow 2: Measurements-First */}
            {activeWorkflow === 'measurements-first' && (
              <div className="space-y-6">
                <AllMeasurementsForm
                  caliperMeasurements={allCaliperMeasurements}
                  tapeMeasurements={allTapeMeasurements}
                  onCaliperChange={(field, value) =>
                    setAllCaliperMeasurements(prev => ({ ...prev, [field]: value }))
                  }
                  onTapeChange={(field, value) =>
                    setAllTapeMeasurements(prev => ({ ...prev, [field]: value }))
                  }
                />

                {/* Density Conversion Selector - Only show if there are density-based methods */}
                {comparisonResults.some(r => isDensityBasedMethod(r.method, r.variation)) && (
                  <DensityConversionSelector
                    conversionMethod={conversionMethod2}
                    onMethodChange={setConversionMethod2}
                  />
                )}

                <MethodComparisonTable
                  results={comparisonResults}
                  onSaveResult={handleSaveComparisonResult}
                  isSaving={isSaving}
                />
              </div>
            )}
          </div>

          {/* Right sidebar - Measurement Sets */}
          <div>
            <CollapsibleSidebar>
              <MeasurementSetSidebar
                onCreateNew={handleCreateNewMeasurement}
                hasUnsavedChanges={hasUnsavedMeasurements}
                onSelectSet={handleSelectMeasurementSet}
                onSaveSet={handleSaveMeasurementSet}
                isSaving={
                  createMeasurementSetMutation.isPending || updateMeasurementSetMutation.isPending
                }
              />
            </CollapsibleSidebar>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
