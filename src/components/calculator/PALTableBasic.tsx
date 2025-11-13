import { activityLevelTranslations } from '@/lib/translations'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel } from '@/lib/types'
import { PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS } from '@/lib/calculations/tdee'

interface PALTableBasicProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

export default function PALTableBasic({ register, watch }: PALTableBasicProps) {
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selector */}
      {register && (
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
            PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['Basic internet PAL values'][
              selectedActivityLevel
            ] && (
              <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                {
                  PAL_SPECIFIC_ACTIVITY_DESCRIPTIONS['Basic internet PAL values'][
                    selectedActivityLevel
                  ]
                }
              </p>
            )}
        </div>
      )}

      {/* PAL Values Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-primary-300">
            <th className="text-left py-2 px-2 font-semibold text-neutral-700">Aktivitetsnivå</th>
            <th className="text-center py-2 px-2 font-semibold text-neutral-700">Värde</th>
          </tr>
        </thead>
        <tbody>
          <tr
            className={`border-b border-neutral-200 ${selectedActivityLevel === 'Sedentary' ? 'bg-primary-100 font-semibold' : ''}`}
          >
            <td className="py-2 px-2">{activityLevelTranslations['Sedentary']}</td>
            <td className="text-center py-2 px-2 font-medium">1.2</td>
          </tr>
          <tr
            className={`border-b border-neutral-200 ${selectedActivityLevel === 'Lightly active' ? 'bg-primary-100 font-semibold' : ''}`}
          >
            <td className="py-2 px-2">{activityLevelTranslations['Lightly active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.375</td>
          </tr>
          <tr
            className={`border-b border-neutral-200 ${selectedActivityLevel === 'Moderately active' ? 'bg-primary-100 font-semibold' : ''}`}
          >
            <td className="py-2 px-2">{activityLevelTranslations['Moderately active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.55</td>
          </tr>
          <tr
            className={`border-b border-neutral-200 ${selectedActivityLevel === 'Very active' ? 'bg-primary-100 font-semibold' : ''}`}
          >
            <td className="py-2 px-2">{activityLevelTranslations['Very active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.725</td>
          </tr>
          <tr
            className={`${selectedActivityLevel === 'Extremely active' ? 'bg-primary-100 font-semibold' : ''}`}
          >
            <td className="py-2 px-2">{activityLevelTranslations['Extremely active']}</td>
            <td className="text-center py-2 px-2 font-medium">1.9</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
