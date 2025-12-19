/**
 * ProfileCardList - Lista med alla sparade profiler
 * Följer samma mönster som MeasurementSetList
 */

import { useProfileStore } from '@/stores/profileStore'
import {
  useProfiles,
  useDeleteProfile,
  useUpdateProfile,
  useReorderProfiles,
} from '@/hooks'
import ProfileCard from './ProfileCard'
import { toast } from 'sonner'

interface ProfileCardListProps {
  hasUnsavedChanges?: boolean
  onSelectProfile: (profileId: string) => void
  onSaveProfile: (profileId: string) => void
  onDeleteProfile?: (profileId: string) => void
  isSaving?: boolean
  canSave?: boolean
}

export default function ProfileCardList({
  hasUnsavedChanges = false,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
  isSaving = false,
  canSave = true,
}: ProfileCardListProps) {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const setActiveProfile = useProfileStore(state => state.setActiveProfile)
  const { data: profiles = [], isLoading } = useProfiles()
  const deleteProfileMutation = useDeleteProfile()
  const updateProfileMutation = useUpdateProfile()
  const reorderProfileMutation = useReorderProfiles()

  // Handler for name change
  const handleNameChange = (id: string, newName: string) => {
    // Check if this name already exists in other profiles
    const profilesWithSameName = profiles.filter(p => p.id !== id && p.profile_name === newName)

    // If name exists, find the next available number
    if (profilesWithSameName.length > 0) {
      // Find all profiles with names matching pattern "newName (X)"
      const pattern = new RegExp(`^${newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\((\\d+)\\)$`)
      const numberedProfiles = profiles
        .filter(p => p.id !== id && p.profile_name && pattern.test(p.profile_name))
        .map(p => {
          const match = p.profile_name!.match(pattern)
          return match ? parseInt(match[1], 10) : 0
        })

      // Find next available number: start from 1
      let nextNumber = 1
      while (numberedProfiles.includes(nextNumber)) {
        nextNumber++
      }

      const finalName = `${newName} (${nextNumber})`
      updateProfileMutation.mutate({ profileId: id, data: { profile_name: finalName }, silent: true })
    } else {
      // Name is unique, use it directly
      updateProfileMutation.mutate({ profileId: id, data: { profile_name: newName }, silent: true })
    }
  }

  // Handler for reordering
  const handleReorder = async (e: React.MouseEvent, profileId: string, direction: 'up' | 'down') => {
    e.stopPropagation()

    try {
      await reorderProfileMutation.mutateAsync({
        profileId,
        direction,
        allProfiles: profiles,
      })
    } catch {
      // Error toast is handled by useReorderProfiles hook
    }
  }

  const handleSelect = (profileId: string) => {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges && activeProfile?.id !== profileId) {
      const confirmed = window.confirm(
        'Du har osparade ändringar. Vill du fortsätta? Ändringar kommer att förloras.'
      )
      if (!confirmed) return

      // Clear previous unsaved profile if it exists
      if (activeProfile?.id.startsWith('temp-') && onDeleteProfile) {
        onDeleteProfile(activeProfile.id)
      }
    }

    onSelectProfile(profileId)
  }

  const handleDelete = async (id: string, profileName: string) => {
    const confirmed = window.confirm(
      `Är du säker på att du vill ta bort profilen "${profileName}"? Detta går inte att ångra.`
    )

    if (!confirmed) return

    // Check if this is an unsaved (temp) profile
    if (id.startsWith('temp-')) {
      // If it was the active profile, clear active
      if (activeProfile?.id === id) {
        setActiveProfile(null)
      }
      toast.success('Profil borttagen', {
        description: `${profileName} har tagits bort`,
      })
      return
    }

    // For saved profiles, delete from database
    try {
      await deleteProfileMutation.mutateAsync(id)
      // Toast is handled by useDeleteProfile hook
    } catch (error) {
      console.error('Error deleting profile:', error)
      // Error toast is also handled by the hook
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Sort profiles by display_order
  const sortedProfiles = [...profiles].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  )

  if (sortedProfiles.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <p className="text-sm">Inga profiler ännu</p>
        <p className="text-xs mt-1">Klicka på + för att skapa en ny profil</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedProfiles.map((profile, index) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          isActive={activeProfile?.id === profile.id}
          onSelect={() => handleSelect(profile.id)}
          onDelete={() => handleDelete(profile.id, profile.profile_name)}
          hasUnsavedChanges={
            hasUnsavedChanges && activeProfile?.id === profile.id
          }
          onSave={onSaveProfile ? () => onSaveProfile(profile.id) : undefined}
          isSaving={isSaving}
          canSave={canSave}
          onNameChange={handleNameChange}
          onReorder={handleReorder}
          isFirst={index === 0}
          isLast={index === sortedProfiles.length - 1}
          reorderPending={reorderProfileMutation.isPending}
          profileCount={index + 1}
        />
      ))}
    </div>
  )
}
