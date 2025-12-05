/**
 * MeasurementSetCard - Kort för ett sparat mätset
 * Visar datum, sparaknapp (vid osparade ändringar), och borttagningsknapp
 */

import { useState } from 'react'
import { X, Save, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MeasurementSet } from '@/lib/types'

interface MeasurementSetCardProps {
  measurementSet: MeasurementSet
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isSaving?: boolean
  onNameChange?: (id: string, newName: string | null) => void
  onReorder?: (e: React.MouseEvent, setId: string, direction: 'up' | 'down') => void
  isFirst?: boolean
  isLast?: boolean
  reorderPending?: boolean
}

export default function MeasurementSetCard({
  measurementSet,
  isActive,
  onSelect,
  onDelete,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
  onNameChange,
  onReorder,
  isFirst = false,
  isLast = false,
  reorderPending = false,
}: MeasurementSetCardProps) {
  // Local state för redigeringsläge
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(measurementSet.name || '')
  // Format date for display (e.g., "2025-01-15" -> "15 jan 2025")
  const displayDate = new Date(measurementSet.set_date).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Format time from created_at (e.g., "2025-01-15T09:30:00" -> "09:30")
  const displayTime = new Date(measurementSet.created_at).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Combine date and time as default name
  const defaultName = `${displayDate} - ${displayTime}`

  // Show custom name if set, otherwise show default name
  const displayName = measurementSet.name || defaultName

  // Handle name change
  const handleNameBlur = () => {
    if (!onNameChange) return

    const trimmedName = editedName.trim()

    // If empty, reset to default name (NULL in DB)
    if (trimmedName === '') {
      onNameChange(measurementSet.id, null)
      setEditedName('')
    }
    // If changed from previous value, save
    else if (trimmedName !== measurementSet.name) {
      onNameChange(measurementSet.id, trimmedName)
    }
  }

  const handleToggleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isEditingName) {
      // Deactivate editing - save changes
      handleNameBlur()
    } else {
      // Activate editing - initialize with current value
      setEditedName(measurementSet.name || '')
    }

    setIsEditingName(!isEditingName)
  }

  const isUnsaved = measurementSet.id.startsWith('temp-')

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative px-3 py-2.5 rounded-lg cursor-pointer transition-all',
        // Osparade kort (temp-*) - gul/orange streckad ram
        isUnsaved && [
          'border-2 border-dashed',
          isActive
            ? 'border-l-4 border-l-amber-500 border-amber-300 bg-amber-50/30 shadow-sm'
            : 'border-amber-300 bg-amber-50/20 hover:border-amber-400 hover:shadow-md',
        ],
        // Sparade kort - normal grön/neutral styling
        !isUnsaved && [
          'border-2',
          isActive
            ? 'border-l-4 border-l-primary-600 bg-primary-50/50 border-primary-500'
            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 hover:shadow-sm',
        ]
      )}
    >
      {/* Name display - either input or text */}
      {isEditingName ? (
        <input
          type="text"
          value={editedName}
          onChange={e => setEditedName(e.target.value)}
          onBlur={handleNameBlur}
          onClick={e => e.stopPropagation()}
          placeholder={defaultName}
          autoFocus
          className="w-full font-medium text-sm pr-20 bg-white border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <h4 className="font-medium text-sm pr-20">{displayName}</h4>
      )}

      {/* Button container - absolute positioned in top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {/* Up/Down buttons - only for saved sets */}
        {onReorder && (
          <>
            <button
              onClick={e => onReorder(e, measurementSet.id, 'up')}
              disabled={isFirst || reorderPending}
              className={cn(
                'p-0.5 rounded transition-colors',
                isFirst || reorderPending
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
              )}
              title="Flytta upp"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={e => onReorder(e, measurementSet.id, 'down')}
              disabled={isLast || reorderPending}
              className={cn(
                'p-0.5 rounded transition-colors',
                isLast || reorderPending
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
              )}
              title="Flytta ned"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Edit button (Pencil) - hide for temp cards */}
        {onNameChange && !measurementSet.id.startsWith('temp-') && (
          <button
            onClick={handleToggleEdit}
            className={cn(
              'transition-all p-0.5 rounded',
              isEditingName
                ? 'text-primary-600 bg-primary-100' // Pressed state
                : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
            )}
            aria-label={isEditingName ? 'Avsluta redigering' : 'Redigera namn'}
            title={isEditingName ? 'Klicka för att spara' : 'Redigera namn'}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Save button - only visible when there are unsaved changes */}
        {hasUnsavedChanges && onSave && (
          <button
            onClick={e => {
              e.stopPropagation()
              onSave()
            }}
            disabled={isSaving}
            className={cn(
              'transition-colors p-0.5',
              isSaving
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-primary-600 hover:text-primary-700'
            )}
            aria-label="Spara mätningar"
            title="Spara mätningar"
          >
            <Save className="h-4 w-4" />
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-neutral-400 hover:text-red-500 transition-colors p-0.5"
          aria-label="Ta bort mätset"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
