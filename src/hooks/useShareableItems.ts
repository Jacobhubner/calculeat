import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FoodItem } from '@/hooks/useFoodItems'
import type { Recipe } from '@/hooks/useRecipes'

// Returnerar antal egna livsmedel som ingår i "Min lista"-delning
export function useShareableFoodListCount() {
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ['shareableFoodListCount', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_hidden', false)
        .eq('is_recipe', false)
        .in('source', ['manual', 'user'])
      if (error) throw error
      return count ?? 0
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  return { count: query.data ?? 0, isLoading: query.isLoading }
}

// Hämtar användarens delbara livsmedel: user_id=current_user.id (alla sources)
// Används av ShareDialog för att populera urvalslistan.
export function useShareableFoodItems() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shareableFoodItems', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_hidden', false)
        .eq('is_recipe', false)
        .order('name')
      if (error) throw error
      return data as FoodItem[]
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

// Hämtar användarens delbara recept: user_id=current_user.id
export function useShareableRecipes() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shareableRecipes', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, servings, created_at, updated_at')
        .eq('user_id', user.id)
        .order('name')
      if (error) throw error
      return data as Pick<Recipe, 'id' | 'name' | 'servings' | 'created_at' | 'updated_at'>[]
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
