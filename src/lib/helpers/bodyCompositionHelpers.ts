import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'
import type { Gender } from '@/lib/types'

export interface MethodRequirements {
  type: 'caliper' | 'tape' | 'profile'
  fields: string[]
  tapeFields?: string[] // For methods that require both caliper and tape measurements
}

/**
 * Get required fields for a specific body composition method with optional variation
 */
export function getRequiredFields(
  method: BodyCompositionMethod,
  variation?: MethodVariation,
  gender?: Gender
): MethodRequirements {
  switch (method) {
    case 'Jackson/Pollock 3 Caliper Method (Male)':
      if (variation === 'S, S², ålder, C') {
        return {
          type: 'caliper',
          fields: ['chest', 'abdominal', 'thigh'],
          tapeFields: ['waist', 'forearm'],
        }
      } else if (variation === 'Kläder på') {
        return { type: 'caliper', fields: ['chest', 'tricep', 'subscapular'] }
      }
      return { type: 'caliper', fields: ['chest', 'abdominal', 'thigh'] }

    case 'Jackson/Pollock 3 Caliper Method (Female)':
      if (variation === 'S, S², C' || variation === 'S, S², ålder, C') {
        return {
          type: 'caliper',
          fields: ['tricep', 'suprailiac', 'thigh'],
          tapeFields: ['hip'],
        }
      } else if (variation === 'Kläder på') {
        return { type: 'caliper', fields: ['tricep', 'suprailiac', 'abdominal'] }
      }
      return { type: 'caliper', fields: ['tricep', 'suprailiac', 'thigh'] }

    case 'Jackson/Pollock 4 Caliper Method':
      if (variation === 'S, S², C' || variation === 'S, S², ålder, C') {
        return {
          type: 'caliper',
          fields: ['tricep', 'suprailiac', 'abdominal', 'thigh'],
          tapeFields: ['hip'],
        }
      }
      return { type: 'caliper', fields: ['tricep', 'suprailiac', 'abdominal', 'thigh'] }

    case 'Jackson/Pollock 7 Caliper Method': {
      const jp7Fields = [
        'chest',
        'abdominal',
        'thigh',
        'tricep',
        'subscapular',
        'suprailiac',
        'midaxillary',
      ]
      if (variation === 'S, S², C') {
        // Female only
        return { type: 'caliper', fields: jp7Fields, tapeFields: ['hip'] }
      } else if (variation === 'S, S², ålder, C') {
        if (gender === 'male') {
          return { type: 'caliper', fields: jp7Fields, tapeFields: ['waist', 'forearm'] }
        } else {
          return { type: 'caliper', fields: jp7Fields, tapeFields: ['hip'] }
        }
      }
      return { type: 'caliper', fields: jp7Fields }
    }

    case 'Durnin/Womersley Caliper Method':
      return { type: 'caliper', fields: ['bicep', 'tricep', 'subscapular', 'suprailiac'] }

    case 'Parillo Caliper Method':
      return {
        type: 'caliper',
        fields: [
          'chest',
          'abdominal',
          'thigh',
          'bicep',
          'tricep',
          'subscapular',
          'suprailiac',
          'lowerBack',
          'calf',
        ],
      }

    case 'Covert Bailey Measuring Tape Method':
      if (gender === 'male') {
        return { type: 'tape', fields: ['waist', 'hip', 'forearm', 'wrist'] }
      } else {
        return { type: 'tape', fields: ['hip', 'thighCirc', 'calfCirc', 'wrist'] }
      }

    case 'U.S. Navy Body Fat Formula':
      if (gender === 'male') {
        return { type: 'tape', fields: ['neck', 'waist'] }
      } else {
        return { type: 'tape', fields: ['neck', 'waist', 'hip'] }
      }

    case 'YMCA Measuring Tape Method':
      return { type: 'tape', fields: ['waist'] }

    case 'Modified YMCA Measuring Tape Method':
      if (gender === 'male') {
        return { type: 'tape', fields: ['waist'] }
      } else {
        return { type: 'tape', fields: ['waist', 'hip', 'wrist', 'forearm'] }
      }

    case 'Heritage BMI to Body Fat Method':
      return { type: 'profile', fields: ['bmi', 'age', 'gender'] }

    case 'Reversed Cunningham equation':
      return { type: 'profile', fields: ['bmr', 'weight'] }

    default:
      return { type: 'profile', fields: [] }
  }
}

