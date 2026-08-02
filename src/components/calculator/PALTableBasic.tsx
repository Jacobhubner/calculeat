import { useTranslation } from 'react-i18next'
import { useActivityIntensityText } from '@/hooks/useActivityIntensityText'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'
import type { ActivityLevel } from '@/lib/types'

interface PALTableBasicProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

const LEVELS: ActivityLevel[] = [
  'Sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
  'Extremely active',
]

export default function PALTableBasic({ register, watch }: PALTableBasicProps) {
  const { t } = useTranslation('tools')
  const { activityLabel, activityDescription } = useActivityIntensityText()
  const selectedActivityLevel = watch?.('activity_level') as ActivityLevel | undefined

  const description = selectedActivityLevel
    ? activityDescription('Basic internet PAL values', selectedActivityLevel)
    : ''

  return (
    <div className="w-full space-y-4">
      {/* Dropdown selector */}
      {register && (
        <div>
          <Label htmlFor="activity_level">
            {t('tdeeCalc.palTable.activityLabel')}{' '}
            <span className="text-red-600 dark:text-red-300">*</span>
          </Label>
          <Select id="activity_level" {...register('activity_level')} className="mt-2">
            <option value="">{t('tdeeCalc.palTable.activityPlaceholder')}</option>
            {LEVELS.map(level => (
              <option key={level} value={level}>
                {activityLabel(level)}
              </option>
            ))}
          </Select>
          {description && (
            <p className="text-xs text-neutral-600 mt-2 p-2 bg-blue-50 rounded border border-blue-200 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
