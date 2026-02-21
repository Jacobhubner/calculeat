import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { MET_ACTIVITIES, MET_CATEGORIES } from '@/lib/constants/metActivities'
import type { UseFormRegister, UseFormWatch } from 'react-hook-form'

interface PALTableActivityLevelWizardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch?: UseFormWatch<any>
  bmr?: number | null
  weight?: number | null
  tdee?: number | null
}

export default function PALTableActivityLevelWizard({
  register,
  watch,
  bmr,
  tdee,
}: PALTableActivityLevelWizardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  // Watch form values if register/watch are available
  const trainingDays = watch?.('training_days_per_week') || 0
  const trainingMinutes = watch?.('training_minutes_per_session') || 0
  const stepsPerDay = watch?.('steps_per_day') || 0
  const hoursStanding = watch?.('hours_standing_per_day') || 0
  const householdHours = watch?.('household_hours_per_day') || 0
  const spaFactor = watch?.('spa_factor') ?? 1.0

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

  // Alla hushållsaktiviteter
  const householdActivities = useMemo(() => {
    return MET_ACTIVITIES.filter(activity => activity.category === 'Hushållsaktiviteter')
  }, [])

  // Kontrollera om alla obligatoriska fält är ifyllda
  const allRequiredFieldsFilled = useMemo(() => {
    const trainingActivityId = watch?.('training_activity_id')

    // Endast 4 fält krävs:
    // 1. Antal dagar per vecka du tränar
    // 2. Antal minuter per träningspass
    // 3. Välj träningsaktivitet
    // 4. Genomsnittligt antal steg per dag
    return trainingDays > 0 && trainingMinutes > 0 && !!trainingActivityId && stepsPerDay > 0
  }, [trainingDays, trainingMinutes, stepsPerDay, watch])

  // Beräkna PAL-värde när alla obligatoriska fält är ifyllda
  const palValue = useMemo(() => {
    if (!bmr || !tdee || bmr <= 0 || !allRequiredFieldsFilled) return null
    return tdee / bmr
  }, [bmr, tdee, allRequiredFieldsFilled])

  if (!register) {
    return (
      <div className="p-4 text-center text-sm text-neutral-600">
        <p>Laddar aktivitetsnivåformulär...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Sektion 1: Träning & Motion */}
      <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-primary-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">1. Träning & Motion</h3>
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
              defaultValue="0"
              className="flex-1"
              {...register('training_days_per_week', { valueAsNumber: true })}
            />
            <span className="text-sm text-neutral-600">7</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-primary-600">
              {trainingDays} {trainingDays === 1 ? 'dag' : 'dagar'}
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
            placeholder="0"
            className="mt-1"
            {...register('training_minutes_per_session', { valueAsNumber: true })}
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
          <Select id="training-type" className="mt-1" {...register('training_activity_id')}>
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

      {/* Sektion 2: Gång & Stående */}
      <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-primary-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">2. Gång & Stående</h3>
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
            placeholder="7000"
            className="mt-1"
            {...register('steps_per_day', { valueAsNumber: true })}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Tips: Använd stegräknare i telefonen för att få genomsnitt
          </p>
        </div>

        {/* Gångtempo */}
        <div>
          <Label htmlFor="walking-tempo">Gångtempo</Label>
          <Select id="walking-tempo" className="mt-1" {...register('walking_activity_id')}>
            {specificWalkingActivities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.activity} ({activity.met} MET)
              </option>
            ))}
          </Select>
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
              defaultValue="0"
              className="flex-1"
              {...register('hours_standing_per_day', { valueAsNumber: true })}
            />
            <span className="text-sm text-neutral-600">16</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-primary-600">
              {hoursStanding} {hoursStanding === 1 ? 'timme' : 'timmar'}
            </span>
          </div>
        </div>
      </div>

      {/* Sektion 3: Hushållsarbete */}
      <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-primary-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">3. Hushållsarbete</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Städning, matlagning, trädgårdsarbete, etc.
          </p>
        </div>

        {/* Timmar per dag */}
        <div>
          <Label htmlFor="household-hours">
            Genomsnittligt antal timmar hushållsarbete per dag
          </Label>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-neutral-600">0</span>
            <input
              id="household-hours"
              type="range"
              min="0"
              max="16"
              step="0.5"
              defaultValue="0"
              className="flex-1"
              {...register('household_hours_per_day', { valueAsNumber: true })}
            />
            <span className="text-sm text-neutral-600">16</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-primary-600">
              {householdHours} {householdHours === 1 ? 'timme' : 'timmar'}
            </span>
          </div>
        </div>

        {/* Typ av hushållsarbete */}
        <div>
          <Label htmlFor="household-type">Välj hushållsaktivitet</Label>
          <Select id="household-type" className="mt-1" {...register('household_activity_id')}>
            <option value="">Välj hushållsaktivitet...</option>
            {householdActivities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.activity} ({activity.met} MET)
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Sektion 4: SPA-faktor */}
      <div className="space-y-4 p-4 bg-white/50 rounded-lg border border-primary-200">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">4. SPA-faktor</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Spontaneous Physical Activity - dina omedvetna rörelser under dagen
          </p>
        </div>

        {/* SPA Slider */}
        <div>
          <Label htmlFor="spa-factor">Välj din SPA-faktor</Label>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-neutral-600 font-medium">0.95</span>
            <input
              id="spa-factor"
              type="range"
              min="0.95"
              max="1.15"
              step="0.01"
              defaultValue="1.00"
              className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              {...register('spa_factor', { valueAsNumber: true })}
            />
            <span className="text-sm text-neutral-600 font-medium">1.15</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-3xl font-bold text-primary-600">{spaFactor.toFixed(2)}</span>
            <p className="text-xs text-neutral-500 mt-1">
              {spaFactor < 1.0
                ? 'Låg spontan aktivitet'
                : spaFactor === 1.0
                  ? 'Normal spontan aktivitet'
                  : spaFactor <= 1.1
                    ? 'Hög spontan aktivitet'
                    : 'Mycket hög spontan aktivitet'}
            </p>
          </div>
        </div>

        {/* Tips-ruta */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <p className="text-sm text-neutral-700">
            <strong>Tips:</strong> De flesta bör använda 1,00 (normalvärde). Använd lägre värden om
            du är ovanligt stillasittande och högre om du är konstant i rörelse utan att det syns i
            träning eller steg.
          </p>
        </div>

        {/* Beräknat PAL-värde */}
        {palValue && (
          <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-primary-800 mb-2">Beräknat PAL-värde</p>
              <p className="text-4xl font-bold text-primary-600">{palValue.toFixed(2)}</p>
              <p className="text-xs text-primary-700 mt-2">
                Detta värde baseras på din inmatade aktivitetsinformation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
