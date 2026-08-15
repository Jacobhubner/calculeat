import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { DietPhase, DietPhaseType, PhaseFocus } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Faser (cut/bulk/maintenance/reverse).
 *
 * Preview-läget ("Testa som ny användare") är en äkta sandlåda: varje INSERT
 * sätter is_preview och varje SELECT filtrerar på det. exit_preview_profile
 * raderar preview-faserna vid avslut.
 *
 * Den aktiva fasen speglas till profiles.calorie_goal av en databastrigger —
 * därför invalideras även profil-queries efter mutationer, annars visar UI:t
 * ett inaktuellt kaloriemål tills nästa refetch.
 */

/** Alla faser, nyaste först — pågående fas ligger överst. */
export function useDietPhases() {
  const { user, isPreviewMode } = useAuth()

  return useQuery({
    queryKey: ['diet-phases', user?.id, isPreviewMode],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('diet_phases')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_preview', isPreviewMode ? true : false)
        .order('started_at', { ascending: false })
      if (error) throw error
      return data as DietPhase[]
    },
    enabled: !!user,
  })
}

/** Pågående fas, eller null om användaren inte har någon aktiv fas. */
export function useActiveDietPhase() {
  const { user, isPreviewMode } = useAuth()

  return useQuery({
    queryKey: ['diet-phases', 'active', user?.id, isPreviewMode],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('diet_phases')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_preview', isPreviewMode ? true : false)
        .is('ended_at', null)
        .maybeSingle()
      if (error) throw error
      return data as DietPhase | null
    },
    enabled: !!user,
  })
}

export interface StartPhaseInput {
  phaseType: DietPhaseType
  /** Fokusspår — avgör fasens namn och vilket kostläge den pekar mot */
  focus: PhaseFocus
  plannedWeeks?: number | null
  targetCalories?: number | null
  proteinGPerKg?: number | null
  weeklyCalorieStep?: number | null
  notes?: string | null
}

/**
 * Startar en ny fas och avslutar den pågående i en och samma transaktion
 * (RPC start_diet_phase). Två separata anrop skulle kunna lämna användaren
 * utan aktiv fas om det andra misslyckas.
 */
export function useStartDietPhase() {
  const queryClient = useQueryClient()
  const { user, isPreviewMode } = useAuth()

  return useMutation({
    mutationFn: async (input: StartPhaseInput) => {
      const { data, error } = await supabase.rpc('start_diet_phase', {
        p_phase_type: input.phaseType,
        p_focus: input.focus,
        p_planned_weeks: input.plannedWeeks ?? null,
        p_target_calories: input.targetCalories ?? null,
        p_protein_g_per_kg: input.proteinGPerKg ?? null,
        p_weekly_calorie_step: input.weeklyCalorieStep ?? null,
        p_notes: input.notes ?? null,
        p_is_preview: isPreviewMode,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-phases'] })
      // Triggern har uppdaterat calorie_goal på profilen
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: () => {
      toast.error('Kunde inte starta fasen')
    },
    // user används inte i mutationen men gör hooken beroende av inloggning
    meta: { userId: user?.id },
  })
}

/** Avslutar den pågående fasen utan att starta en ny. */
export function useEndDietPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (phaseId: string) => {
      const { error } = await supabase
        .from('diet_phases')
        .update({ ended_at: new Date().toISOString().slice(0, 10) })
        .eq('id', phaseId)
      if (error) throw error
      return phaseId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-phases'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: () => {
      toast.error('Kunde inte avsluta fasen')
    },
  })
}

/**
 * Raderar en AVSLUTAD fas ur historiken.
 *
 * Bara avslutade faser: att radera den pågående skulle lämna användaren utan
 * aktiv fas medan profilens calorie_goal fortfarande speglar den — använd
 * useEndDietPhase för att avsluta i stället.
 */
export function useDeleteDietPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (phaseId: string) => {
      const { error } = await supabase
        .from('diet_phases')
        .delete()
        .eq('id', phaseId)
        .not('ended_at', 'is', null)
      if (error) throw error
      return phaseId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-phases'] })
    },
    onError: () => {
      toast.error('Kunde inte ta bort fasen')
    },
  })
}

/** Uppdaterar en fas mål eller anteckningar (inte dess typ). */
export function useUpdateDietPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      phaseId,
      updates,
    }: {
      phaseId: string
      updates: Partial<
        Pick<
          DietPhase,
          'planned_weeks' | 'target_calories' | 'protein_g_per_kg' | 'weekly_calorie_step' | 'notes'
        >
      >
    }) => {
      const { error } = await supabase.from('diet_phases').update(updates).eq('id', phaseId)
      if (error) throw error
      return phaseId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-phases'] })
    },
    onError: () => {
      toast.error('Kunde inte uppdatera fasen')
    },
  })
}
