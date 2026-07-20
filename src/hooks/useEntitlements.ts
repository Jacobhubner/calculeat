import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Entitlements,
  FREE_LIMITS,
  SOFT_LAUNCH_ENTITLEMENTS,
  UNLIMITED,
} from '@/lib/constants/entitlements'
import { useFreeViewMode } from '@/hooks/useFreeViewMode'

/**
 * Läser inloggad användares plan + gränser via get_my_entitlements-RPC:n.
 * Faller tillbaka till soft launch-läget (founder/obegränsat) om RPC:n
 * inte kan nås — UI:t är fail-open, servertriggarna är försvarslinjen.
 */
export function useEntitlements() {
  const { user } = useAuth()
  const { isFreeViewActive } = useFreeViewMode()

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

  // Admin-testläge: tvinga gratis-vy i UI:t utan att röra riktig data
  // eller servern. Enforcement (DB-triggers) påverkas inte — detta är
  // enbart en klientspegel för att se lås/blur/uppgraderingsflöden.
  if (isFreeViewActive) {
    return {
      plan: 'free' as const,
      limits: FREE_LIMITS,
      isPremium: false,
      enforcement: entitlements.enforcement,
      isLoading: query.isLoading,
    }
  }

  return {
    plan: entitlements.plan,
    limits: entitlements.limits,
    /** premium och founder är likvärdiga i UI:t */
    isPremium: entitlements.plan !== 'free',
    /** 'off' = soft launch (alla founder), 'on' = hard launch */
    enforcement: entitlements.enforcement,
    /** true först när svaret (eller fallbacken efter fel) är stabilt */
    isLoading: query.isLoading,
  }
}

/** Hjälpare för kvoträknare: true om värdet är obegränsat */
export function isUnlimited(limit: number): boolean {
  return limit === UNLIMITED
}

export interface MySubscription {
  plan: string
  status: string
  source: 'manual' | 'stripe'
  current_period_end: string | null
}

/**
 * Inloggad användares egen prenumerationsrad (RLS släpper bara igenom egen rad).
 * null = ingen rad = planen följer enforcement-läget.
 */
export function useMySubscription() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-subscription', user?.id],
    queryFn: async (): Promise<MySubscription | null> => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan, status, source, current_period_end')
        .maybeSingle()
      if (error) throw error
      return data as MySubscription | null
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}