/**
 * Check if a method is density-based (requires Siri/Brozek conversion)
 * Note: JP4 variation without name returns %BF directly
 */
export function isDensityBasedMethod(
  method: BodyCompositionMethod,
  variation?: MethodVariation
): boolean {
  // JP4 variation returns %BF directly, not density
  if (method === 'Jackson/Pollock 4 Caliper Method' && variation === 'S, S²') {
    return false
  }

  const densityMethods = [
    'Jackson/Pollock 3 Caliper Method (Male)',
    'Jackson/Pollock 3 Caliper Method (Female)',
    'Jackson/Pollock 4 Caliper Method',
    'Jackson/Pollock 7 Caliper Method',
    'Durnin/Womersley Caliper Method',
  ]
  return densityMethods.includes(method)
}

/**
 * Get available variations for a specific method
 */
export function getMethodVariations(
  method: BodyCompositionMethod,
  gender: Gender
): MethodVariation[] {
  switch (method) {
    case 'Jackson/Pollock 3 Caliper Method (Male)':
      return ['S, S², ålder', 'S, S², ålder, C', 'Kläder på']

    case 'Jackson/Pollock 3 Caliper Method (Female)':
      return ['S, S², ålder', 'S, S², C', 'S, S², ålder, C', 'Kläder på']

    case 'Jackson/Pollock 4 Caliper Method':
      // JP4 density-based variations are female only, but S,S² variation is available for both genders
      if (gender === 'female') {
        return ['S, S², ålder', 'S, S², C', 'S, S², ålder, C', 'S, S²']
      } else if (gender === 'male') {
        return ['S, S²']
      }
      return []

    case 'Jackson/Pollock 7 Caliper Method':
      if (gender === 'female') {
        return ['S, S², ålder', 'S, S², C', 'S, S², ålder, C']
      } else {
        return ['S, S², ålder', 'S, S², ålder, C']
      }

    default:
      return []
  }
}

/**
 * Get all calculable methods and variations based on available measurements
 * Used for Workflow 2 (fill measurements first, then see all available methods)
 */
