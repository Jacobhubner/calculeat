import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { FoodItem } from '@/hooks/useFoodItems'
import type { Recipe } from '@/hooks/useRecipes'

// Hämtar användarens delbara livsmedel: source='manual' och user_id=current_user.id
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
        .eq('source', 'manual')
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
