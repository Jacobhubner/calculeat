import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface LiquidItemWithoutDensity {
  id: string
  name: string
  calories: number
  default_unit: string
}

export function useUserLiquidItemsWithoutDensity() {
  const { user } = useAuth()

  return useQuery<LiquidItemWithoutDensity[]>({
    queryKey: ['foodItems', 'liquid-no-density', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, calories, default_unit')
        .eq('user_id', user!.id)
        .eq('default_unit', 'ml')
        .or('weight_grams.is.null,weight_grams.eq.0')
        .eq('is_recipe', false)
        .order('name')
      if (error) throw error
      return (data as LiquidItemWithoutDensity[]) ?? []
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}
