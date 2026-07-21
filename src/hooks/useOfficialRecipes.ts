/**
 * Receptbanken — officiella recept publicerade av CalculEat.
 *
 * useOfficialRecipes: läser alla visibility='official'-recept (RLS släpper
 * igenom dem för alla inloggade icke-anonyma användare).
 *
 * useCopyOfficialRecipe: kopierar ett bankrecept till användarens egna via
 * RPC:n copy_official_recipe_to_personal. Premium-gate för premium_only-
 * recept och receptkvoten enforce:as server-side — kvotfel i formatet
 * PREMIUM_LIMIT_REACHED:<key> fångas av handlePremiumLimitError i anroparen.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PreviewBlockedError } from '@/hooks/usePreviewMutation'
import type { Recipe } from '@/hooks/useRecipes'

export function useOfficialRecipes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['recipes', 'official'],
    queryFn: async () => {
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
        .eq('visibility', 'official')
        .order('name')

      if (error) throw error
      return data as Recipe[]
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // banken ändras sällan
  })
}

interface CopyOfficialRecipeResult {
  success: boolean
  error?: string
  recipe_id?: string
  name?: string
}

export function useCopyOfficialRecipe() {
  const queryClient = useQueryClient()
  const { isPreviewMode } = useAuth()
  const { t } = useTranslation('common')

  return useMutation({
    mutationFn: async (recipeId: string) => {
      // Preview-läget får aldrig skriva till riktiga kontot
      if (isPreviewMode) {
        toast.info(t('preview.mutationBlocked'))
        throw new PreviewBlockedError()
      }

      const { data, error } = await supabase.rpc('copy_official_recipe_to_personal', {
        p_recipe_id: recipeId,
      })
      if (error) throw error

      const result = data as CopyOfficialRecipeResult
      if (!result.success) {
        throw new Error(result.error ?? 'copy_failed')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

export interface RecipeRequest {
  id: string
  request_text: string
  created_at: string
  requester_name: string
}

/**
 * Admin: alla inkomna receptönskemål med avsändarens användarnamn
 * (SECURITY DEFINER-RPC; returnerar tomt för icke-admins).
 */
export function useRecipeRequests(enabled: boolean) {
  return useQuery({
    queryKey: ['recipeRequests'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recipe_requests')
      if (error) throw error
      return data as RecipeRequest[]
    },
    enabled,
    staleTime: 60_000,
  })
}

interface PublishResult {
  success: boolean
  error?: string
  ingredients?: string[]
}

/**
 * Superadmin: publicera ett eget privat recept till receptbanken.
 * Servern validerar att alla ingredienser är globala och flyttar
 * följeslagar-food_item till globalt ägarskap.
 */
export function usePublishRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { recipeId: string; premium: boolean; tags: string[] }) => {
      const { data, error } = await supabase.rpc('publish_recipe_to_bank', {
        p_recipe_id: params.recipeId,
        p_premium: params.premium,
        p_tags: params.tags,
      })
      if (error) throw error
      return data as PublishResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

/** Superadmin: avpublicera — receptet blir privat igen. */
export function useUnpublishRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (recipeId: string) => {
      const { data, error } = await supabase.rpc('unpublish_recipe_from_bank', {
        p_recipe_id: recipeId,
      })
      if (error) throw error
      return data as PublishResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

/**
 * Superadmin: sätt/byt bild på ett officiellt recept (bara image_url på
 * receptraden — rör aldrig följeslagar-food_item). Bilden laddas upp
 * separat via useRecipeImageUpload till recipe-images-bucketen.
 */
export function useSetOfficialRecipeImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { recipeId: string; imageUrl: string }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ image_url: params.imageUrl })
        .eq('id', params.recipeId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}

/** Admin: klarmarkera = radera önskemålet (försvinner för ALLA admins). */
export function useDeleteRecipeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.from('recipe_requests').delete().eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipeRequests'] })
    },
  })
}

/**
 * "Önska recept" — sparar ett önskemål som admins läser inför nästa
 * receptbatch. Rate limit (5/dygn) enforce:as av DB-trigger som kastar
 * RATE_LIMIT:recipe_requests.
 */
export function useRequestRecipe() {
  const { user, isPreviewMode } = useAuth()
  const { t } = useTranslation('common')

  return useMutation({
    mutationFn: async (text: string) => {
      if (isPreviewMode) {
        toast.info(t('preview.mutationBlocked'))
        throw new PreviewBlockedError()
      }
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('recipe_requests')
        .insert({ user_id: user.id, request_text: text.trim() })
      if (error) throw error
    },
  })
}
