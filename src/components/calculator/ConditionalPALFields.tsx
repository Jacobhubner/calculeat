import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  activityLevelTranslations,
  intensityLevelTranslations,
  dailyStepsTranslations,
} from '@/lib/translations'
import {
  PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS,
  PAL_SPECIFIC_INTENSITY_DESCRIPTIONS,
} from '@/lib/calculations/tdee'
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

export default function ConditionalPALFields({
  palSystem,
  register,
  watch,
  setValue: _setValue,
}: ConditionalPALFieldsProps) {
  const { t } = useTranslation('tools')
  const selectedActivityLevel = watch('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch('intensity_level') as IntensityLevel | undefined
  const renderFields = () => {
    switch (palSystem) {
      case 'FAO/WHO/UNU based PAL values':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity_level">{t('palFields.activityLevel')}</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">{t('palFields.activityLevelPlaceholder')}</option>
                <option value="Sedentary">{activityLevelTranslations['Sedentary']}</option>
                <option value="Lightly active">
                  {activityLevelTranslations['Lightly active']}
                </option>
                <option value="Moderately active">
                  {activityLevelTranslations['Moderately active']}
                </option>
                <option value="Very active">{activityLevelTranslations['Very active']}</option>
                <option value="Extremely active">
                  {activityLevelTranslations['Extremely active']}
                </option>
              </Select>
              {selectedActivityLevel &&
                PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel] && (
                  <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    {PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel]}
                  </p>
                )}
            </div>
          </div>
        )

      case 'DAMNRIPPED PAL values':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity_level">{t('palFields.activityLevel')}</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">{t('palFields.activityLevelPlaceholder')}</option>
                <option value="Sedentary">{activityLevelTranslations['Sedentary']}</option>
                <option value="Lightly active">
                  {activityLevelTranslations['Lightly active']}
                </option>
                <option value="Moderately active">
                  {activityLevelTranslations['Moderately active']}
                </option>
                <option value="Very active">{activityLevelTranslations['Very active']}</option>
                <option value="Extremely active">
                  {activityLevelTranslations['Extremely active']}
                </option>
              </Select>
              {selectedActivityLevel &&
                PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel] && (
                  <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    {PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel]}
                  </p>
                )}
            </div>
            <div>
              <Label htmlFor="intensity_level">{t('palFields.intensityLevel')}</Label>
              <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
                <option value="">{t('palFields.intensityLevelPlaceholder')}</option>
                <option value="None">{intensityLevelTranslations['None']}</option>
                <option value="Light">{intensityLevelTranslations['Light']}</option>
                <option value="Moderate">{intensityLevelTranslations['Moderate']}</option>
                <option value="Difficult">{intensityLevelTranslations['Difficult']}</option>
                <option value="Intense">{intensityLevelTranslations['Intense']}</option>
              </Select>
              {selectedIntensityLevel &&
                PAL_SPECIFIC_INTENSITY_DESCRIPTIONS[palSystem][selectedIntensityLevel] && (
                  <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                    {PAL_SPECIFIC_INTENSITY_DESCRIPTIONS[palSystem][selectedIntensityLevel]}
                  </p>
                )}
            </div>
          </div>
        )

      case 'Pro Physique PAL values':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity_level">{t('palFields.activityLevel')}</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">{t('palFields.activityLevelPlaceholder')}</option>
                <option value="Sedentary">{activityLevelTranslations['Sedentary']}</option>
                <option value="Lightly active">
                  {activityLevelTranslations['Lightly active']}
                </option>
                <option value="Moderately active">
                  {activityLevelTranslations['Moderately active']}
                </option>
                <option value="Very active">{activityLevelTranslations['Very active']}</option>
              </Select>
              {selectedActivityLevel &&
                PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel] && (
                  <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    {PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel]}
                  </p>
                )}
            </div>
            <div>
              <Label htmlFor="intensity_level">{t('palFields.intensityLevel')}</Label>
              <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
                <option value="">{t('palFields.intensityLevelPlaceholder')}</option>
                <option value="Light">{intensityLevelTranslations['Light']}</option>
                <option value="Moderate">{intensityLevelTranslations['Moderate']}</option>
                <option value="Difficult">{intensityLevelTranslations['Difficult']}</option>
                <option value="Intense">{intensityLevelTranslations['Intense']}</option>
              </Select>
              {selectedIntensityLevel &&
                PAL_SPECIFIC_INTENSITY_DESCRIPTIONS[palSystem][selectedIntensityLevel] && (
                  <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                    {PAL_SPECIFIC_INTENSITY_DESCRIPTIONS[palSystem][selectedIntensityLevel]}
                  </p>
                )}
            </div>
            <div>
              <Label htmlFor="training_frequency_per_week">
                {t('palFields.trainingFrequency')}
              </Label>
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
          </div>
        )

      case 'Fitness Stuff PAL values':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="training_frequency_per_week">
                {t('palFields.trainingFrequency')}
              </Label>
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
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity_level">{t('palFields.activityLevel')}</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">{t('palFields.activityLevelPlaceholder')}</option>
                <option value="Sedentary">{activityLevelTranslations['Sedentary']}</option>
                <option value="Lightly active">
                  {activityLevelTranslations['Lightly active']}
                </option>
                <option value="Moderately active">
                  {activityLevelTranslations['Moderately active']}
                </option>
                <option value="Very active">{activityLevelTranslations['Very active']}</option>
                <option value="Extremely active">
                  {activityLevelTranslations['Extremely active']}
                </option>
              </Select>
              {selectedActivityLevel &&
                PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel] && (
                  <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    {PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS[palSystem][selectedActivityLevel]}
                  </p>
                )}
            </div>
          </div>
        )

      case 'Custom PAL': {
        const customPALValue = Number(watch('custom_pal'))
        const customPALOutOfRange =
          customPALValue > 0 && (customPALValue < 1.0 || customPALValue > 3.0)
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom_pal">{t('palFields.customPAL')}</Label>
              <Input
                id="custom_pal"
                type="number"
                min={1.0}
                max={3.0}
                step={0.1}
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
