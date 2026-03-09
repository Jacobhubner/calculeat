import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { deleteRecipeImageByUrl } from '@/hooks/useRecipeImageUpload'
import type {
  SharedList,
  SharedListInvitation,
  LeaveSharedListResult,
} from '@/lib/types/sharedLists'
import type { FoodItem } from '@/hooks/useFoodItems'
import type { CreateRecipeInput } from '@/hooks/useRecipes'

// ──────────────────────────────────────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────────────────────────────────────

const sharedListKeys = {
  all: ['sharedLists'] as const,
  lists: () => [...sharedListKeys.all] as const,
  invitations: {
    pending: ['sharedListInvitations', 'pending'] as const,
    count: ['sharedListInvitations', 'count'] as const,
  },
}

// ──────────────────────────────────────────────────────────────────────────────
// useSharedLists — hämtar alla listor användaren är med i
// ──────────────────────────────────────────────────────────────────────────────

export function useSharedLists() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...sharedListKeys.lists(), user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_shared_lists')
      if (error) throw error
      return (data as SharedList[]) ?? []
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// usePendingSharedListInvitations — inkorgen
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingSharedListInvitations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...sharedListKeys.invitations.pending, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_shared_list_invitations')
      if (error) throw error
      return (data as SharedListInvitation[]) ?? []
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// usePendingSharedListInvitationsCount — badge-räknare med Realtime
// Följer samma mönster som usePendingInvitationsCount i useShareInvitations.ts
// ──────────────────────────────────────────────────────────────────────────────

export function usePendingSharedListInvitationsCount() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [...sharedListKeys.invitations.count, user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { data, error } = await supabase.rpc('get_pending_shared_list_invitations_count')
      if (error) throw error
      return data as number
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`shared-list-invitations-count:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_list_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        payload => {
          if ((payload.new as Record<string, unknown>)?.status === 'pending') {
            queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.count })
            queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.pending })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shared_list_invitations',
          filter: `recipient_id=eq.${user.id}`,
        },
        payload => {
          if ((payload.old as Record<string, unknown>)?.status === 'pending') {
            queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.count })
            queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.pending })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return query
}

// ──────────────────────────────────────────────────────────────────────────────
// useSharedListRecipes — recept för en specifik delad lista
// ──────────────────────────────────────────────────────────────────────────────

export function useSharedListRecipes(listId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sharedRecipes', listId, user?.id],
    queryFn: async () => {
      if (!listId) return []
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          food_item:food_items(*),
          ingredients:recipe_ingredients(
            *,
            food_item:food_items(*)
          )
        `
        )
        .eq('shared_list_id', listId)
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!user && !!listId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useCreateSharedList
// ──────────────────────────────────────────────────────────────────────────────

export function useCreateSharedList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, friendUserId }: { name: string; friendUserId?: string }) => {
      const { data, error } = await supabase.rpc('create_shared_list', {
        p_name: name,
        p_friend_user_id: friendUserId ?? null,
      })
      if (error) throw error
      return data as { success: boolean; shared_list_id?: string; name?: string; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useInviteToSharedList
// ──────────────────────────────────────────────────────────────────────────────

export function useInviteToSharedList() {
  return useMutation({
    mutationFn: async ({
      sharedListId,
      friendUserId,
    }: {
      sharedListId: string
      friendUserId: string
    }) => {
      const { data, error } = await supabase.rpc('invite_to_shared_list', {
        p_shared_list_id: sharedListId,
        p_friend_user_id: friendUserId,
      })
      if (error) throw error
      return data as { success: boolean; invitation_id?: string; error?: string }
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useAcceptSharedListInvitation
// ──────────────────────────────────────────────────────────────────────────────

export function useAcceptSharedListInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('accept_shared_list_invitation', {
        p_invitation_id: invitationId,
      })
      if (error) throw error
      return data as {
        success: boolean
        shared_list_id?: string
        list_name?: string
        error?: string
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.pending })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.count })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useRejectSharedListInvitation
// ──────────────────────────────────────────────────────────────────────────────

export function useRejectSharedListInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('reject_shared_list_invitation', {
        p_invitation_id: invitationId,
      })
      if (error) throw error
      return data as { success: boolean; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.pending })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.invitations.count })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useLeaveSharedList
