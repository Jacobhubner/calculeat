import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'sonner'

export function useNewProfile() {
  const setActiveProfile = useProfileStore(state => state.setActiveProfile)

  const startNewProfile = () => {
    // Clear active profile to reset form
    setActiveProfile(null)

    toast.info('Skapa ny profil', {
      description: 'Fyll i formuläret och tryck Spara',
    })
  }

  return { startNewProfile }
}
