/**
 * MeasurementSetList - Lista med alla sparade och osparade mätset
 */

import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import { useMeasurementSets, useDeleteMeasurementSet } from '@/hooks'
import MeasurementSetCard from './MeasurementSetCard'

interface MeasurementSetListProps {
  hasUnsavedChanges?: boolean
  onSelectSet: (setId: string) => void
  onSaveSet: (setId: string) => void
  isSaving?: boolean
}

export default function MeasurementSetList({
  hasUnsavedChanges = false,
  onSelectSet,
  onSaveSet,
  isSaving = false,
}: MeasurementSetListProps) {
  const activeMeasurementSet = useMeasurementSetStore(state => state.activeMeasurementSet)
  const unsavedMeasurementSets = useMeasurementSetStore(state => state.unsavedMeasurementSets)
  const { data: measurementSets = [], isLoading } = useMeasurementSets()
  const deleteSetMutation = useDeleteMeasurementSet()

  const handleSelect = (setId: string) => {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges && activeMeasurementSet?.id !== setId) {
      const confirmed = window.confirm(
        'Du har osparade ändringar. Vill du fortsätta? Ändringar kommer att förloras.'
      )
      if (!confirmed) return
    }

    onSelectSet(setId)
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

  // Combine unsaved and saved sets
  const allSets = [...unsavedMeasurementSets, ...measurementSets]

  if (isLoading) {
    return <div className="text-sm text-neutral-500 text-center py-4">Laddar mätningar...</div>
  }

  if (allSets.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-4">
        Inga sparade mätningar ännu. Fyll i mätningar och spara!
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {allSets.map(set => {
        const isActive = activeMeasurementSet?.id === set.id
        const showSaveIcon = isActive && hasUnsavedChanges

        return (
          <MeasurementSetCard
            key={set.id}
            measurementSet={set}
            isActive={isActive}
            onSelect={() => handleSelect(set.id)}
            onDelete={() => handleDelete(set.id, set.set_date)}
            hasUnsavedChanges={showSaveIcon}
            onSave={() => onSaveSet(set.id)}
            isSaving={isSaving}
          />
        )
      })}
    </div>
  )
}
