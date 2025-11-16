/**
 * ProfileSwitcher - Dropdown för att byta mellan profiler
 */

import { useState } from 'react'
import { useProfileStore } from '@/stores/profileStore'
import { useProfiles, useSwitchProfile } from '@/hooks'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Check, ChevronDown, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProfileSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { data: profiles = [], isLoading } = useProfiles()
  const switchProfileMutation = useSwitchProfile()

  const handleSwitchProfile = async (profileId: string) => {
    if (profileId !== activeProfile?.id) {
      await switchProfileMutation.mutateAsync(profileId)
    }
    setIsOpen(false)
  }

  const handleNewProfile = () => {
    setIsOpen(false)
    // This will be handled by ProfilePage - just close dropdown for now
    // In future, could trigger a modal or navigate to create profile flow
  }

  if (isLoading) {
    return <div className="text-sm text-neutral-500">Laddar profiler...</div>
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="truncate">{activeProfile?.profile_name || 'Välj profil'}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <Card className="absolute top-full left-0 right-0 mt-2 z-20 p-2 max-h-80 overflow-y-auto">
            {/* Profile List */}
            <div className="space-y-1">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleSwitchProfile(profile.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    'hover:bg-neutral-100',
                    profile.id === activeProfile?.id && 'bg-primary-50'
                  )}
                >
                  <span className="truncate">{profile.profile_name}</span>
                  {profile.id === activeProfile?.id && (
                    <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            {profiles.length > 0 && <div className="my-2 border-t border-neutral-200" />}

            {/* Add New Profile Button */}
            <button
              onClick={handleNewProfile}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Lägg till ny profil</span>
            </button>
          </Card>
        </>
      )}
    </div>
  )
}
