import { useTranslation } from 'react-i18next'
import { useActivityIntensityText } from '@/hooks/useActivityIntensityText'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel, IntensityLevel } from '@/lib/types'

interface PALTableProPhysiqueProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

// Pro Physique exkluderar 'Extremely active' och intensiteten 'None'.
const ACTIVITY_LEVELS: ActivityLevel[] = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
]
const INTENSITY_LEVELS: IntensityLevel[] = ['Light', 'Moderate', 'Difficult', 'Intense']

export default function PALTableProPhysique({ register, watch }: PALTableProPhysiqueProps) {
  const { t } = useTranslation('tools')
  const { activityLabel, intensityLabel, activityDescription, intensityDescription } =
    useActivityIntensityText()
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch?.('intensity_level') as IntensityLevel | undefined

  const activityDesc = selectedActivityLevel
    ? activityDescription('Pro Physique PAL values', selectedActivityLevel)
    : ''
  const intensityDesc = selectedIntensityLevel
    ? intensityDescription('Pro Physique PAL values', selectedIntensityLevel)
    : ''

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selectors */}
      {register && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="activity_level">
              {t('tdeeCalc.palTable.activityLabel')} <span className="text-red-600">*</span>
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
              <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                {activityDesc}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="intensity_level">
              {t('tdeeCalc.palTable.intensityLabel')} <span className="text-red-600">*</span>
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
              <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                {intensityDesc}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Training inputs */}
      {register && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="training_frequency_per_week">
              {t('tdeeCalc.palTable.trainingFreqLabel')} <span className="text-red-600">*</span>
            </Label>
            <Input
              id="training_frequency_per_week"
              type="number"
              min="0"
              max="14"
              step="1"
              {...register('training_frequency_per_week', { valueAsNumber: true })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="training_duration_minutes">
              {t('tdeeCalc.palTable.trainingDurLabel')} <span className="text-red-600">*</span>
            </Label>
            <Input
              id="training_duration_minutes"
              type="number"
              min="0"
              max="240"
              step="15"
              {...register('training_duration_minutes', { valueAsNumber: true })}
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}
