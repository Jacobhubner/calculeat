import { useTranslation } from 'react-i18next'
import { useActivityIntensityText } from '@/hooks/useActivityIntensityText'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel, IntensityLevel } from '@/lib/types'

interface PALTableDAMNRIPPEDProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
  'Extremely active',
]

const INTENSITY_LEVELS: IntensityLevel[] = ['None', 'Light', 'Moderate', 'Difficult', 'Intense']

export default function PALTableDAMNRIPPED({ register, watch }: PALTableDAMNRIPPEDProps) {
  const { t } = useTranslation('tools')
  const { activityLabel, intensityLabel, activityDescription, intensityDescription } =
    useActivityIntensityText()
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch?.('intensity_level') as IntensityLevel | undefined

  const activityDesc = selectedActivityLevel
    ? activityDescription('DAMNRIPPED PAL values', selectedActivityLevel)
    : ''
  const intensityDesc = selectedIntensityLevel
    ? intensityDescription('DAMNRIPPED PAL values', selectedIntensityLevel)
    : ''

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selectors */}
      {register && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="activity_level">
              {t('tdeeCalc.palTable.activityLabel')}{' '}
              <span className="text-red-600 dark:text-red-300">*</span>
            </Label>
            <Select id="activity_level" {...register('activity_level')} className="mt-2">
              <option value="">{t('tdeeCalc.palTable.activityPlaceholder')}</option>
              {ACTIVITY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {activityLabel(level)}
                </option>
              ))}
            </Select>
            {activityDesc && (
              <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200 dark:text-neutral-400">
                {activityDesc}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="intensity_level">
              {t('tdeeCalc.palTable.intensityLabel')}{' '}
              <span className="text-red-600 dark:text-red-300">*</span>
            </Label>
            <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
              <option value="">{t('tdeeCalc.palTable.intensityPlaceholder')}</option>
              {INTENSITY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {intensityLabel(level)}
                </option>
              ))}
            </Select>
            {intensityDesc && (
              <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200 dark:text-neutral-400 dark:bg-green-900/25 dark:border-green-800">
                {intensityDesc}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
