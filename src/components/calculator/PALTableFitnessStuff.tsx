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

export default function PALTableFitnessStuff({ register, watch }: PALTableFitnessStuffProps) {
  const trainingFrequency = watch?.('training_frequency_per_week')
  const trainingDuration = watch?.('training_duration_minutes')

  // Calculate training hours per week for display
  const trainingHoursPerWeek =
    trainingFrequency && trainingDuration
      ? ((trainingFrequency * trainingDuration) / 60).toFixed(1)
      : '0'

  return (
    <div className="w-full space-y-4">
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

      {/* Daily steps selector */}
      {register && (
        <div>
          <Label htmlFor="daily_steps">Dagliga steg *</Label>
          <Select id="daily_steps" {...register('daily_steps')} className="mt-2">
            <option value="">Välj dagliga steg...</option>
            <option value="3 000 – 4 999 steps/day">3 000 – 4 999 steg/dag</option>
            <option value="5 000 – 6 999 steps/day">5 000 – 6 999 steg/dag</option>
            <option value="7 000 – 8 999 steps/day">7 000 – 8 999 steg/dag</option>
            <option value="9 000 – 10 999 steps/day">9 000 – 10 999 steg/dag</option>
            <option value="11 000 – 12 999 steps/day">11 000 – 12 999 steg/dag</option>
            <option value="≥ 13 000 steps/day">≥ 13 000 steg/dag</option>
          </Select>
        </div>
      )}

      <div className="mt-4 p-4 bg-neutral-50 rounded border border-neutral-200">
        <p className="text-sm font-semibold text-neutral-700 mb-2">Fitness Stuff PAL Beräkning</p>
        <p className="text-xs text-neutral-600 mb-3">
          Detta system beräknar PAL baserat på träningstimmar per vecka och dagliga steg. Baserat på
          dina inmatningar:
        </p>
        <div className="space-y-1 text-xs text-neutral-600">
          <p>
            <strong>Träningstimmar per vecka:</strong> {trainingHoursPerWeek} timmar
          </p>
          <p>
            <strong>PAL-multiplikator baseras på:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>&lt; 1 timme/vecka: 1.0</li>
            <li>1-3 timmar/vecka: 1.2</li>
            <li>3-5 timmar/vecka: 1.375</li>
            <li>5-7 timmar/vecka: 1.55</li>
            <li>7-10 timmar/vecka: 1.725</li>
            <li>≥ 10 timmar/vecka: 1.9</li>
          </ul>
          <p className="mt-2">
            <strong>Plus extra kalorier från dagliga steg:</strong>
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>3 000 – 4 999: +150 kcal</li>
            <li>5 000 – 6 999: +240 kcal</li>
            <li>7 000 – 8 999: +330 kcal</li>
            <li>9 000 – 10 999: +420 kcal</li>
            <li>11 000 – 12 999: +510 kcal</li>
            <li>≥ 13 000: +600 kcal</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
