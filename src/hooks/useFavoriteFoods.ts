import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface FavoriteFood {
  id: string
  user_id: string
  food_item_id: string
  created_at: string
}

/**
 * Get all favorite food IDs for the current user
 * Returns a Set of food_item_ids for fast lookup
 */
export function useFavoriteFoods() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favoriteFoods', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('favorite_foods')
        .select('food_item_id')
        .eq('user_id', user.id)

      if (error) throw error

      // Return a Set for fast O(1) lookup
      return new Set((data as { food_item_id: string }[]).map(f => f.food_item_id))
    },
    enabled: !!user,
  })
}

/**
 * Check if a specific food item is favorited
 */
export function useIsFavorite(foodItemId: string): boolean {
  const { data: favorites } = useFavoriteFoods()
  return favorites?.has(foodItemId) ?? false
}

/**
 * Add a food item to favorites
 */
export function useAddFavorite() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (foodItemId: string) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('favorite_foods')
        .insert({
          user_id: user.id,
          food_item_id: foodItemId,
        })
        .select()
        .single()

      if (error) {
        // If unique constraint violation, it's already favorited - ignore error
        if (error.code === '23505') {
          return null
        }
        throw error
      }

      return data as FavoriteFood
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteFoods'] })
    },
  })
}

/**
 * Remove a food item from favorites
 */
export function useRemoveFavorite() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (foodItemId: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('user_id', user.id)
        .eq('food_item_id', foodItemId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteFoods'] })
    },
  })
}

/**
 * Toggle favorite status for a food item
 */
export function useToggleFavorite() {
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()
  const { data: favorites } = useFavoriteFoods()

  return {
    toggle: async (foodItemId: string) => {
      const isFavorite = favorites?.has(foodItemId)

      if (isFavorite) {
        await removeFavorite.mutateAsync(foodItemId)
      } else {
        await addFavorite.mutateAsync(foodItemId)
      }
    },
    isPending: addFavorite.isPending || removeFavorite.isPending,
  }
}