export function getCalculableMethods(params: {
  gender: Gender
  age: number
  weight: number
  height: number
  bmi?: number
  bmr?: number
  caliperMeasurements?: Record<string, number>
  tapeMeasurements?: Record<string, number>
}): Array<{ method: BodyCompositionMethod; variation?: MethodVariation }> {
  const { gender, caliperMeasurements, tapeMeasurements, bmi, bmr } = params
  const results: Array<{ method: BodyCompositionMethod; variation?: MethodVariation }> = []

  const hasFields = (fields: string[], measurements?: Record<string, number>) => {
    if (!measurements) return false
    return fields.every(field => measurements[field] !== undefined && measurements[field] !== null)
  }

  // Jackson/Pollock 3 Male
  if (gender === 'male') {
    const jp3MaleBase = hasFields(['chest', 'abdominal', 'thigh'], caliperMeasurements)
    if (jp3MaleBase) {
      results.push({ method: 'Jackson/Pollock 3 Caliper Method (Male)', variation: 'S, S², ålder' })

      if (hasFields(['waist', 'forearm'], tapeMeasurements)) {
        results.push({
          method: 'Jackson/Pollock 3 Caliper Method (Male)',
          variation: 'S, S², ålder, C',
        })
      }
    }

    if (hasFields(['chest', 'tricep', 'subscapular'], caliperMeasurements)) {
      results.push({ method: 'Jackson/Pollock 3 Caliper Method (Male)', variation: 'Kläder på' })
    }
  }

  // Jackson/Pollock 3 Female
  if (gender === 'female') {
    const jp3FemaleBase = hasFields(['tricep', 'suprailiac', 'thigh'], caliperMeasurements)
    if (jp3FemaleBase) {
      results.push({
        method: 'Jackson/Pollock 3 Caliper Method (Female)',
        variation: 'S, S², ålder',
      })

      if (hasFields(['hip'], tapeMeasurements)) {
        results.push({ method: 'Jackson/Pollock 3 Caliper Method (Female)', variation: 'S, S², C' })
        results.push({
          method: 'Jackson/Pollock 3 Caliper Method (Female)',
          variation: 'S, S², ålder, C',
        })
      }
    }

    if (hasFields(['tricep', 'suprailiac', 'abdominal'], caliperMeasurements)) {
      results.push({ method: 'Jackson/Pollock 3 Caliper Method (Female)', variation: 'Kläder på' })
    }
  }

  // Jackson/Pollock 4
  const jp4Base = hasFields(['tricep', 'suprailiac', 'abdominal', 'thigh'], caliperMeasurements)
  if (jp4Base) {
    if (gender === 'female') {
      // Females: all variations available
      results.push({ method: 'Jackson/Pollock 4 Caliper Method', variation: 'S, S², ålder' })
      results.push({ method: 'Jackson/Pollock 4 Caliper Method', variation: 'S, S²' })

      if (hasFields(['hip'], tapeMeasurements)) {
        results.push({ method: 'Jackson/Pollock 4 Caliper Method', variation: 'S, S², C' })
        results.push({ method: 'Jackson/Pollock 4 Caliper Method', variation: 'S, S², ålder, C' })
      }
    } else if (gender === 'male') {
      // Males: only S,S² variation available
      results.push({ method: 'Jackson/Pollock 4 Caliper Method', variation: 'S, S²' })
    }
  }

  // Jackson/Pollock 7
  const jp7Base = hasFields(
    ['chest', 'abdominal', 'thigh', 'tricep', 'subscapular', 'suprailiac', 'midaxillary'],
    caliperMeasurements
  )
  if (jp7Base) {
    results.push({ method: 'Jackson/Pollock 7 Caliper Method', variation: 'S, S², ålder' })

    if (gender === 'female' && hasFields(['hip'], tapeMeasurements)) {
      results.push({ method: 'Jackson/Pollock 7 Caliper Method', variation: 'S, S², C' })
      results.push({ method: 'Jackson/Pollock 7 Caliper Method', variation: 'S, S², ålder, C' })
    }

    if (gender === 'male' && hasFields(['waist', 'forearm'], tapeMeasurements)) {
      results.push({ method: 'Jackson/Pollock 7 Caliper Method', variation: 'S, S², ålder, C' })
    }
  }

  // Durnin/Womersley
  if (hasFields(['bicep', 'tricep', 'subscapular', 'suprailiac'], caliperMeasurements)) {
    results.push({ method: 'Durnin/Womersley Caliper Method' })
  }

  // Parillo (9 sites: chest, abdominal, thigh, bicep, tricep, subscapular, suprailiac, lowerBack, calf)
  if (
    hasFields(
      [
        'chest',
        'abdominal',
        'thigh',
        'bicep',
        'tricep',
        'subscapular',
        'suprailiac',
        'lowerBack',
        'calf',
      ],
      caliperMeasurements
    )
  ) {
    results.push({ method: 'Parillo Caliper Method' })
  }

  // Covert Bailey
  if (gender === 'male') {
    if (hasFields(['waist', 'hip', 'forearm', 'wrist'], tapeMeasurements)) {
      results.push({ method: 'Covert Bailey Measuring Tape Method' })
    }
  } else {
    if (hasFields(['hip', 'thighCirc', 'calfCirc', 'wrist'], tapeMeasurements)) {
      results.push({ method: 'Covert Bailey Measuring Tape Method' })
    }
  }

  // U.S. Navy
  if (hasFields(['neck', 'waist'], tapeMeasurements)) {
    if (gender === 'male' || hasFields(['hip'], tapeMeasurements)) {
      results.push({ method: 'U.S. Navy Body Fat Formula' })
    }
  }

  // YMCA
  if (hasFields(['waist'], tapeMeasurements)) {
    results.push({ method: 'YMCA Measuring Tape Method' })
  }

  // Modified YMCA
  if (hasFields(['waist'], tapeMeasurements)) {
    if (gender === 'male') {
      results.push({ method: 'Modified YMCA Measuring Tape Method' })
    } else if (hasFields(['hip', 'wrist', 'forearm'], tapeMeasurements)) {
      results.push({ method: 'Modified YMCA Measuring Tape Method' })
    }
  }

  // Heritage BMI
  if (bmi) {
    results.push({ method: 'Heritage BMI to Body Fat Method' })
  }

  // Reversed Cunningham
  if (bmr) {
    results.push({ method: 'Reversed Cunningham equation' })
  }

  return results
}

