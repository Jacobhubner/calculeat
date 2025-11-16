import { activityLevelTranslations, intensityLevelTranslations } from '@/lib/translations'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel, IntensityLevel } from '@/lib/types'
import {
  PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS,
  PAL_SPECIFIC_INTENSITY_DESCRIPTIONS,
} from '@/lib/calculations/tdee'

interface PALTableDAMNRIPPEDProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

export default function PALTableDAMNRIPPED({ register, watch }: PALTableDAMNRIPPEDProps) {
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined
  const selectedIntensityLevel = watch?.('intensity_level') as IntensityLevel | undefined

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selectors */}
      {register && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="activity_level">
              Välj din aktivitetsnivå <span className="text-red-600">*</span>
            </Label>
            <Select id="activity_level" {...register('activity_level')} className="mt-2">
              <option value="">Välj aktivitetsnivå...</option>
              <option value="Sedentary">{activityLevelTranslations['Sedentary']}</option>
              <option value="Lightly active">{activityLevelTranslations['Lightly active']}</option>
              <option value="Moderately active">
                {activityLevelTranslations['Moderately active']}
              </option>
              <option value="Very active">{activityLevelTranslations['Very active']}</option>
              <option value="Extremely active">
                {activityLevelTranslations['Extremely active']}
              </option>
            </Select>
            {selectedActivityLevel &&
              PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['DAMNRIPPED PAL values'][
                selectedActivityLevel
              ] && (
                <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  {
                    PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['DAMNRIPPED PAL values'][
                      selectedActivityLevel
                    ]
                  }
                </p>
              )}
          </div>
          <div>
            <Label htmlFor="intensity_level">
              Välj din intensitetsnivå <span className="text-red-600">*</span>
            </Label>
            <Select id="intensity_level" {...register('intensity_level')} className="mt-2">
              <option value="">Välj intensitet...</option>
              <option value="None">{intensityLevelTranslations['None']}</option>
              <option value="Light">{intensityLevelTranslations['Light']}</option>
              <option value="Moderate">{intensityLevelTranslations['Moderate']}</option>
              <option value="Difficult">{intensityLevelTranslations['Difficult']}</option>
              <option value="Intense">{intensityLevelTranslations['Intense']}</option>
            </Select>
            {selectedIntensityLevel &&
              PAL_SPECIFIC_INTENSITY_DESCRIPTIONS['DAMNRIPPED PAL values'][
                selectedIntensityLevel
              ] && (
                <p className="text-xs text-neutral-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                  {
                    PAL_SPECIFIC_INTENSITY_DESCRIPTIONS['DAMNRIPPED PAL values'][
                      selectedIntensityLevel
                    ]
                  }
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  )
}
