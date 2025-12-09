/**
 * MeasurementSetList - Lista med alla sparade och osparade mätset
 */

import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import {
  useMeasurementSets,
  useDeleteMeasurementSet,
  useUpdateMeasurementSetName,
  useReorderMeasurementSets,
} from '@/hooks'
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
  const updateNameMutation = useUpdateMeasurementSetName()
  const reorderSetMutation = useReorderMeasurementSets()

  // Handler for name change
  const handleNameChange = (id: string, newName: string | null) => {
    updateNameMutation.mutate({ id, name: newName })
  }

  // Handler for reordering (only for saved sets, not temp)
  const handleReorder = async (e: React.MouseEvent, setId: string, direction: 'up' | 'down') => {
    e.stopPropagation()

    try {
      await reorderSetMutation.mutateAsync({
        setId,
        direction,
        allSets: measurementSets, // Only pass saved sets, not unsaved
      })
    } catch {
      // Error toast is handled by useReorderMeasurementSets hook
    }
  }

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

  // Sort saved sets by display_order
  const sortedSavedSets = [...measurementSets].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  )

  // Combine unsaved (always first) and saved sets
  const allSets = [...unsavedMeasurementSets, ...sortedSavedSets]

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
        const isUnsaved = set.id.startsWith('temp-')

        // For reorder buttons: only show for saved sets
        // Calculate index within saved sets only (excluding unsaved)
        const savedSetIndex = isUnsaved ? -1 : sortedSavedSets.findIndex(s => s.id === set.id)
        const isFirst = savedSetIndex === 0
        const isLast = savedSetIndex === sortedSavedSets.length - 1

        // Calculate duplicate index for cards with same date
        // The NEWEST card (unsaved, earlier in list) gets a number
        // The OLDEST card (saved first, later in list) has NO number
        // Strategy:
        // - Find total count of cards with same date
        // - First card in list (index 0 for that date) gets highest number
        // - Last card in list gets no number (0)
        const cardsWithSameDate = allSets.filter(s => s.set_date === set.set_date)
        const totalWithSameDate = cardsWithSameDate.length

        let duplicateIndex = 0
        if (totalWithSameDate > 1) {
          // Find this card's position among cards with same date (0 = first/newest)
          const positionInGroup = cardsWithSameDate.findIndex(s => s.id === set.id)
          // First/newest card gets (total - 1), second gets (total - 2), last gets 0
          duplicateIndex = totalWithSameDate - 1 - positionInGroup
        }

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
            onNameChange={handleNameChange}
            onReorder={isUnsaved ? undefined : handleReorder}
            isFirst={isFirst}
            isLast={isLast}
            reorderPending={reorderSetMutation.isPending}
            duplicateIndex={duplicateIndex}
          />
        )
      })}
    </div>
  )
}
