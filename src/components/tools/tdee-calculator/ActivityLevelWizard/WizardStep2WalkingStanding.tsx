import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MET_ACTIVITIES } from '@/lib/constants/metActivities'
import type { WizardStepProps } from './types'

export default function WizardStep2WalkingStanding({ data, onUpdate }: WizardStepProps) {
  // Specifika gångalternativ
  const specificWalkingActivities = useMemo(() => {
    const targetActivities = [
      'Gång, <3,2 km/h, plan, mycket långsam',
      'Gång, 3,2–3,9 km/h, plan, långsam takt, fast underlag',
      'Gång, 4 km/h, plan, fast underlag',
      'Gång, 4,5–5,5 km/h, plan, måttlig takt, fast underlag',
      'Gång, 5,6–6,3 km/h, plan, rask, fast underlag, träningspromenad',
      'Gång, 6,4–7 km/h, plan, mycket rask takt',
      'Gång, 7,2–7,9 km/h, plan, mycket, mycket rask',
      'Gång, 8–8,9 km/h, plan, fast underlag',
    ]

    return MET_ACTIVITIES.filter(
      activity => activity.category === 'Gång' && targetActivities.includes(activity.activity)
    )
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Gång & Stående</h3>
        <p className="text-sm text-neutral-600 mt-1">Din vardagsaktivitet utanför träning</p>
      </div>

      {/* Steg per dag */}
      <div>
        <Label htmlFor="steps-per-day">Genomsnittligt antal steg per dag</Label>
        <Input
          id="steps-per-day"
          type="number"
          min="0"
          max="30000"
          step="1"
          value={data.walking.stepsPerDay === 0 ? '' : data.walking.stepsPerDay}
          onChange={e => {
            const value = e.target.value
            if (value === '') {
              onUpdate({
                walking: {
                  ...data.walking,
                  stepsPerDay: 0,
                },
              })
            } else {
              const parsed = parseFloat(value.replace(',', '.'))
              if (!isNaN(parsed)) {
                onUpdate({
                  walking: {
                    ...data.walking,
                    stepsPerDay: Math.min(30000, Math.max(0, parsed)),
                  },
                })
              }
            }
          }}
          placeholder="0"
          className="mt-1"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Tips: Använd stegräknare i telefonen för att få genomsnitt
        </p>
      </div>

      {/* Timmar stående */}
      <div>
        <Label htmlFor="hours-standing">Antal timmar stående per dag</Label>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-neutral-600">0</span>
          <input
            id="hours-standing"
            type="range"
            min="0"
            max="16"
            step="0.5"
            value={data.walking.hoursStandingPerDay}
            onChange={e =>
              onUpdate({
                walking: {
                  ...data.walking,
                  hoursStandingPerDay: parseFloat(e.target.value),
                },
              })
            }
            className="flex-1"
          />
          <span className="text-sm text-neutral-600">16</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-2xl font-bold text-primary-600">
            {data.walking.hoursStandingPerDay}{' '}
            {data.walking.hoursStandingPerDay === 1 ? 'timme' : 'timmar'}
          </span>
        </div>
      </div>

      {/* Gångtempo */}
      <div>
        <Label htmlFor="walking-tempo">Gångtempo (om du går mycket)</Label>
        <Select
          id="walking-tempo"
          value={data.walking.selectedWalkActivity?.id || ''}
          onChange={e => {
            const selectedId = e.target.value
            const selected = MET_ACTIVITIES.find(activity => activity.id === selectedId)
            onUpdate({
              walking: {
                ...data.walking,
                selectedWalkActivity: selected || null,
              },
            })
          }}
          className="mt-1"
        >
          <option value="">Välj gångtempo...</option>
          {specificWalkingActivities.map(activity => (
            <option key={activity.id} value={activity.id}>
              {activity.activity} ({activity.met} MET)
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
