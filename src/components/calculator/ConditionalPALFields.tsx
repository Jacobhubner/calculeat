import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { dailyStepsTranslations } from '@/lib/translations'
import { useActivityIntensityText } from '@/hooks/useActivityIntensityText'
import type { PALSystem, ActivityLevel, IntensityLevel } from '@/lib/types'
import { useTranslation } from 'react-i18next'

interface ConditionalPALFieldsProps {
  palSystem: PALSystem
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (name: string, value: any) => void
}

const FULL_ACTIVITY: ActivityLevel[] = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
  'Extremely active',
]
// Pro Physique exkluderar 'Extremely active'.
const PRO_PHYSIQUE_ACTIVITY: ActivityLevel[] = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
]
const DAMNRIPPED_INTENSITY: IntensityLevel[] = ['None', 'Light', 'Moderate', 'Difficult', 'Intense']
// Pro Physique exkluderar 'None'.
const PRO_PHYSIQUE_INTENSITY: IntensityLevel[] = ['Light', 'Moderate', 'Difficult', 'Intense']

export default function ConditionalPALFields({
  palSystem,
  register,
  watch,
  setValue: _setValue,
}: ConditionalPALFieldsProps) {
  const { t } = useTranslation('tools')
  const { activityLabel, intensityLabel, activityDescription, intensityDescription } =
    useActivityIntensityText()
  const selectedActivityLevel = watch('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch('intensity_level') as IntensityLevel | undefined

  const activityField = (levels: ActivityLevel[]) => {
    const desc = selectedActivityLevel ? activityDescription(palSystem, selectedActivityLevel) : ''
    return (
      <div>
        <Label htmlFor="activity_level">{t('palFields.activityLevel')}</Label>
        <Select id="activity_level" {...register('activity_level')} className="mt-2">
          <option value="">{t('palFields.activityLevelPlaceholder')}</option>
          {levels.map(level => (
            <option key={level} value={level}>
              {activityLabel(level)}
            </option>
          ))}
        </Select>
        {desc && (
          <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            {desc}
          </p>
        )}
      </div>
    )
  }

  const intensityField = (levels: IntensityLevel[]) => {
    const desc = selectedIntensityLevel
      ? intensityDescription(palSystem, selectedIntensityLevel)
      : ''
    return (
      <div>
        <Label htmlFor="intensity_level">{t('palFields.intensityLevel')}</Label>
        <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
          <option value="">{t('palFields.intensityLevelPlaceholder')}</option>
          {levels.map(level => (
            <option key={level} value={level}>
              {intensityLabel(level)}
            </option>
          ))}
        </Select>
        {desc && (
          <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
            {desc}
          </p>
        )}
      </div>
    )
  }

  const trainingInputs = (
    <>
      <div>
        <Label htmlFor="training_frequency_per_week">{t('palFields.trainingFrequency')}</Label>
        <Input
          id="training_frequency_per_week"
          type="number"
          min={0}
          max={14}
          className="mt-2"
          {...register('training_frequency_per_week', { valueAsNumber: true })}
        />
      </div>
      <div>
        <Label htmlFor="training_duration_minutes">{t('palFields.trainingDuration')}</Label>
        <Input
          id="training_duration_minutes"
          type="number"
          min={0}
          max={300}
          className="mt-2"
          {...register('training_duration_minutes', { valueAsNumber: true })}
        />
      </div>
    </>
  )

  const renderFields = () => {
    switch (palSystem) {
      case 'FAO/WHO/UNU based PAL values':
        return <div className="space-y-4">{activityField(FULL_ACTIVITY)}</div>

      case 'DAMNRIPPED PAL values':
        return (
          <div className="space-y-4">
            {activityField(FULL_ACTIVITY)}
            {intensityField(DAMNRIPPED_INTENSITY)}
          </div>
        )

      case 'Pro Physique PAL values':
        return (
          <div className="space-y-4">
            {activityField(PRO_PHYSIQUE_ACTIVITY)}
            {intensityField(PRO_PHYSIQUE_INTENSITY)}
            {trainingInputs}
          </div>
        )

      case 'Fitness Stuff PAL values':
        return (
          <div className="space-y-4">
            {trainingInputs}
            <div>
              <Label htmlFor="daily_steps">{t('palFields.dailySteps')}</Label>
              <Select id="daily_steps" {...register('daily_steps')} className="mt-2">
                <option value="">{t('palFields.dailyStepsPlaceholder')}</option>
                {Object.entries(dailyStepsTranslations).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )

      case 'Basic internet PAL values':
        return <div className="space-y-4">{activityField(FULL_ACTIVITY)}</div>

      case 'Custom PAL': {
        const rawPAL = parseFloat(watch('custom_pal'))
        const customPALOutOfRange = !isNaN(rawPAL) && (rawPAL < 1.0 || rawPAL > 2.5)
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom_pal">{t('palFields.customPAL')}</Label>
              <Input
                id="custom_pal"
                type="number"
                step={0.01}
                className="mt-2"
                {...register('custom_pal', { valueAsNumber: true })}
              />
              <p className="text-xs text-neutral-500 mt-1">{t('palFields.customPALHint')}</p>
              {customPALOutOfRange && (
                <div className="mt-2 flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-600 flex-shrink-0">⚠</span>
                  <p className="text-sm text-amber-800">{t('palFields.customPALWarning')}</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  return <div className="mt-4">{renderFields()}</div>
}
