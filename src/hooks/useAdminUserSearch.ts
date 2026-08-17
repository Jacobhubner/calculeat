/**
 * Superadmin: sök bland alla användare och se deras prenumerationshistorik.
 *
 * Ersätter den tidigare panelen i supportvyn, som bara nådde personer som
 * hört av sig. Här går det att hitta vem som helst.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AdminUserRow {
  user_id: string
  username: string | null
  email: string | null
  created_at: string
  /** Effektiv plan just nu, inklusive admin- och enforcement-regler */
  effective_plan: string
  plan: string | null
  status: string | null
  source: string | null
  current_period_end: string | null
  /** Motiveringen som angavs när planen sattes */
  note: string | null
  /** AKTIV prenumeration i betalflödet — hanteras där, inte här */
  is_stripe: boolean
  has_paid_before: boolean
  had_trial: boolean
  was_granted: boolean
  is_admin: boolean
}

export function useAdminUserSearch(query: string) {
  return useQuery({
    queryKey: ['admin-user-search', query],
    queryFn: async (): Promise<AdminUserRow[]> => {
      const { data, error } = await supabase.rpc('admin_search_users', {
        p_query: query.trim(),
        p_limit: 50,
      })
      if (error) throw error
      return (data as AdminUserRow[]) ?? []
    },
    staleTime: 15_000,
  })
}

export interface SubscriptionEvent {
  event_type:
    | 'trial_started'
    | 'payment_started'
    | 'payment_renewed'
    | 'canceled'
    | 'granted'
    | 'revoked'
  plan: string | null
  source: string
  period_end: string | null
  /** Superadmins motivering vid granted/revoked */
  reason: string | null
  actor_username: string | null
  created_at: string
}

export function useSubscriptionEvents(userId: string | null) {
  return useQuery({
    queryKey: ['admin-subscription-events', userId],
    queryFn: async (): Promise<SubscriptionEvent[]> => {
      if (!userId) return []
      const { data, error } = await supabase.rpc('admin_get_subscription_events', {
        p_user_id: userId,
      })
      if (error) throw error
      return (data as SubscriptionEvent[]) ?? []
    },
    enabled: !!userId,
    staleTime: 15_000,
  })
}
