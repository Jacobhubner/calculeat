/**
 * ProfileCard - Kort för en sparad profil
 * Följer samma mönster som MeasurementSetCard
 * Visar profilnamn, sparaknapp (vid osparade ändringar), och borttagningsknapp
 */

import { useState } from 'react'
import { X, Save, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface ProfileCardProps {
  profile: Profile
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  hasUnsavedChanges?: boolean
  onSave?: () => void
  isSaving?: boolean
  canSave?: boolean
  onNameChange?: (id: string, newName: string) => void
  onReorder?: (e: React.MouseEvent, profileId: string, direction: 'up' | 'down') => void
  isFirst?: boolean
  isLast?: boolean
  reorderPending?: boolean
  profileCount?: number
}

export default function ProfileCard({
  profile,
  isActive,
  onSelect,
  onDelete,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
  canSave = true,
  onNameChange,
  onReorder,
  isFirst = false,
  isLast = false,
  reorderPending = false,
  profileCount = 1,
}: ProfileCardProps) {
  // Local state för redigeringsläge
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(profile.profile_name || '')

  // Generate default name based on profile count
  // First profile: "Profilkort"
  // Subsequent profiles: "Profilkort 1", "Profilkort 2", etc.
  const getDefaultName = () => {
    if (profileCount === 1) return 'Profilkort'
    return `Profilkort ${profileCount - 1}`
  }

  const defaultName = getDefaultName()
  const displayName = profile.profile_name || defaultName

  // Handle name change
  const handleNameBlur = () => {
    if (!onNameChange) return

    const trimmedName = editedName.trim()

    // If empty, use default name
    if (trimmedName === '') {
      onNameChange(profile.id, defaultName)
      setEditedName(defaultName)
    }
    // If changed from previous value, save
    else if (trimmedName !== profile.profile_name) {
      onNameChange(profile.id, trimmedName)
    }
  }

  const handleToggleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isEditingName) {
      // Deactivate editing - save changes
      handleNameBlur()
    } else {
      // Activate editing - initialize with current value
      setEditedName(profile.profile_name || defaultName)
    }

    setIsEditingName(!isEditingName)
  }

  const isUnsaved = profile.id.startsWith('temp-')

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative px-3 py-2.5 rounded-lg cursor-pointer transition-all',
        // Osparade kort (temp-*) - orange streckad ram
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
        {/* Up/Down buttons - only for saved profiles */}
        {onReorder && !isUnsaved && (
          <>
            <button
              onClick={e => onReorder(e, profile.id, 'up')}
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
              onClick={e => onReorder(e, profile.id, 'down')}
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
        {onNameChange && !isUnsaved && (
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
              if (!canSave) return
              onSave()
            }}
            disabled={isSaving || !canSave}
            className={cn(
              'transition-colors p-0.5',
              isSaving || !canSave
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-primary-600 hover:text-primary-700'
            )}
            aria-label={!canSave ? 'Fyll i all grundläggande information först' : 'Spara profil'}
            title={!canSave ? 'Fyll i all grundläggande information först' : 'Spara profil'}
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
          aria-label="Ta bort profil"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
