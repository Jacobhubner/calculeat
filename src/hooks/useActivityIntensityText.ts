import { useTranslation } from 'react-i18next'
import type { ActivityLevel, IntensityLevel, PALSystem } from '@/lib/calculations/tdee'

/**
 * i18n-läsare för aktivitetsnivå/intensitet-labels och PAL-systemspecifika
 * beskrivningar. Ersätter de tidigare hårdkodade svenska konstanterna
 * (activityLevelTranslations, PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS m.fl.) så att
 * texten följer valt språk (tools.json: activityLevelLabels, activityDescriptions,
 * intensityLevelLabels, intensityDescriptions).
 */

// PAL-systemets fulla namn → kebab-id som används i JSON-nycklarna.
const PAL_KEY: Partial<Record<PALSystem, string>> = {
  'FAO/WHO/UNU based PAL values': 'fao',
  'DAMNRIPPED PAL values': 'damnripped',
  'Pro Physique PAL values': 'proPhysique',
  'Fitness Stuff PAL values': 'fitnessStuff',
  'Basic internet PAL values': 'basic',
}

export function useActivityIntensityText() {
  const { t } = useTranslation('tools')

  const activityLabel = (level: ActivityLevel | string): string =>
    t(`activityLevelLabels.${level}`, { defaultValue: String(level) })

  const intensityLabel = (level: IntensityLevel | string): string =>
    t(`intensityLevelLabels.${level}`, { defaultValue: String(level) })

  const activityDescription = (
    palSystem: PALSystem | string,
    level: ActivityLevel | string
  ): string => {
    const key = PAL_KEY[palSystem as PALSystem]
    if (!key) return ''
    return t(`activityDescriptions.${key}.${level}`, { defaultValue: '' })
  }

  const intensityDescription = (
    palSystem: PALSystem | string,
    level: IntensityLevel | string
  ): string => {
    const key = PAL_KEY[palSystem as PALSystem]
    if (!key) return ''
    return t(`intensityDescriptions.${key}.${level}`, { defaultValue: '' })
  }

  return { activityLabel, intensityLabel, activityDescription, intensityDescription }
}