// Returnerar 'last_member'-warning om användaren är sista.
// UI måste hantera detta och anropa useLeaveSharedListConfirmed separat.
// ──────────────────────────────────────────────────────────────────────────────

export function useLeaveSharedList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sharedListId: string) => {
      const { data, error } = await supabase.rpc('leave_shared_list', {
        p_shared_list_id: sharedListId,
      })
      if (error) throw error
      return data as LeaveSharedListResult
    },
    onSuccess: (result, sharedListId) => {
      // Invalidera oavsett om det är success eller last_member-warning
      // (vid last_member är user fortfarande med, men vi vill ändå ha aktuell data)
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ['foodItems', 'paginated', `list:${sharedListId}`],
        })
        queryClient.invalidateQueries({ queryKey: ['sharedRecipes', sharedListId] })
      }
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useLeaveSharedListConfirmed
// Anropas efter destructive confirm när användaren är sista.
// ──────────────────────────────────────────────────────────────────────────────

export function useLeaveSharedListConfirmed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sharedListId: string) => {
      // Hämta receptbilder innan radering så vi kan rensa Storage om listan tas bort
      const { data: recipeRows } = await supabase
        .from('recipes')
        .select('image_url')
        .eq('shared_list_id', sharedListId)
        .not('image_url', 'is', null)

      const { data, error } = await supabase.rpc('leave_shared_list_confirmed', {
        p_shared_list_id: sharedListId,
      })
      if (error) throw error

      const result = data as {
        success: boolean
        action: string
        error?: string
      }

      // Om listan raderades (sista medlemmen), rensa receptbilder från Storage
      if (result.success && result.action === 'deleted' && recipeRows) {
        const urls = recipeRows.map(r => r.image_url).filter(Boolean) as string[]
        await Promise.allSettled(urls.map(url => deleteRecipeImageByUrl(url)))
      }

      return result
    },
    onSuccess: (_data, sharedListId) => {
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
      // Rensa enbart den borttagna listans cachade data
      queryClient.invalidateQueries({
        queryKey: ['foodItems', 'paginated', `list:${sharedListId}`],
      })
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes', sharedListId] })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useCopyToSharedList
// ──────────────────────────────────────────────────────────────────────────────

export function useCopyToSharedList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      foodItemId,
      sharedListId,
    }: {
      foodItemId: string
      sharedListId: string
    }) => {
      const { data, error } = await supabase.rpc('copy_food_item_to_shared_list', {
        p_food_item_id: foodItemId,
        p_shared_list_id: sharedListId,
      })
      if (error) throw error
      return data as { success: boolean; new_food_item_id?: string; error?: string }
    },
    onSuccess: (_data, variables) => {
      // Invalidera den specifika listans items
      queryClient.invalidateQueries({
        queryKey: ['foodItems', 'paginated', `list:${variables.sharedListId}`],
      })
      // Uppdatera metadata (food_item_count)
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// useRenameSharedList
// ──────────────────────────────────────────────────────────────────────────────

export function useRenameSharedList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sharedListId, name }: { sharedListId: string; name: string }) => {
      const { data, error } = await supabase.rpc('rename_shared_list', {
        p_shared_list_id: sharedListId,
        p_new_name: name,
      })
      if (error) throw error
      return data as { success: boolean; name?: string; error?: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// FAS 2: Realtime
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Prenumererar på Realtime-events för en gemensam lista.
 * Invaliderar React Query-cachen när food_items eller recipes ändras.
 * Kräver REPLICA IDENTITY FULL + att tabellerna är med i supabase_realtime-publikationen.
 */
export function useSharedListRealtime(listId: string | null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!listId || !user) return

    const channel = supabase
      .channel(`shared-list-content:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_items',
          filter: `shared_list_id=eq.${listId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['foodItems', 'paginated', `list:${listId}`],
          })
          queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipes',
          filter: `shared_list_id=eq.${listId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sharedRecipes', listId] })
          queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, user, queryClient])
}

// ──────────────────────────────────────────────────────────────────────────────
// FAS 2: List-items hämtning (för ingredienspicker i RecipeCalculatorModal)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Hämtar icke-recept-items som tillhör en gemensam lista.
 * Används av RecipeCalculatorModal för att visa list-items i ingredienspickern.
 */
export function useSharedListFoodItems(listId: string | null) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', 'sharedListIngredients', listId, user?.id],
    queryFn: async () => {
      if (!listId) return [] as FoodItem[]
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('shared_list_id', listId)
        .eq('is_recipe', false)
        .order('name')
      if (error) throw error
      return (data as FoodItem[]) ?? []
    },
    enabled: !!user && !!listId,
    staleTime: 30_000,
  })
}

/**
 * Mergar list-items med egna/globala items för ingredienspickern.
 * List-items visas först och duplikat på id-basis tas bort.
 */
export function useMergedFoodItemsForList(
  baseFoods: FoodItem[] | undefined,
  listId: string | null
) {
  const { data: listFoods = [] } = useSharedListFoodItems(listId)

  return useMemo(() => {
    if (!listId) return baseFoods ?? []
    const combined = [...listFoods, ...(baseFoods ?? [])]
    const seen = new Set<string>()
    return combined.filter(f => {
      if (seen.has(f.id)) return false
      seen.add(f.id)
      return true
    })
  }, [baseFoods, listFoods, listId])
}

/**
 * Mergar items från ALLA delade listor med egna/globala items för ingredienspickern.
 * Används i RecipeCalculatorModal så att man kan välja ingredienser från vilken lista som helst.
 */
export function useMergedFoodItemsForAllLists(baseFoods: FoodItem[] | undefined) {
  const { data: sharedLists = [] } = useSharedLists()
  const listIds = sharedLists.map(l => l.id)

  // Hämta alla list-items från alla delade listor
  const { data: allListFoods = [] } = useQuery({
    queryKey: ['foodItems', 'allSharedListIngredients', listIds],
    queryFn: async () => {
      if (listIds.length === 0) return []
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .in('shared_list_id', listIds)
        .eq('is_recipe', false)
        .order('name')
      if (error) throw error
      return (data as FoodItem[]) ?? []
    },
    enabled: listIds.length > 0,
    staleTime: 30_000,
  })

  return useMemo(() => {
    const combined = [...allListFoods, ...(baseFoods ?? [])]
    const seen = new Set<string>()
    return combined.filter(f => {
      if (seen.has(f.id)) return false
      seen.add(f.id)
      return true
    })
  }, [allListFoods, baseFoods])
}

// ──────────────────────────────────────────────────────────────────────────────
// FAS 2: Create list-items (user_id=NULL, shared_list_id=X)
// ──────────────────────────────────────────────────────────────────────────────

export function useCreateSharedListFoodItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      ...input
    }: Omit<import('@/hooks/useFoodItems').CreateFoodItemInput, 'source'> & { listId: string }) => {
      const { data, error } = await supabase
        .from('food_items')
        .insert({
          user_id: null,
          shared_list_id: listId,
          source: 'manual' as const,
          name: input.name,
          brand: input.brand,
          barcode: input.barcode,
          calories: input.calories,
          fat_g: input.fat_g,
          saturated_fat_g: input.saturated_fat_g,
          carb_g: input.carb_g,
          sugar_g: input.sugar_g,
          fiber_g: input.fiber_g,
          protein_g: input.protein_g,
          salt_g: input.salt_g,
          default_amount: input.default_amount,
          default_unit: input.default_unit,
          weight_grams: input.weight_grams,
          reference_amount: input.reference_amount ?? input.weight_grams ?? 100,
          reference_unit: input.reference_unit ?? 'g',
          density_g_per_ml: input.density_g_per_ml,
          ml_per_gram: input.ml_per_gram,
          grams_per_piece: input.grams_per_piece,
          serving_unit: input.serving_unit,
          food_type: input.food_type,
          notes: input.notes,
          is_recipe: false,
        })
        .select()
        .single()
      if (error) throw error
      return data as FoodItem
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['foodItems', 'paginated', `list:${variables.listId}`],
      })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// FAS 2: Delete list-items
// ──────────────────────────────────────────────────────────────────────────────

export function useDeleteSharedListFoodItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { foodItemId: string; listId: string }) => {
      const { data, error } = await supabase.rpc('delete_shared_list_food_item', {
        p_food_item_id: variables.foodItemId,
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error ?? 'delete_failed')
      return result
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['foodItems', 'paginated', `list:${variables.listId}`],
      })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// FAS 2: Edit list-items
// ──────────────────────────────────────────────────────────────────────────────

export function useUpdateSharedListFoodItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: {
      foodItemId: string
      listId: string
      fields: Record<string, unknown>
    }) => {
      const { data, error } = await supabase.rpc('update_shared_list_food_item', {
        p_food_item_id: variables.foodItemId,
        p_fields: variables.fields,
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error ?? 'update_failed')
      return result
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['foodItems', 'paginated', `list:${variables.listId}`],
      })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// FAS 2: List-recept edit/delete/create
// ──────────────────────────────────────────────────────────────────────────────

export function useDeleteSharedListRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { recipeId: string; listId: string }) => {
      // Hämta image_url innan radering så vi kan rensa Storage efteråt
      const { data: recipeRow } = await supabase
        .from('recipes')
        .select('image_url')
        .eq('id', variables.recipeId)
        .single()

      const { data, error } = await supabase.rpc('delete_shared_list_recipe', {
        p_recipe_id: variables.recipeId,
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error ?? 'delete_failed')

      // Ta bort bilden från Storage om den finns
      if (recipeRow?.image_url) {
        await deleteRecipeImageByUrl(recipeRow.image_url)
      }

      return result
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes', variables.listId] })
      queryClient.invalidateQueries({
        queryKey: ['foodItems', 'paginated', `list:${variables.listId}`],
      })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}

export function useUpdateSharedListRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recipeId,
      fields,
    }: {
      recipeId: string
      fields: Record<string, unknown>
    }) => {
      const { data, error } = await supabase.rpc('update_shared_list_recipe', {
        p_recipe_id: recipeId,
        p_fields: fields,
      })
      if (error) throw error
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error ?? 'update_failed')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

export function useCreateSharedListRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sharedListId,
      ...input
    }: CreateRecipeInput & { sharedListId: string }) => {
      const { data, error } = await supabase.rpc('create_shared_list_recipe', {
        p_shared_list_id: sharedListId,
        p_name: input.name,
        p_servings: input.servings,
        p_ingredients: input.ingredients,
        p_nutrition: input.nutrition
          ? {
              ...input.nutrition,
              saveAs: input.saveAs ?? 'portion',
            }
          : null,
        p_image_url: input.image_url ?? null,
        p_instructions: input.instructions ?? null,
        p_equipment: input.equipment ?? null,
        p_equipment_settings: input.equipment_settings ?? null,
        p_prep_time_min: input.prep_time_min ?? null,
        p_cook_time_min: input.cook_time_min ?? null,
      })
      if (error) throw error
      const result = data as { success: boolean; recipe_id?: string; error?: string }
      if (!result.success) throw new Error(result.error ?? 'create_failed')
      return result
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['sharedRecipes', variables.sharedListId],
      })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
      queryClient.invalidateQueries({ queryKey: sharedListKeys.lists() })
    },
  })
}
