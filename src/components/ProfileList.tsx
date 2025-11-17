/**
 * ProfileList - Lista med alla profiler
 */

import { useProfileStore } from '@/stores/profileStore'
import { useProfiles, useSwitchProfile, useDeleteProfile } from '@/hooks'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProfileList() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: profiles = [], isLoading } = useProfiles()
  const switchProfileMutation = useSwitchProfile()
  const deleteProfileMutation = useDeleteProfile()

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId !== activeProfile?.id) {
      await switchProfileMutation.mutateAsync(profileId)
    }
  }

  const handleDeleteProfile = async (
    e: React.MouseEvent,
    profileId: string,
    profileName: string
  ) => {
    // Stoppa event propagation så att kortet inte klickas
    e.stopPropagation()

    // Validera att det inte är sista profilen
    if (profiles.length === 1) {
      toast.error('Du måste ha minst en profil kvar')
      return
    }

    // Bekräftelse
    const confirmed = window.confirm(
      `Är du säker på att du vill radera profilen "${profileName}"? Detta går inte att ångra.`
    )

    if (!confirmed) return

    try {
      await deleteProfileMutation.mutateAsync(profileId)
      toast.success('Profilen har raderats')
    } catch (error) {
      console.error('Error deleting profile:', error)
      toast.error('Kunde inte radera profilen')
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
      {profiles.map(profile => {
        const isActive = profile.id === activeProfile?.id

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
                  'text-sm font-medium truncate flex-1',
                  isActive ? 'text-neutral-900' : 'text-neutral-700'
                )}
              >
                {profile.profile_name}
              </h4>

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
        )
      })}
    </div>
  )
}
