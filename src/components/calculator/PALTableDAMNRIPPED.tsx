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

  // Helper to check if a cell matches both selected values
  const isCellSelected = (activityLevel: ActivityLevel, intensityLevel: IntensityLevel) => {
    return selectedActivityLevel === activityLevel && selectedIntensityLevel === intensityLevel
  }

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
            <Label htmlFor="intensity_level">Välj din intensitetsnivå *</Label>
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

      {/* PAL Values Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-primary-300">
              <th className="text-left py-2 px-1 sm:px-2 font-semibold text-neutral-700">
                Aktivitet
              </th>
              <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
                {intensityLevelTranslations['None']}
              </th>
              <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
                {intensityLevelTranslations['Light']}
              </th>
              <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
                {intensityLevelTranslations['Moderate']}
              </th>
              <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
                {intensityLevelTranslations['Difficult']}
              </th>
              <th className="text-center py-2 px-1 sm:px-2 font-semibold text-neutral-700">
                {intensityLevelTranslations['Intense']}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Sedentary']}</td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Sedentary', 'None') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.1
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Sedentary', 'Light') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.2
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Sedentary', 'Moderate') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.35
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Sedentary', 'Difficult') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.45
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Sedentary', 'Intense') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.55
              </td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Lightly active']}</td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Lightly active', 'None') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.2
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Lightly active', 'Light') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.4
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Lightly active', 'Moderate') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.45
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Lightly active', 'Difficult') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.55
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Lightly active', 'Intense') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.6
              </td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-1 sm:px-2">
                {activityLevelTranslations['Moderately active']}
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Moderately active', 'None') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.4
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Moderately active', 'Light') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.45
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Moderately active', 'Moderate') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.6
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Moderately active', 'Difficult') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.65
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Moderately active', 'Intense') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.7
              </td>
            </tr>
            <tr className="border-b border-neutral-200">
              <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Very active']}</td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Very active', 'None') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.6
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Very active', 'Light') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.7
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Very active', 'Moderate') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.75
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Very active', 'Difficult') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.8
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Very active', 'Intense') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.9
              </td>
            </tr>
            <tr>
              <td className="py-2 px-1 sm:px-2">{activityLevelTranslations['Extremely active']}</td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Extremely active', 'None') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.8
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Extremely active', 'Light') ? 'bg-primary-100 font-bold' : ''}`}
              >
                1.9
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Extremely active', 'Moderate') ? 'bg-primary-100 font-bold' : ''}`}
              >
                2.0
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Extremely active', 'Difficult') ? 'bg-primary-100 font-bold' : ''}`}
              >
                2.1
              </td>
              <td
                className={`text-center py-2 px-1 sm:px-2 font-medium ${isCellSelected('Extremely active', 'Intense') ? 'bg-primary-100 font-bold' : ''}`}
              >
                2.2
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
