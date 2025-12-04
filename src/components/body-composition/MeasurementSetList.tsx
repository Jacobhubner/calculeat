/**
 * MeasurementSetList - Lista med alla sparade och osparade mätset
 */

import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import { useMeasurementSets, useDeleteMeasurementSet } from '@/hooks'
import MeasurementSetCard from './MeasurementSetCard'
import { toast } from 'sonner'

interface MeasurementSetListProps {
  hasUnsavedChanges?: boolean
  onSelectSet: (setId: string) => void
  onSaveSet: (setId: string) => void
  onDeleteSet?: (setId: string) => void
  isSaving?: boolean
}

export default function MeasurementSetList({
  hasUnsavedChanges = false,
  onSelectSet,
  onSaveSet,
  onDeleteSet,
  isSaving = false,
}: MeasurementSetListProps) {
  const activeMeasurementSet = useMeasurementSetStore(state => state.activeMeasurementSet)
  const setActiveMeasurementSet = useMeasurementSetStore(state => state.setActiveMeasurementSet)
  const unsavedMeasurementSets = useMeasurementSetStore(state => state.unsavedMeasurementSets)
  const removeUnsavedMeasurementSet = useMeasurementSetStore(
    state => state.removeUnsavedMeasurementSet
  )
  const { data: measurementSets = [], isLoading } = useMeasurementSets()
  const deleteSetMutation = useDeleteMeasurementSet()

  const handleSelect = (setId: string) => {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges && activeMeasurementSet?.id !== setId) {
      const confirmed = window.confirm(
        'Du har osparade ändringar. Vill du fortsätta? Ändringar kommer att förloras.'
      )
      if (!confirmed) return

      // Rensa tidigare osparat kort om det finns
      if (activeMeasurementSet?.id.startsWith('temp-') && onDeleteSet) {
        onDeleteSet(activeMeasurementSet.id)
      }
    }

    onSelectSet(setId)
  }

  const handleDelete = async (id: string, date: string, createdAt: string) => {
    const displayDate = new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const displayTime = new Date(createdAt).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const confirmed = window.confirm(
      `Är du säker på att du vill ta bort mätset från ${displayDate} - ${displayTime}? Detta går inte att ångra.`
    )

    if (!confirmed) return

    // Check if this is an unsaved (temp) set
    if (id.startsWith('temp-')) {
      // Remove from local unsaved sets
      removeUnsavedMeasurementSet(id)
      // If it was the active set, clear active
      if (activeMeasurementSet?.id === id) {
        setActiveMeasurementSet(null)
      }
      toast.success('Mätning borttagen', {
        description: `${displayDate} - ${displayTime} har tagits bort`,
      })
      return
    }

    // For saved sets, delete from database
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
            onDelete={() => handleDelete(set.id, set.set_date, set.created_at)}
            hasUnsavedChanges={showSaveIcon}
            onSave={() => onSaveSet(set.id)}
            isSaving={isSaving}
          />
        )
      })}
    </div>
  )
}
