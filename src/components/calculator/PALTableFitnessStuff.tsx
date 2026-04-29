import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UseFormRegister, UseFormWatch } from 'react-hook-form'

interface PALTableFitnessStuffProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
}

export default function PALTableFitnessStuff({ register }: PALTableFitnessStuffProps) {
  const { t } = useTranslation('tools')

  return (
    <div className="w-full space-y-4">
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

      {/* Daily steps selector */}
      {register && (
        <div>
          <Label htmlFor="daily_steps">
            {t('tdeeCalc.palTable.dailyStepsLabel')} <span className="text-red-600">*</span>
          </Label>
          <Select id="daily_steps" {...register('daily_steps')} className="mt-2">
            <option value="">{t('tdeeCalc.palTable.dailyStepsPlaceholder')}</option>
            <option value="3 000 – 4 999 steps/day">
              {t('tdeeCalc.palTable.stepsOptions.3000')}
            </option>
            <option value="5 000 – 6 999 steps/day">
              {t('tdeeCalc.palTable.stepsOptions.5000')}
            </option>
            <option value="7 000 – 8 999 steps/day">
              {t('tdeeCalc.palTable.stepsOptions.7000')}
            </option>
            <option value="9 000 – 10 999 steps/day">
              {t('tdeeCalc.palTable.stepsOptions.9000')}
            </option>
            <option value="11 000 – 12 999 steps/day">
              {t('tdeeCalc.palTable.stepsOptions.11000')}
            </option>
            <option value="≥ 13 000 steps/day">{t('tdeeCalc.palTable.stepsOptions.13000')}</option>
          </Select>
        </div>
      )}
    </div>
  )
}
