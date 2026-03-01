import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useIsAdmin() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user!.id)
        .maybeSingle()
      return !!data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}
