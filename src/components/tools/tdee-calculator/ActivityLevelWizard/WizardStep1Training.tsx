import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MET_ACTIVITIES, MET_CATEGORIES } from '@/lib/constants/metActivities'
import type { WizardStepProps } from './types'

export default function WizardStep1Training({ data, onUpdate }: WizardStepProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrera alla aktiviteter baserat på sökning
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) {
      return MET_ACTIVITIES
    }
    const search = searchTerm.toLowerCase()
    return MET_ACTIVITIES.filter(
      activity =>
        activity.activity.toLowerCase().includes(search) ||
        activity.description?.toLowerCase().includes(search) ||
        activity.category.toLowerCase().includes(search)
    )
  }, [searchTerm])

  // Gruppera aktiviteter per kategori
  const activitiesByCategory = useMemo(() => {
    const grouped: Record<string, typeof MET_ACTIVITIES> = {}
    filteredActivities.forEach(activity => {
      if (!grouped[activity.category]) {
        grouped[activity.category] = []
      }
      grouped[activity.category].push(activity)
    })
    return grouped
  }, [filteredActivities])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900">Träning & Motion</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Berätta om din regelbundna träning (gym, löpning, sport, etc.)
        </p>
      </div>

      {/* Antal dagar per vecka */}
      <div>
        <Label htmlFor="training-days">Antal dagar per vecka du tränar</Label>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-neutral-600">0</span>
          <input
            id="training-days"
            type="range"
            min="0"
            max="7"
            step="1"
            value={data.training.daysPerWeek}
            onChange={e =>
              onUpdate({
                training: {
                  ...data.training,
                  daysPerWeek: parseInt(e.target.value),
                },
              })
            }
            className="flex-1"
          />
          <span className="text-sm text-neutral-600">7</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-2xl font-bold text-primary-600">
            {data.training.daysPerWeek} {data.training.daysPerWeek === 1 ? 'dag' : 'dagar'}
          </span>
        </div>
      </div>

      {/* Minuter per träningspass */}
      <div>
        <Label htmlFor="training-minutes">Antal minuter per träningspass</Label>
        <Input
          id="training-minutes"
          type="number"
          min="0"
          max="300"
          step="1"
          value={data.training.minutesPerSession === 0 ? '' : data.training.minutesPerSession}
          onChange={e => {
            const value = e.target.value
            if (value === '') {
              onUpdate({
                training: {
                  ...data.training,
                  minutesPerSession: 0,
                },
              })
            } else {
              const parsed = parseFloat(value.replace(',', '.'))
              if (!isNaN(parsed)) {
                onUpdate({
                  training: {
                    ...data.training,
                    minutesPerSession: Math.min(300, Math.max(0, parsed)),
                  },
                })
              }
            }
          }}
          placeholder="0"
          className="mt-1"
        />
      </div>

      {/* Typ av träning - Sökbar lista */}
      <div>
        <Label htmlFor="training-search">Sök träningsaktivitet</Label>
        <Input
          id="training-search"
          type="text"
          placeholder="Sök på aktivitet, beskrivning eller kategori..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-neutral-500 mt-1">
          {filteredActivities.length} aktiviteter hittade
        </p>
      </div>

      <div>
        <Label htmlFor="training-type">Välj träningsaktivitet</Label>
        <Select
          id="training-type"
          value={data.training.selectedActivity?.id || ''}
          onChange={e => {
            const selectedId = e.target.value
            const selected = MET_ACTIVITIES.find(activity => activity.id === selectedId)
            onUpdate({
              training: {
                ...data.training,
                selectedActivity: selected || null,
              },
            })
          }}
          className="mt-1"
        >
          <option value="">Välj träningsaktivitet...</option>
          {MET_CATEGORIES.map(category => {
            const categoryActivities = activitiesByCategory[category]
            if (!categoryActivities || categoryActivities.length === 0) return null
            return (
              <optgroup key={category} label={category}>
                {categoryActivities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.activity} ({activity.met} MET)
                  </option>
                ))}
              </optgroup>
            )
          })}
        </Select>
      </div>
    </div>
  )
}
