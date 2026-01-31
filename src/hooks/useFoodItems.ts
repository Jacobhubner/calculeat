import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { calculateFoodColor, type FoodColor, type FoodType } from '@/lib/calculations/colorDensity'

export interface FoodItem {
  id: string
  user_id: string | null // NULL = global item, string = user-specific
  name: string
  brand?: string
  barcode?: string

  // Copy-on-Write tracking
  global_food_id?: string | null // Reference to original global item (for user copies)
  is_hidden?: boolean // Soft-delete marker for user copies

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
  weight_grams?: number
  kcal_per_gram?: number
  grams_per_unit?: number
  ml_per_gram?: number
  grams_per_piece?: number
  serving_unit?: string

  // Per unit nutrition values
  kcal_per_unit?: number
  fat_per_unit?: number
  carb_per_unit?: number
  protein_per_unit?: number

  // Food color density tracking
  food_type: FoodType
  energy_density_color?: FoodColor

  // Recipe flag
  is_recipe: boolean

  // Metadata
  notes?: string
  source?: string
  created_at: string
  updated_at: string
}

/**
 * Apply shadowing logic to food items:
 * - User items override global items with the same global_food_id
 * - Hidden items are excluded
 * - User items take precedence over global items with the same name
 */
function applyShadowing(items: FoodItem[], userId: string): FoodItem[] {
  // Get IDs of global items that user has copied (via global_food_id)
  const shadowedGlobalIds = new Set(
    items
      .filter(item => item.user_id === userId && item.global_food_id)
      .map(item => item.global_food_id)
  )

  // Get names of user items (for name-based shadowing fallback)
  const userItemNames = new Set(
    items
      .filter(item => item.user_id === userId && !item.is_hidden)
      .map(item => item.name.toLowerCase())
  )

  return items.filter(item => {
    // Exclude hidden items
    if (item.is_hidden) return false

    // Keep user's own non-hidden items
    if (item.user_id === userId) return true

    // For global items: exclude if shadowed by ID or name
    if (item.user_id === null) {
      if (shadowedGlobalIds.has(item.id)) return false
      if (userItemNames.has(item.name.toLowerCase())) return false
    }

    return true
  })
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
  weight_grams: number
  ml_per_gram?: number
  grams_per_piece?: number
  serving_unit?: string
  food_type: FoodType
  notes?: string
  source?: string
}

/**
 * Get all food items for the current user (global + user-specific with shadowing)
 */
export function useFoodItems() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // Fetch both global items (user_id IS NULL) and user's own items
      // Include recipes (is_recipe=true) so they can be logged
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('name')

      if (error) throw error

      // Apply shadowing: user items override global items
      return applyShadowing(data as FoodItem[], user.id)
    },
    enabled: !!user,
  })
}

/**
 * Search food items (global + user-specific with shadowing)
 */
export function useSearchFoodItems(query: string, noomFilter?: FoodColor) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', 'search', user?.id, query, noomFilter],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // Include recipes in search so they can be found and logged
      let queryBuilder = supabase
        .from('food_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      }

      if (noomFilter) {
        queryBuilder = queryBuilder.eq('energy_density_color', noomFilter)
      }

      const { data, error } = await queryBuilder.order('name')

      if (error) throw error

      // Apply shadowing: user items override global items
      return applyShadowing(data as FoodItem[], user.id)
    },
    enabled: !!user && (!!query || !!noomFilter),
  })
}

/**
 * Get a single food item by ID (works with both global and user items)
 */
