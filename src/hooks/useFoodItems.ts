import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  calculateNoomColor,
  type NoomColor,
  type NoomFoodType,
} from '@/lib/calculations/colorDensity'

export interface FoodItem {
  id: string
  user_id: string
  name: string
  brand?: string
  barcode?: string

  // Nutrition per default amount
  calories: number
  fat_g: number
  saturated_fat_g?: number
  carb_g: number
  sugar_g?: number
  fiber_g?: number
  protein_g: number
  salt_g?: number

  // Default serving
  default_amount: number
  default_unit: string

  // Conversion data
  kcal_per_gram?: number
  ml_per_gram?: number

  // Noom
  noom_food_type: NoomFoodType
  noom_color?: NoomColor

  // Recipe flag
  is_recipe: boolean

  // Metadata
  notes?: string
  source?: string
  created_at: string
  updated_at: string
}

export interface CreateFoodItemInput {
  name: string
  brand?: string
  barcode?: string
  calories: number
  fat_g: number
  saturated_fat_g?: number
  carb_g: number
  sugar_g?: number
  fiber_g?: number
  protein_g: number
  salt_g?: number
  default_amount: number
  default_unit: string
  ml_per_gram?: number
  noom_food_type: NoomFoodType
  notes?: string
  source?: string
}

/**
 * Get all food items for the current user
 */
export function useFoodItems() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recipe', false)
        .order('name')

      if (error) throw error
      return data as FoodItem[]
    },
    enabled: !!user,
  })
}

/**
 * Search food items
 */
export function useSearchFoodItems(query: string, noomFilter?: NoomColor) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', 'search', user?.id, query, noomFilter],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      let queryBuilder = supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recipe', false)

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      }

      if (noomFilter) {
        queryBuilder = queryBuilder.eq('noom_color', noomFilter)
      }

      const { data, error } = await queryBuilder.order('name')

      if (error) throw error
      return data as FoodItem[]
    },
    enabled: !!user && (!!query || !!noomFilter),
  })
}

/**
 * Get a single food item by ID
 */
export function useFoodItem(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as FoodItem
    },
    enabled: !!user && !!id,
  })
}

/**
 * Create a new food item
 */
export function useCreateFoodItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFoodItemInput) => {
      if (!user) throw new Error('User not authenticated')

      // Calculate kcal_per_gram
      const kcal_per_gram =
        input.default_unit === 'g' ? input.calories / input.default_amount : undefined

      // Calculate Noom color
      const noom_color = kcal_per_gram
        ? calculateNoomColor({
            calories: input.calories,
            weightGrams: input.default_amount,
            foodType: input.noom_food_type,
          })
        : undefined

      const { data, error } = await supabase
        .from('food_items')
        .insert({
          user_id: user.id,
          ...input,
          kcal_per_gram,
          noom_color,
          is_recipe: false,
        })
        .select()
        .single()

      if (error) throw error
      return data as FoodItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

/**
 * Update a food item
 */
export function useUpdateFoodItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateFoodItemInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated')

      // Recalculate kcal_per_gram if relevant fields changed
      let updates: Record<string, unknown> = { ...input }

      if (
        input.calories !== undefined ||
        input.default_amount !== undefined ||
        input.default_unit !== undefined
      ) {
        const current = await supabase.from('food_items').select('*').eq('id', id).single()

        if (current.data) {
          const calories = input.calories ?? current.data.calories
          const default_amount = input.default_amount ?? current.data.default_amount
          const default_unit = input.default_unit ?? current.data.default_unit
          const noom_food_type = input.noom_food_type ?? current.data.noom_food_type

          const kcal_per_gram = default_unit === 'g' ? calories / default_amount : undefined

          const noom_color = kcal_per_gram
            ? calculateNoomColor({
                calories,
                weightGrams: default_amount,
                foodType: noom_food_type,
              })
            : undefined

          updates = {
            ...updates,
            kcal_per_gram,
            noom_color,
          }
        }
      }

      const { data, error } = await supabase
        .from('food_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as FoodItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}

/**
 * Delete a food item
 */
export function useDeleteFoodItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
    },
  })
}
