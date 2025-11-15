import { activityLevelTranslations, intensityLevelTranslations } from '@/lib/translations'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel, IntensityLevel } from '@/lib/types'
import {
  PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS,
  PAL_SPECIFIC_INTENSITY_DESCRIPTIONS,
} from '@/lib/calculations/tdee'

interface PALTableProPhysiqueProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

export default function PALTableProPhysique({ register, watch }: PALTableProPhysiqueProps) {
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch?.('intensity_level') as IntensityLevel | undefined

  // These are needed by the PAL calculation but not displayed in this component

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selectors */}
      {register && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="activity_level">Välj din aktivitetsnivå *</Label>
            <Select id="activity_level" {...register('activity_level')} className="mt-2">
              <option value="">Välj aktivitetsnivå...</option>
              <option value="Sedentary">{activityLevelTranslations['Sedentary']}</option>
              <option value="Lightly active">{activityLevelTranslations['Lightly active']}</option>
              <option value="Moderately active">
                {activityLevelTranslations['Moderately active']}
              </option>
              <option value="Very active">{activityLevelTranslations['Very active']}</option>
            </Select>
            {selectedActivityLevel &&
              PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['Pro Physique PAL values'][
                selectedActivityLevel
              ] && (
                <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  {
                    PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['Pro Physique PAL values'][
                      selectedActivityLevel
                    ]
                  }
                </p>
              )}
          </div>
          <div>
            <Label htmlFor="intensity_level">Välj din intensitetsnivå *</Label>
            <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
              <option value="">Välj intensitet...</option>
              <option value="Light">{intensityLevelTranslations['Light']}</option>
              <option value="Moderate">{intensityLevelTranslations['Moderate']}</option>
              <option value="Difficult">{intensityLevelTranslations['Difficult']}</option>
              <option value="Intense">{intensityLevelTranslations['Intense']}</option>
            </Select>
            {selectedIntensityLevel &&
              PAL_SPECIFIC_INTENSITY_DESCRIPTIONS['Pro Physique PAL values'][
                selectedIntensityLevel
              ] && (
                <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                  {
                    PAL_SPECIFIC_INTENSITY_DESCRIPTIONS['Pro Physique PAL values'][
                      selectedIntensityLevel
                    ]
                  }
                </p>
              )}
          </div>
        </div>
      )}

      {/* Training inputs */}
      {register && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="training_frequency_per_week">Träningsfrekvens per vecka *</Label>
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
            <Label htmlFor="training_duration_minutes">Minuter per träningspass *</Label>
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
