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
  const selectedActivityLevel = watch('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch('intensity_level') as IntensityLevel | undefined
  const renderFields = () => {
    switch (palSystem) {
      case 'FAO/WHO/UNU based PAL values':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="activity_level">Aktivitetsnivå *</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">Välj aktivitetsnivå...</option>
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
              <Label htmlFor="activity_level">Aktivitetsnivå *</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">Välj aktivitetsnivå...</option>
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
              <Label htmlFor="intensity_level">Intensitetsnivå *</Label>
              <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
                <option value="">Välj intensitet...</option>
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
              <Label htmlFor="activity_level">Aktivitetsnivå *</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">Välj aktivitetsnivå...</option>
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
              <Label htmlFor="intensity_level">Intensitetsnivå *</Label>
              <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
                <option value="">Välj intensitet...</option>
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
              <Label htmlFor="training_frequency_per_week">Träningspass per vecka *</Label>
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
              <Label htmlFor="training_duration_minutes">Minuter per pass *</Label>
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
              <Label htmlFor="training_frequency_per_week">Träningspass per vecka *</Label>
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
              <Label htmlFor="training_duration_minutes">Minuter per pass *</Label>
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
              <Label htmlFor="daily_steps">Dagliga steg *</Label>
              <Select id="daily_steps" {...register('daily_steps')} className="mt-2">
                <option value="">Välj stegintervall...</option>
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
              <Label htmlFor="activity_level">Aktivitetsnivå *</Label>
              <Select id="activity_level" {...register('activity_level')} className="mt-2">
                <option value="">Välj aktivitetsnivå...</option>
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

      case 'Custom PAL':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom_pal">Anpassat PAL-värde (1.0 - 3.0) *</Label>
              <Input
                id="custom_pal"
                type="number"
                min={1.0}
                max={3.0}
                step={0.1}
                className="mt-2"
                {...register('custom_pal', { valueAsNumber: true })}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Ange ditt eget PAL-värde om du vet det
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return <div className="mt-4">{renderFields()}</div>
}
