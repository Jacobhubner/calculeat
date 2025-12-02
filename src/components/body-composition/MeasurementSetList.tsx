/**
 * MeasurementSetList - Lista med alla sparade mätset
 */

import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import { useMeasurementSets, useDeleteMeasurementSet } from '@/hooks'
import MeasurementSetCard from './MeasurementSetCard'

export default function MeasurementSetList() {
  const activeMeasurementSet = useMeasurementSetStore(state => state.activeMeasurementSet)
  const setActiveMeasurementSet = useMeasurementSetStore(state => state.setActiveMeasurementSet)
  const { data: measurementSets = [], isLoading } = useMeasurementSets()
  const deleteSetMutation = useDeleteMeasurementSet()

  const handleSelect = (set: (typeof measurementSets)[0]) => {
    setActiveMeasurementSet(set)
  }

  const handleDelete = async (id: string, date: string) => {
    const displayDate = new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const confirmed = window.confirm(
      `Är du säker på att du vill ta bort mätset från ${displayDate}? Detta går inte att ångra.`
    )

    if (!confirmed) return

    try {
      await deleteSetMutation.mutateAsync(id)
      // Toast is handled by useDeleteMeasurementSet hook
    } catch (error) {
      console.error('Error deleting measurement set:', error)
      // Error toast is also handled by the hook
    }
  }

  if (isLoading) {
    return <div className="text-sm text-neutral-500 text-center py-4">Laddar mätningar...</div>
  }

  if (measurementSets.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-4">
        Inga sparade mätningar ännu. Fyll i mätningar och spara!
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {measurementSets.map(set => (
        <MeasurementSetCard
          key={set.id}
          measurementSet={set}
          isActive={activeMeasurementSet?.id === set.id}
          onSelect={() => handleSelect(set)}
          onDelete={() => handleDelete(set.id, set.set_date)}
        />
      ))}
    </div>
  )
}
