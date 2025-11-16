import { activityLevelTranslations } from '@/lib/translations'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel } from '@/lib/types'
import { PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS } from '@/lib/calculations/tdee'

interface PALTableFAOProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

export default function PALTableFAO({ register, watch }: PALTableFAOProps) {
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selector */}
      {register && (
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
            PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['FAO/WHO/UNU based PAL values'][
              selectedActivityLevel
            ] && (
              <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                {
                  PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['FAO/WHO/UNU based PAL values'][
                    selectedActivityLevel
                  ]
                }
              </p>
            )}
        </div>
      )}
    </div>
  )
}