/**
 * Get gradient colors for body fat category
 */
export function getCategoryGradient(color: string): string {
  switch (color) {
    case 'green':
      return 'from-green-50 to-green-100 border-2 border-green-300'
    case 'yellow':
      return 'from-yellow-50 to-yellow-100 border-2 border-yellow-300'
    case 'orange':
      return 'from-orange-50 to-orange-100 border-2 border-orange-300'
    case 'red':
      return 'from-red-50 to-red-100 border-2 border-red-300'
    default:
      return 'from-neutral-50 to-neutral-100 border-2 border-neutral-300'
  }
}

/**
 * Get Swedish labels for caliper measurement sites
 */
export const caliperLabels: Record<string, string> = {
  chest: 'Bröst',
  abdominal: 'Buk',
  thigh: 'Lår',
  tricep: 'Triceps',
  subscapular: 'Subscapular',
  suprailiac: 'Suprailiac',
  midaxillary: 'Midaxillary',
  bicep: 'Biceps',
  lowerBack: 'Ländrygg',
  calf: 'Vad',
}

/**
 * Get Swedish labels for tape measurement sites
 */
export const tapeLabels: Record<string, string> = {
  neck: 'Hals',
  waist: 'Midja',
  hip: 'Höft',
  wrist: 'Handled',
  ankle: 'Fotled',
  forearm: 'Underarm',
  thighCirc: 'Lår',
  calfCirc: 'Vad',
}

/**
 * Group methods by category for select dropdown
 */
export const methodCategories = {
  caliper: {
    label: 'Kalipermetoder (Hudveck)',
    methods: [
      'Jackson/Pollock 3 Caliper Method (Male)',
      'Jackson/Pollock 3 Caliper Method (Female)',
      'Jackson/Pollock 4 Caliper Method',
      'Jackson/Pollock 7 Caliper Method',
      'Durnin/Womersley Caliper Method',
      'Parillo Caliper Method',
    ] as BodyCompositionMethod[],
  },
  tape: {
    label: 'Måttbandsmetoder (Omkrets)',
    methods: [
      'Covert Bailey Measuring Tape Method',
      'U.S. Navy Body Fat Formula',
      'YMCA Measuring Tape Method',
      'Modified YMCA Measuring Tape Method',
    ] as BodyCompositionMethod[],
  },
  profile: {
    label: 'Profilbaserade metoder',
    methods: [
      'Heritage BMI to Body Fat Method',
      'Reversed Cunningham equation',
    ] as BodyCompositionMethod[],
  },
}

/**
 * Swedish translations for method names
 */
export const methodNameTranslations: Record<BodyCompositionMethod, string> = {
  'Jackson/Pollock 3 Caliper Method (Male)': 'Jackson/Pollock 3-punkts kaliper',
  'Jackson/Pollock 3 Caliper Method (Female)': 'Jackson/Pollock 3-punkts kaliper',
  'Jackson/Pollock 4 Caliper Method': 'Jackson/Pollock 4-punkts kaliper',
  'Jackson/Pollock 7 Caliper Method': 'Jackson/Pollock 7-punkts kaliper',
  'Durnin/Womersley Caliper Method': 'Durnin/Womersley kaliper',
  'Parillo Caliper Method': 'Parillo kaliper',
  'Covert Bailey Measuring Tape Method': 'Covert Bailey måttbandsmetod',
  'U.S. Navy Body Fat Formula': 'US Navy kroppsfettformel',
  'YMCA Measuring Tape Method': 'YMCA måttbandsmetod',
  'Modified YMCA Measuring Tape Method': 'Modifierad YMCA måttbandsmetod',
  'Heritage BMI to Body Fat Method': 'Heritage BMI-baserad kroppsfett',
  'Reversed Cunningham equation': 'Omvänd Cunningham-ekvation',
}

