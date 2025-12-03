/**
 * MeasurementSetCard - Kort för ett sparat mätset
 * Visar datum, sparaknapp (vid osparade ändringar), och borttagningsknapp
 */

import { X, Save } from 'lucide-react'
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
}

export default function MeasurementSetCard({
  measurementSet,
  isActive,
  onSelect,
  onDelete,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
}: MeasurementSetCardProps) {
  // Format date for display (e.g., "2025-01-15" -> "15 jan 2025")
  const displayDate = new Date(measurementSet.set_date).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm',
        isActive
          ? 'border-l-4 border-l-primary-600 bg-primary-50/50 border-primary-400'
          : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
      )}
    >
      <h4 className="font-medium text-sm pr-12">{displayDate}</h4>

      {/* Save button - only visible when there are unsaved changes */}
      {hasUnsavedChanges && onSave && (
        <button
          onClick={e => {
            e.stopPropagation()
            onSave()
          }}
          disabled={isSaving}
          className={cn(
            'absolute top-2 right-8 transition-colors',
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
        className="absolute top-2 right-2 text-neutral-400 hover:text-red-500 transition-colors"
        aria-label="Ta bort mätset"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
