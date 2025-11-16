/**
 * ProfileList - Lista med alla profiler
 */

import { useProfileStore } from '@/stores/profileStore'
import { useProfiles, useSwitchProfile } from '@/hooks'
import { Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProfileList() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: profiles = [], isLoading } = useProfiles()
  const switchProfileMutation = useSwitchProfile()

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId !== activeProfile?.id) {
      await switchProfileMutation.mutateAsync(profileId)
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
    <div className="space-y-2">
      {profiles.map(profile => {
        const isActive = profile.id === activeProfile?.id
        const lastUpdated = profile.updated_at
          ? new Date(profile.updated_at).toLocaleDateString('sv-SE')
          : 'Okänt datum'

        return (
          <button
            key={profile.id}
            onClick={() => handleSwitchProfile(profile.id)}
            className={cn(
              'w-full p-3 rounded-lg border transition-all text-left',
              'hover:border-primary-300 hover:shadow-sm',
              isActive
                ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                : 'border-neutral-200 bg-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={cn('p-2 rounded-lg', isActive ? 'bg-primary-100' : 'bg-neutral-100')}
                >
                  <User
                    className={cn('h-4 w-4', isActive ? 'text-primary-600' : 'text-neutral-600')}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-neutral-900 truncate">
                      {profile.profile_name}
                    </h4>
                    {isActive && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">Uppdaterad: {lastUpdated}</p>
                  {profile.weight_kg && profile.height_cm && (
                    <p className="text-xs text-neutral-600 mt-1">
                      {profile.weight_kg} kg • {profile.height_cm} cm
                    </p>
                  )}
                </div>
              </div>

              {isActive && <Check className="h-5 w-5 text-primary-600 flex-shrink-0" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
