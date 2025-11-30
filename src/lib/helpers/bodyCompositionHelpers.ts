import type { BodyCompositionMethod } from '@/lib/calculations/bodyComposition'

export interface MethodRequirements {
  type: 'caliper' | 'tape' | 'profile'
  fields: string[]
}

/**
 * Get required fields for a specific body composition method
 */
export function getRequiredFields(method: BodyCompositionMethod): MethodRequirements {
  switch (method) {
    case 'Jackson/Pollock 3 Caliper Method (Male)':
      return { type: 'caliper', fields: ['chest', 'abdominal', 'thigh'] }

    case 'Jackson/Pollock 3 Caliper Method (Female)':
      return { type: 'caliper', fields: ['tricep', 'suprailiac', 'thigh'] }

    case 'Jackson/Pollock 4 Caliper Method':
      return { type: 'caliper', fields: ['abdominal', 'suprailiac', 'tricep', 'thigh'] }

    case 'Jackson/Pollock 7 Caliper Method':
      return {
        type: 'caliper',
        fields: [
          'chest',
          'abdominal',
          'thigh',
          'tricep',
          'subscapular',
          'suprailiac',
          'midaxillary',
        ],
      }

    case 'Durnin/Womersley Caliper Method':
      return { type: 'caliper', fields: ['bicep', 'tricep', 'subscapular', 'suprailiac'] }

    case 'Parillo Caliper Method':
      return {
        type: 'caliper',
        fields: ['chest', 'abdominal', 'thigh', 'bicep', 'tricep', 'subscapular', 'suprailiac'],
      }

    case 'Covert Bailey Measuring Tape Method':
      return { type: 'tape', fields: ['hip', 'waist', 'wrist', 'forearm'] }

    case 'U.S. Navy Body Fat Formula':
      return { type: 'tape', fields: ['neck', 'waist', 'hip'] }

    case 'YMCA Measuring Tape Method':
      return { type: 'tape', fields: ['waist'] }

    case 'Modified YMCA Measuring Tape Method':
      return { type: 'tape', fields: ['waist', 'neck', 'hip'] }

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
 */
export function isDensityBasedMethod(method: BodyCompositionMethod): boolean {
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
}

/**
 * Get Swedish labels for tape measurement sites
 */
export const tapeLabels: Record<string, string> = {
  neck: 'Hals',
  waist: 'Midja',
  hip: 'Höft',
  wrist: 'Handled',
  forearm: 'Underarm',
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