/**
 * Filter methods based on user gender
 * Hides gender-specific methods that don't match the user's gender
 */
export function filterMethodsByGender(
  methods: BodyCompositionMethod[],
  gender: Gender | undefined
): BodyCompositionMethod[] {
  if (!gender) return methods

  return methods.filter(method => {
    // JP3 Male only for males
    if (method === 'Jackson/Pollock 3 Caliper Method (Male)') {
      return gender === 'male'
    }
    // JP3 Female only for females
    if (method === 'Jackson/Pollock 3 Caliper Method (Female)') {
      return gender === 'female'
    }
    // JP4 has both gender-specific variations
    // Females: all variations (density-based + "Okänt ursprung")
    // Males: only "Okänt ursprung" variation
    if (method === 'Jackson/Pollock 4 Caliper Method') {
      return gender === 'female' || gender === 'male'
    }
    // All other methods available to everyone
    return true
  })
}

/**
 * Format method name with variation for display (in Swedish)
 */
export function formatMethodName(
  method: BodyCompositionMethod,
  variation?: MethodVariation
): string {
  const translatedName = methodNameTranslations[method] || method
  if (variation) {
    return `${translatedName} (${variation})`
  }
  return translatedName
}

/**
 * Comparison result interface for Workflow 2
 */
export interface MethodComparisonResult {
  method: BodyCompositionMethod
  variation?: MethodVariation
  bodyDensity?: number
  bodyFatPercentage: number
  category: string
  categoryColor: string
  leanBodyMass: number
  fatMass: number
  // NEW: Indicates if method is available (has all required measurements)
  isAvailable?: boolean
  // NEW: List of missing measurements (if not available)
  missingFields?: string[]
}

/**
 * Get ALL methods with availability status (for Workflow 2)
 * Unlike getCalculableMethods, this returns ALL methods and marks which ones are available
 */
