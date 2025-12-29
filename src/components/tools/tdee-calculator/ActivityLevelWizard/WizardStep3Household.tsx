import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MET_ACTIVITIES } from '@/lib/constants/metActivities'
import type { WizardStepProps } from './types'

export default function WizardStep3Household({ data, onUpdate }: WizardStepProps) {
  // Alla hushållsaktiviteter
  const householdActivities = useMemo(() => {
    return MET_ACTIVITIES.filter(activity => activity.category === 'Hushållsaktiviteter')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Hushållsarbete</h3>
        <p className="text-sm text-neutral-600 mt-1">Städning, matlagning, trädgårdsarbete, etc.</p>
      </div>

      {/* Timmar per dag */}
      <div>
        <Label htmlFor="household-hours">Genomsnittligt antal timmar hushållsarbete per dag</Label>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-neutral-600">0</span>
          <input
            id="household-hours"
            type="range"
            min="0"
            max="16"
            step="0.5"
            value={data.household.hoursPerDay}
            onChange={e =>
              onUpdate({
                household: {
                  ...data.household,
                  hoursPerDay: parseFloat(e.target.value),
                },
              })
            }
            className="flex-1"
          />
          <span className="text-sm text-neutral-600">16</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-2xl font-bold text-primary-600">
            {data.household.hoursPerDay} {data.household.hoursPerDay === 1 ? 'timme' : 'timmar'}
          </span>
        </div>
      </div>

      {/* Typ av hushållsarbete */}
      <div>
        <Label htmlFor="household-type">Välj hushållsaktivitet</Label>
        <Select
          id="household-type"
          value={data.household.selectedHouseholdActivity?.id || ''}
          onChange={e => {
            const selectedId = e.target.value
            const selected = MET_ACTIVITIES.find(activity => activity.id === selectedId)
            onUpdate({
              household: {
                ...data.household,
                selectedHouseholdActivity: selected || null,
              },
            })
          }}
          className="mt-1"
        >
          <option value="">Välj hushållsaktivitet...</option>
          {householdActivities.map(activity => (
            <option key={activity.id} value={activity.id}>
              {activity.activity} ({activity.met} MET)
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
