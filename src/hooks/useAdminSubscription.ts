/**
 * Superadmin: se och sätta en användares plan.
 *
 * Ger premium med ett slutdatum utan att gå via Stripe. Skälet att inte
 * använda Stripe för gratisperioder: det kräver en kund och prenumeration
 * för någon som aldrig ska betala, ger fakturor på 0 kr, och grumlar
 * intäktssiffrorna. Webhooken skriver dessutom source='stripe' med
 * onConflict på user_id — en Stripe-händelse skulle alltså skriva över det
 * vi satt manuellt.
 *
 * RPC:n vägrar därför röra användare som redan har en Stripe-prenumeration.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AdminSubscription {
  plan: string | null
  status: string | null
  source: string | null
  current_period_end: string | null
  note: string | null
  /** Ägs av Stripe — hantera den där, inte här */
  is_stripe: boolean
  /** Vad användaren faktiskt har just nu, inklusive admin- och enforcement-regler */
  effective_plan: string
}

export function useAdminSubscription(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['admin-subscription', userId],
    queryFn: async (): Promise<AdminSubscription | null> => {
      if (!userId) return null
      const { data, error } = await supabase.rpc('admin_get_user_subscription', {
        p_user_id: userId,
      })
      if (error) throw error
      return (data as AdminSubscription[])?.[0] ?? null
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

/** Antal månader, eller null för "tills vidare" */
export type GrantDuration = 1 | 3 | 6 | 12 | null

export function useAdminSetPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      plan,
      months,
      note,
    }: {
      userId: string
      /** 'default' tar bort den manuella raden — användaren följer standardläget */
      plan: 'default' | 'free' | 'premium' | 'founder'
      months: GrantDuration
      note?: string
    }) => {
      // Slutdatumet räknas fram här i stället för i SQL, så att det syns i
      // gränssnittet exakt vad som kommer sparas innan man trycker.
      let expiresAt: string | null = null
      if (months != null && plan !== 'default') {
        const d = new Date()
        d.setMonth(d.getMonth() + months)
        expiresAt = d.toISOString()
      }

      const { error } = await supabase.rpc('admin_set_user_plan', {
        p_user_id: userId,
        p_plan: plan,
        p_note: note ?? null,
        p_expires_at: expiresAt,
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription', variables.userId] })
      // Användarens egna rättigheter ändras — tvinga omläsning
      queryClient.invalidateQueries({ queryKey: ['entitlements'] })
    },
  })
}