export function getAllMethodsWithAvailability(params: {
  gender: Gender
  age: number
  weight: number
  height: number
  bmi?: number
  bmr?: number
  caliperMeasurements?: Record<string, number>
  tapeMeasurements?: Record<string, number>
}): Array<{
  method: BodyCompositionMethod
  variation?: MethodVariation
  isAvailable: boolean
  missingFields: string[]
}> {
  const { gender, caliperMeasurements, tapeMeasurements, bmi, bmr } = params
  const results: Array<{
    method: BodyCompositionMethod
    variation?: MethodVariation
    isAvailable: boolean
    missingFields: string[]
  }> = []

  const getMissingFields = (
    requiredFields: string[],
    tapeFields: string[] | undefined,
    measurements: Record<string, number> | undefined,
    tapeMeasurements: Record<string, number> | undefined
  ): string[] => {
    const missing: string[] = []

    // Check caliper/tape required fields
    requiredFields.forEach(field => {
      if (!measurements || measurements[field] === undefined || measurements[field] === null) {
        missing.push(caliperLabels[field] || tapeLabels[field] || field)
      }
    })

    // Check additional tape fields (for methods that need both caliper and tape)
    if (tapeFields) {
      tapeFields.forEach(field => {
        if (
          !tapeMeasurements ||
          tapeMeasurements[field] === undefined ||
          tapeMeasurements[field] === null
        ) {
          missing.push(tapeLabels[field] || field)
        }
      })
    }

    return missing
  }

  // Jackson/Pollock 3 Male
  if (gender === 'male') {
    const jp3MaleVariations: Array<{
      variation: MethodVariation
      requiredFields: string[]
      tapeFields?: string[]
    }> = [
      { variation: 'S, S², ålder', requiredFields: ['chest', 'abdominal', 'thigh'] },
      {
        variation: 'S, S², ålder, C',
        requiredFields: ['chest', 'abdominal', 'thigh'],
        tapeFields: ['waist', 'forearm'],
      },
      { variation: 'Kläder på', requiredFields: ['chest', 'tricep', 'subscapular'] },
    ]

    jp3MaleVariations.forEach(({ variation, requiredFields, tapeFields }) => {
      const missing = getMissingFields(
        requiredFields,
        tapeFields,
        caliperMeasurements,
        tapeMeasurements
      )
      results.push({
        method: 'Jackson/Pollock 3 Caliper Method (Male)',
        variation,
        isAvailable: missing.length === 0,
        missingFields: missing,
      })
    })
  }

  // Jackson/Pollock 3 Female
  if (gender === 'female') {
    const jp3FemaleVariations: Array<{
      variation: MethodVariation
      requiredFields: string[]
      tapeFields?: string[]
    }> = [
      { variation: 'S, S², ålder', requiredFields: ['tricep', 'suprailiac', 'thigh'] },
      {
        variation: 'S, S², C',
        requiredFields: ['tricep', 'suprailiac', 'thigh'],
        tapeFields: ['hip'],
      },
      {
        variation: 'S, S², ålder, C',
        requiredFields: ['tricep', 'suprailiac', 'thigh'],
        tapeFields: ['hip'],
      },
      { variation: 'Kläder på', requiredFields: ['tricep', 'suprailiac', 'abdominal'] },
    ]

    jp3FemaleVariations.forEach(({ variation, requiredFields, tapeFields }) => {
      const missing = getMissingFields(
        requiredFields,
        tapeFields,
        caliperMeasurements,
        tapeMeasurements
      )
      results.push({
        method: 'Jackson/Pollock 3 Caliper Method (Female)',
        variation,
        isAvailable: missing.length === 0,
        missingFields: missing,
      })
    })
  }

  // Jackson/Pollock 4
  const jp4RequiredFields = ['tricep', 'suprailiac', 'abdominal', 'thigh']
  if (gender === 'female') {
    const jp4FemaleVariations: Array<{
      variation: MethodVariation
      tapeFields?: string[]
    }> = [
      { variation: 'S, S², ålder' },
      { variation: 'S, S²' },
      { variation: 'S, S², C', tapeFields: ['hip'] },
      { variation: 'S, S², ålder, C', tapeFields: ['hip'] },
    ]

    jp4FemaleVariations.forEach(({ variation, tapeFields }) => {
      const missing = getMissingFields(
        jp4RequiredFields,
        tapeFields,
        caliperMeasurements,
        tapeMeasurements
      )
      results.push({
        method: 'Jackson/Pollock 4 Caliper Method',
        variation,
        isAvailable: missing.length === 0,
        missingFields: missing,
      })
    })
  } else if (gender === 'male') {
    const missing = getMissingFields(
      jp4RequiredFields,
      undefined,
      caliperMeasurements,
      tapeMeasurements
    )
    results.push({
      method: 'Jackson/Pollock 4 Caliper Method',
      variation: 'S, S²',
      isAvailable: missing.length === 0,
      missingFields: missing,
    })
  }

  // Jackson/Pollock 7
  const jp7RequiredFields = [
    'chest',
    'abdominal',
    'thigh',
    'tricep',
    'subscapular',
    'suprailiac',
    'midaxillary',
  ]
  if (gender === 'female') {
    const jp7FemaleVariations: Array<{
      variation: MethodVariation
      tapeFields?: string[]
    }> = [
      { variation: 'S, S², ålder' },
      { variation: 'S, S², C', tapeFields: ['hip'] },
      { variation: 'S, S², ålder, C', tapeFields: ['hip'] },
    ]

    jp7FemaleVariations.forEach(({ variation, tapeFields }) => {
      const missing = getMissingFields(
        jp7RequiredFields,
        tapeFields,
        caliperMeasurements,
        tapeMeasurements
      )
      results.push({
        method: 'Jackson/Pollock 7 Caliper Method',
        variation,
        isAvailable: missing.length === 0,
        missingFields: missing,
      })
    })
  } else if (gender === 'male') {
    const jp7MaleVariations: Array<{
      variation: MethodVariation
      tapeFields?: string[]
    }> = [
      { variation: 'S, S², ålder' },
      { variation: 'S, S², ålder, C', tapeFields: ['waist', 'forearm'] },
    ]

    jp7MaleVariations.forEach(({ variation, tapeFields }) => {
      const missing = getMissingFields(
        jp7RequiredFields,
        tapeFields,
        caliperMeasurements,
        tapeMeasurements
      )
      results.push({
        method: 'Jackson/Pollock 7 Caliper Method',
        variation,
        isAvailable: missing.length === 0,
        missingFields: missing,
      })
    })
  }

  // Durnin/Womersley
  const dwMissing = getMissingFields(
    ['bicep', 'tricep', 'subscapular', 'suprailiac'],
    undefined,
    caliperMeasurements,
    tapeMeasurements
  )
  results.push({
    method: 'Durnin/Womersley Caliper Method',
    isAvailable: dwMissing.length === 0,
    missingFields: dwMissing,
  })

  // Parillo
  const parilloMissing = getMissingFields(
    [
      'chest',
      'abdominal',
      'thigh',
      'bicep',
      'tricep',
      'subscapular',
      'suprailiac',
      'lowerBack',
      'calf',
    ],
    undefined,
    caliperMeasurements,
    tapeMeasurements
  )
  results.push({
    method: 'Parillo Caliper Method',
    isAvailable: parilloMissing.length === 0,
    missingFields: parilloMissing,
  })

  // Covert Bailey
  const covertRequiredFields =
    gender === 'male'
      ? ['waist', 'hip', 'forearm', 'wrist']
      : ['hip', 'thighCirc', 'calfCirc', 'wrist']
  const covertMissing = getMissingFields(
    covertRequiredFields,
    undefined,
    tapeMeasurements,
    undefined
  )
  results.push({
    method: 'Covert Bailey Measuring Tape Method',
    isAvailable: covertMissing.length === 0,
    missingFields: covertMissing,
  })

  // U.S. Navy
  const navyRequiredFields = gender === 'male' ? ['neck', 'waist'] : ['neck', 'waist', 'hip']
  const navyMissing = getMissingFields(navyRequiredFields, undefined, tapeMeasurements, undefined)
  results.push({
    method: 'U.S. Navy Body Fat Formula',
    isAvailable: navyMissing.length === 0,
    missingFields: navyMissing,
  })

  // YMCA
  const ymcaMissing = getMissingFields(['waist'], undefined, tapeMeasurements, undefined)
  results.push({
    method: 'YMCA Measuring Tape Method',
    isAvailable: ymcaMissing.length === 0,
    missingFields: ymcaMissing,
  })

  // Modified YMCA
  const modYmcaRequiredFields = gender === 'male' ? ['waist'] : ['waist', 'hip', 'wrist', 'forearm']
  const modYmcaMissing = getMissingFields(
    modYmcaRequiredFields,
    undefined,
    tapeMeasurements,
    undefined
  )
  results.push({
    method: 'Modified YMCA Measuring Tape Method',
    isAvailable: modYmcaMissing.length === 0,
    missingFields: modYmcaMissing,
  })

  // Heritage BMI
  results.push({
    method: 'Heritage BMI to Body Fat Method',
    isAvailable: !!bmi,
    missingFields: bmi ? [] : ['BMI'],
  })

  // Reversed Cunningham
  results.push({
    method: 'Reversed Cunningham equation',
    isAvailable: !!bmr,
    missingFields: bmr ? [] : ['BMR'],
  })

  return results
}

/**
 * Sort comparison results by a specific field
 */
export function sortComparisonResults(
  results: MethodComparisonResult[],
  sortBy: keyof MethodComparisonResult,
  direction: 'asc' | 'desc'
): MethodComparisonResult[] {
  const sorted = [...results].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]

    // Handle numeric fields
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    // Handle string fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  return sorted
}