export function useFoodItem(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // RLS policy handles access control - we can fetch global or user's own items
      const { data, error } = await supabase.from('food_items').select('*').eq('id', id).single()

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

      // Calculate kcal_per_gram based on weight_grams (always 100g base)
      const weight_grams = input.weight_grams ?? 100
      const kcal_per_gram = weight_grams > 0 ? input.calories / weight_grams : undefined

      // Calculate food color density
      const energy_density_color = kcal_per_gram
        ? calculateFoodColor({
            calories: input.calories,
            weightGrams: weight_grams,
            foodType: input.food_type,
          })
        : undefined

      const { data, error } = await supabase
        .from('food_items')
        .insert({
          user_id: user.id,
          ...input,
          kcal_per_gram,
          energy_density_color,
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
 * Update a food item (with Copy-on-Write for global items)
 */
export function useUpdateFoodItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateFoodItemInput> & { id: string }) => {
      if (!user) throw new Error('User not authenticated')

      // Fetch the current item to check if it's global
      const { data: existingItem, error: fetchError } = await supabase
        .from('food_items')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // If it's a global item (user_id is null), create a user copy instead of updating
      if (existingItem.user_id === null) {
        return await createUserCopyWithEdits(existingItem, input, user.id)
      }

      // For user's own items, update normally
      let updates: Record<string, unknown> = { ...input }

      if (
        input.calories !== undefined ||
        input.default_amount !== undefined ||
        input.default_unit !== undefined ||
        input.weight_grams !== undefined ||
        input.food_type !== undefined
      ) {
        const calories = input.calories ?? existingItem.calories
        const weight_grams = input.weight_grams ?? existingItem.weight_grams ?? 100
        const food_type = input.food_type ?? existingItem.food_type

        const kcal_per_gram = weight_grams > 0 ? calories / weight_grams : undefined
        const energy_density_color = kcal_per_gram
          ? calculateFoodColor({
              calories,
              weightGrams: weight_grams,
              foodType: food_type,
            })
          : undefined

        updates = { ...updates, kcal_per_gram, energy_density_color }
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
 * Helper: Create a user copy of a global item with edits applied
 */
async function createUserCopyWithEdits(
  globalItem: FoodItem,
  edits: Partial<CreateFoodItemInput>,
  userId: string
): Promise<FoodItem> {
  // Merge global item data with edits
  const name = edits.name ?? globalItem.name
  const calories = edits.calories ?? globalItem.calories
  const weight_grams = edits.weight_grams ?? globalItem.weight_grams ?? 100
  const food_type = edits.food_type ?? globalItem.food_type

  // Calculate derived fields
  const kcal_per_gram = weight_grams > 0 ? calories / weight_grams : undefined
  const energy_density_color = kcal_per_gram
    ? calculateFoodColor({
        calories,
        weightGrams: weight_grams,
        foodType: food_type,
      })
    : undefined

  const { data, error } = await supabase
    .from('food_items')
    .insert({
      user_id: userId,
      global_food_id: globalItem.id, // Track the original global item
      name,
      brand: edits.brand ?? globalItem.brand,
      barcode: edits.barcode ?? globalItem.barcode,
      default_amount: edits.default_amount ?? globalItem.default_amount,
      default_unit: edits.default_unit ?? globalItem.default_unit,
      weight_grams,
      calories,
      fat_g: edits.fat_g ?? globalItem.fat_g,
      carb_g: edits.carb_g ?? globalItem.carb_g,
      protein_g: edits.protein_g ?? globalItem.protein_g,
      saturated_fat_g: edits.saturated_fat_g ?? globalItem.saturated_fat_g,
      sugar_g: edits.sugar_g ?? globalItem.sugar_g,
      fiber_g: edits.fiber_g ?? globalItem.fiber_g,
      salt_g: edits.salt_g ?? globalItem.salt_g,
      ml_per_gram: edits.ml_per_gram ?? globalItem.ml_per_gram,
      grams_per_piece: edits.grams_per_piece ?? globalItem.grams_per_piece,
      serving_unit: edits.serving_unit ?? globalItem.serving_unit,
      food_type,
      kcal_per_gram,
      energy_density_color,
      is_recipe: globalItem.is_recipe,
      notes: edits.notes ?? globalItem.notes,
      source: edits.source ?? globalItem.source,
    })
    .select()
    .single()

  if (error) throw error
  return data as FoodItem
}

/**
 * Delete a food item (with soft-delete for global items)
 */
export function useDeleteFoodItem() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated')

      // Check if this is a global item
      const { data: existingItem, error: fetchError } = await supabase
        .from('food_items')
        .select('user_id, name')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // If it's a global item, create a hidden marker (soft delete)
      if (existingItem.user_id === null) {
        // Check if user already has a hidden marker for this item
        const { data: existingMarker } = await supabase
          .from('food_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('global_food_id', id)
          .single()

        if (existingMarker) {
          // Update existing marker to be hidden
          const { error: updateError } = await supabase
            .from('food_items')
            .update({ is_hidden: true })
            .eq('id', existingMarker.id)

          if (updateError) throw updateError
        } else {
          // Create a new hidden marker
          const { error: insertError } = await supabase.from('food_items').insert({
            user_id: user.id,
            global_food_id: id,
            is_hidden: true,
            name: `_hidden_${existingItem.name}`,
            default_amount: 100,
            default_unit: 'g',
            weight_grams: 100,
            calories: 0,
            fat_g: 0,
            carb_g: 0,
            protein_g: 0,
            food_type: 'Solid',
            is_recipe: false,
          })

          if (insertError) throw insertError
        }
        return
      }

      // For user's own items, actually delete
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
