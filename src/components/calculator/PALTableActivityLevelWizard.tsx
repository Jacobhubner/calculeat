import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
  const [isSPAExpanded, setIsSPAExpanded] = useState(false)

  // Watch form values if register/watch are available
  const trainingDays = watch?.('training_days_per_week') || 0
  const trainingMinutes = watch?.('training_minutes_per_session') || 0
  const stepsPerDay = watch?.('steps_per_day') || 7000
  const hoursStanding = watch?.('hours_standing_per_day') || 0
  const householdHours = watch?.('household_hours_per_day') || 0
  const spaFactor = watch?.('spa_factor') || 1.1

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

  // Detektera om användaren har interagerat med formuläret
  const userHasInteracted = useMemo(() => {
    const trainingActivityId = watch?.('training_activity_id')
    const householdActivityId = watch?.('household_activity_id')

    // Användaren har interagerat om något av följande är sant:
    return (
      trainingDays > 0 ||
      trainingMinutes > 0 ||
      !!trainingActivityId ||
      stepsPerDay !== 7000 ||
      hoursStanding > 0 ||
      householdHours > 0 ||
      !!householdActivityId ||
      Math.abs(spaFactor - 1.1) > 0.001
    )
  }, [trainingDays, trainingMinutes, stepsPerDay, hoursStanding, householdHours, spaFactor, watch])

  // Kontrollera om alla nödvändiga fält är ifyllda
  const allFieldsFilled = useMemo(() => {
    const trainingActivityId = watch?.('training_activity_id')
    const walkingActivityId = watch?.('walking_activity_id')
    const householdActivityId = watch?.('household_activity_id')

    // Träning: Antingen 0 dagar OCH inga minuter OCH ingen aktivitet
    // ELLER alla tre (dagar > 0, minuter > 0, aktivitet vald)
    const trainingValid =
      (trainingDays === 0 && trainingMinutes === 0 && !trainingActivityId) ||
      (trainingDays > 0 && trainingMinutes > 0 && trainingActivityId)

    // Gång: Både steg OCH tempo måste vara ifyllda (båda har defaults så detta borde alltid vara sant)
    const walkingValid = stepsPerDay > 0 && walkingActivityId

    // Stående: Antingen 0 timmar (inget stående)
    // ELLER minst 0.5 timmar har angivits
    const standingValid = hoursStanding >= 0

    // Hushåll: Antingen 0 timmar OCH ingen aktivitet
    // ELLER timmar > 0 OCH aktivitet vald
    const householdValid =
      (householdHours === 0 && !householdActivityId) || (householdHours > 0 && householdActivityId)

    // SPA-faktor måste vara inom intervallet
    const spaValid = spaFactor >= 1.05 && spaFactor <= 1.2

    return trainingValid && walkingValid && standingValid && householdValid && spaValid
  }, [trainingDays, trainingMinutes, stepsPerDay, hoursStanding, householdHours, spaFactor, watch])

  // Beräkna PAL-värde endast när användaren har interagerat OCH alla fält är korrekt ifyllda
  const palValue = useMemo(() => {
    if (!bmr || !tdee || bmr <= 0 || !allFieldsFilled || !userHasInteracted) return null
    return tdee / bmr
  }, [bmr, tdee, allFieldsFilled, userHasInteracted])

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
            defaultValue="7000"
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

        {/* Informationsruta - Expanderbar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIsSPAExpanded(!isSPAExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="text-left">
              <h4 className="font-medium text-blue-900">Vad är SPA?</h4>
              {!isSPAExpanded && (
                <p className="text-sm text-blue-800 mt-1">
                  SPA (Spontaneous Physical Activity) är en delkomponent av...
                </p>
              )}
            </div>
            {isSPAExpanded ? (
              <ChevronUp className="h-5 w-5 text-blue-900 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-900 flex-shrink-0" />
            )}
          </button>

          {isSPAExpanded && (
            <div className="px-4 pb-4">
              <p className="text-sm text-blue-800 mb-3">
                SPA (Spontaneous Physical Activity) är en delkomponent av NEAT (Non-Exercise
                Activity Thermogenesis) och representerar spontan fysisk aktivitet utöver
                viloomsättningen. Litteraturen visar att NEAT kan utgöra ca. 6–10 % av TDEE hos
                stillasittande individer, 15–30 % vid normal till hög vardagsaktivitet, och i
                extrema fall ≥50 % av TDEE (Levine, 2002, 2004, 2015).
              </p>
              <p className="text-sm text-blue-800 mb-3">
                SPA inkluderar omedvetna rörelser såsom fingertrummande, positionsbyten, muskeltonus
                och nervös energi. Vissa personer bränner mycket mer energi genom dessa rörelser än
                andra.
              </p>
              <div className="text-sm text-blue-800 mb-3">
                <p className="font-medium mb-2">SPA-faktor (modellering):</p>
                <ul className="space-y-1 ml-4">
                  <li>
                    <strong>1,05 – Låg SPA:</strong> Mycket stillasittande, minimal spontan rörelse
                  </li>
                  <li>
                    <strong>1,10 – Normal SPA:</strong> Genomsnittlig spontan aktivitet
                    (standardvärde)
                  </li>
                  <li>
                    <strong>1,20 – Hög SPA:</strong> Mycket orolig, hög spontan rörelse
                  </li>
                </ul>
              </div>
              <p className="text-xs text-blue-700 italic">
                Dessa faktorer är konservativa modelleringsvärden applicerade på BMR, baserade på
                NEAT-litteraturen (Levine, 2002, 2004, 2015).
              </p>
            </div>
          )}
        </div>

        {/* SPA Slider */}
        <div>
          <Label htmlFor="spa-factor">Välj din SPA-faktor</Label>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-neutral-600 font-medium">1.05</span>
            <input
              id="spa-factor"
              type="range"
              min="1.05"
              max="1.20"
              step="0.01"
              defaultValue="1.10"
              className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              {...register('spa_factor', { valueAsNumber: true })}
            />
            <span className="text-sm text-neutral-600 font-medium">1.20</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-3xl font-bold text-primary-600">{spaFactor.toFixed(2)}</span>
          </div>
        </div>

        {/* Tips-ruta */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <p className="text-sm text-neutral-700">
            <strong>Tips:</strong> De flesta bör använda 1.10 (normalvärde). Använd endast andra
            värden om du vet att du har ovanligt hög eller låg spontan aktivitet.
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
