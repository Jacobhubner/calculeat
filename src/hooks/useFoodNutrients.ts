import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface NutrientDefinition {
  nutrient_code: string
  display_name_sv: string
  display_name_en: string | null
  unit: string
  eurofir_code: string | null
  usda_nutrient_id: number | null
  sort_order: number
  category: string | null
}

export interface FoodNutrient {
  id: string
  food_item_id: string
  nutrient_code: string
  amount: number
  unit: string
  reference_amount: number
  reference_unit: 'g' | 'ml'
}

/**
 * Get all nutrient definitions (~31 rows, cached indefinitely)
 */
export function useNutrientDefinitions() {
  return useQuery({
    queryKey: ['nutrientDefinitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrient_definitions')
        .select('*')
        .order('sort_order')

      if (error) throw error
      return data as NutrientDefinition[]
    },
    staleTime: Infinity,
  })
}

/**
 * Get nutrients for a single food item (lazy, per detail view)
 */
export function useFoodNutrients(foodItemId: string | null) {
  return useQuery({
    queryKey: ['foodNutrients', foodItemId],
    queryFn: async () => {
      if (!foodItemId) return []

      const { data, error } = await supabase
        .from('food_nutrients')
        .select('*')
        .eq('food_item_id', foodItemId)
        .order('nutrient_code')

      if (error) throw error
      return data as FoodNutrient[]
    },
    enabled: !!foodItemId,
  })
}

/**
 * Get nutrients for multiple food items in one query (for daily summary)
 */
export function useFoodNutrientsBatch(foodItemIds: string[]) {
  return useQuery({
    queryKey: ['foodNutrients', 'batch', foodItemIds.sort().join(',')],
    queryFn: async () => {
      if (foodItemIds.length === 0) return []

      const { data, error } = await supabase
        .from('food_nutrients')
        .select('*')
        .in('food_item_id', foodItemIds)

      if (error) throw error
      return data as FoodNutrient[]
    },
    enabled: foodItemIds.length > 0,
  })
}

/**
 * Save nutrients for a food item (upsert)
 */
export function useSaveFoodNutrients() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      foodItemId,
      nutrients,
    }: {
      foodItemId: string
      nutrients: Array<{
        nutrient_code: string
        amount: number
        unit: string
        reference_amount?: number
        reference_unit?: 'g' | 'ml'
      }>
    }) => {
      if (!user) throw new Error('User not authenticated')

      // Delete existing nutrients for this food item, then insert new ones
      const { error: deleteError } = await supabase
        .from('food_nutrients')
        .delete()
        .eq('food_item_id', foodItemId)

      if (deleteError) throw deleteError

      if (nutrients.length === 0) return []

      const rows = nutrients.map(n => ({
        food_item_id: foodItemId,
        nutrient_code: n.nutrient_code,
        amount: n.amount,
        unit: n.unit,
        reference_amount: n.reference_amount ?? 100,
        reference_unit: n.reference_unit ?? 'g',
      }))

      const { data, error } = await supabase.from('food_nutrients').insert(rows).select()

      if (error) throw error
      return data as FoodNutrient[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['foodNutrients', variables.foodItemId] })
      queryClient.invalidateQueries({ queryKey: ['foodNutrients', 'batch'] })
    },
  })
}
