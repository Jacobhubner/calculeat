import { useProfileStore } from '@/stores/profileStore'
import { toast } from 'sonner'

export function useNewProfile() {
  const setIsCreatingNew = useProfileStore(state => state.setIsCreatingNew)

  const startNewProfile = () => {
    // Set isCreatingNew flag to prevent auto-selection of existing profiles
    setIsCreatingNew(true)

    toast.info('Skapa ny profil', {
      description: 'Fyll i formuläret och tryck Spara',
    })
  }

  return { startNewProfile }
}
