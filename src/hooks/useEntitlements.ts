import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Entitlements, SOFT_LAUNCH_ENTITLEMENTS, UNLIMITED } from '@/lib/constants/entitlements'

/**
 * Läser inloggad användares plan + gränser via get_my_entitlements-RPC:n.
 * Faller tillbaka till soft launch-läget (founder/obegränsat) om RPC:n
 * inte kan nås — UI:t är fail-open, servertriggarna är försvarslinjen.
 */
export function useEntitlements() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['entitlements', user?.id],
    queryFn: async (): Promise<Entitlements> => {
      const { data, error } = await supabase.rpc('get_my_entitlements')
      if (error) throw error
      return data as Entitlements
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const entitlements = query.data ?? SOFT_LAUNCH_ENTITLEMENTS

  return {
    plan: entitlements.plan,
    limits: entitlements.limits,
    /** premium och founder är likvärdiga i UI:t */
    isPremium: entitlements.plan !== 'free',
    /** true först när svaret (eller fallbacken efter fel) är stabilt */
    isLoading: query.isLoading,
  }
}

/** Hjälpare för kvoträknare: true om värdet är obegränsat */
export function isUnlimited(limit: number): boolean {
  return limit === UNLIMITED
}
