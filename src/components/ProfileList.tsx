/**
 * ProfileList - Lista med alla profiler
 */

import { useProfileStore } from '@/stores/profileStore'
import { useProfiles, useSwitchProfile, useDeleteProfile, useReorderProfiles } from '@/hooks'
import { X, FileEdit, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProfileList() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const setActiveProfile = useProfileStore(state => state.setActiveProfile)
  const { data: profiles = [], isLoading } = useProfiles()
  const switchProfileMutation = useSwitchProfile()
  const deleteProfileMutation = useDeleteProfile()
  const reorderProfileMutation = useReorderProfiles()

  // Check if we're in "new profile" mode
  const isCreatingNewProfile = activeProfile === null && profiles.length > 0

  // Sort profiles by display_order
  const sortedProfiles = [...profiles].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  )

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId !== activeProfile?.id) {
      await switchProfileMutation.mutateAsync(profileId)
    }
  }

  const handleSelectNewProfile = () => {
    // Switch back to new profile mode
    setActiveProfile(null)
  }

  const handleDeleteProfile = async (
    e: React.MouseEvent,
    profileId: string,
    profileName: string
  ) => {
    // Stoppa event propagation så att kortet inte klickas
    e.stopPropagation()

    console.log('🗑️ Delete requested. Profiles count:', profiles.length)

    // Validera att det inte är sista profilen
    if (profiles.length === 1) {
      console.log('❌ Cannot delete - only one profile remains')
      toast.error('Du måste ha minst en profil kvar')
      return
    }

    // Bekräftelse
    const confirmed = window.confirm(
      `Är du säker på att du vill radera profilen "${profileName}"? Detta går inte att ångra.`
    )

    if (!confirmed) return

    console.log('✅ Attempting to delete profile:', profileId)

    try {
      await deleteProfileMutation.mutateAsync(profileId)
      console.log('✅ Profile deleted successfully')
      // Toast is handled by useDeleteProfile hook
    } catch (error) {
      console.error('❌ Error deleting profile:', error)
      // Error toast is also handled by the hook
    }
  }

  const handleReorder = async (
    e: React.MouseEvent,
    profileId: string,
    direction: 'up' | 'down'
  ) => {
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

  if (isLoading) {
    return <div className="text-sm text-neutral-500 text-center py-4">Laddar profiler...</div>
  }

  if (profiles.length === 0) {
    return (
      <div className="text-sm text-neutral-500 text-center py-4">
        Inga profiler ännu. Skapa din första profil!
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {/* Temporary "Unsaved Profile" card when creating new profile */}
      {isCreatingNewProfile && (
        <div
          onClick={handleSelectNewProfile}
          className={cn(
            'relative px-3 py-2 rounded-lg border-2 border-dashed transition-all cursor-pointer group',
            'border-l-4 border-l-amber-500 border-amber-300 bg-amber-50/30 shadow-sm',
            'hover:border-amber-400 hover:shadow-md'
          )}
        >
          <div className="flex items-center gap-3">
            {/* Draft Icon */}
            <FileEdit className="h-4 w-4 text-amber-600 flex-shrink-0" />

            {/* Profile Name */}
            <h4 className="text-sm font-medium italic text-amber-900 flex-1">
              Ny profil (ej sparad)
            </h4>
          </div>
        </div>
      )}

      {/* Existing saved profiles */}
      {sortedProfiles.map((profile, index) => {
        const isActive = profile.id === activeProfile?.id
        const isFirst = index === 0
        const isLast = index === sortedProfiles.length - 1

        return (
          <div
            key={profile.id}
            onClick={() => handleSwitchProfile(profile.id)}
            className={cn(
              'relative px-3 py-2 rounded-lg border-2 transition-all cursor-pointer group',
              'hover:border-primary-400 hover:shadow-sm',
              isActive
                ? 'border-l-4 border-l-primary-600 border-primary-500 bg-primary-50/50 shadow-sm'
                : 'border-neutral-200 bg-white hover:bg-neutral-50'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Profile Name */}
              <h4
                className={cn(
                  'text-sm font-medium truncate flex-1 pr-16',
                  isActive ? 'text-neutral-900' : 'text-neutral-700'
                )}
              >
                {profile.profile_name}
              </h4>

              {/* Up/Down/Delete buttons */}
              <div className="flex items-center gap-1">
                {/* Up Button */}
                <button
                  onClick={e => handleReorder(e, profile.id, 'up')}
                  disabled={isFirst || reorderProfileMutation.isPending}
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    isFirst
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
                  )}
                  title="Flytta upp"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>

                {/* Down Button */}
                <button
                  onClick={e => handleReorder(e, profile.id, 'down')}
                  disabled={isLast || reorderProfileMutation.isPending}
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    isLast
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
                  )}
                  title="Flytta ned"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Delete X Button */}
                <button
                  onClick={e => handleDeleteProfile(e, profile.id, profile.profile_name)}
                  className="p-1 rounded hover:bg-red-100 transition-colors z-10 opacity-60 group-hover:opacity-100"
                  title="Radera profil"
                  disabled={deleteProfileMutation.isPending}
                >
                  <X className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
