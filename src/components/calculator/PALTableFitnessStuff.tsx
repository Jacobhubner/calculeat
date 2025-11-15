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
  // Training frequency and duration are captured by the form inputs
  // PAL calculation happens in the backend based on these values

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
    </div>
  )
}
