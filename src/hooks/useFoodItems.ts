import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { type FoodColor, type FoodType } from '@/lib/calculations/colorDensity'

export type FoodSource = 'manual' | 'livsmedelsverket' | 'usda' | 'user' | 'shared'
export type FoodTab = 'mina' | 'slv' | 'usda' | 'alla'

export interface PaginatedResult {
  items: FoodItem[]
  totalCount: number
  totalPages: number
}

export interface FoodItem {
  id: string
  user_id: string | null // NULL = global item, string = user-specific
  name: string
  brand?: string | null
  barcode?: string | null

  // Copy-on-Write tracking
  global_food_id?: string | null // Reference to original global item (for user copies)
  is_hidden?: boolean // Soft-delete marker for user copies

  // Source tracking
  source: FoodSource
  external_id?: string | null

  // Nutrition per reference amount
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

  // Reference basis for nutrition values
  reference_amount: number // e.g. 100
  reference_unit: 'g' | 'ml' // e.g. 'g'
  density_g_per_ml?: number | null // required for ml → kcal_per_gram conversion

  // Conversion data
  weight_grams?: number
  kcal_per_gram?: number | null
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
  energy_density_color?: FoodColor | null

  // Recipe flag
  is_recipe: boolean

  // Metadata
  notes?: string | null
  created_at: string
  updated_at: string

  // Sharing
  shared_by?: string | null // avsändarens visningsnamn, sätts när source='shared'
  data_hash?: string | null // SHA-256 nutritionshash, beräknas av DB-trigger
}

/**
 * Apply shadowing logic to food items:
 * - User items override global items with the same global_food_id (ID-based only)
 * - Hidden items are excluded
 * - No name-based shadowing — same name can exist across multiple sources
 */
function applyShadowing(items: FoodItem[], userId: string): FoodItem[] {
  // Get IDs of global items that user has copied (via global_food_id)
  const shadowedGlobalIds = new Set(
    items
      .filter(item => item.user_id === userId && item.global_food_id)
      .map(item => item.global_food_id)
  )

  return items.filter(item => {
    // Exclude hidden items
    if (item.is_hidden) return false

    // Keep user's own non-hidden items
    if (item.user_id === userId) return true

    // For global items: exclude ONLY if shadowed via global_food_id
    if (item.user_id === null && shadowedGlobalIds.has(item.id)) return false

    // All other global items: show
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
  reference_amount?: number
  reference_unit?: 'g' | 'ml'
  density_g_per_ml?: number | null
  ml_per_gram?: number
  grams_per_piece?: number
  serving_unit?: string
  food_type: FoodType
  notes?: string
  source?: FoodSource
  external_id?: string
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

      // Fetch both global items (user_id IS NULL) and user's own items.
      // PostgREST default limit is 1000 — use two separate queries to ensure
      // user's own items are always included regardless of total count.
      const [globalResult, userResult] = await Promise.all([
        supabase.from('food_items').select('*').is('user_id', null).order('name').limit(10000),
        supabase.from('food_items').select('*').eq('user_id', user.id).order('name').limit(10000),
      ])

      if (globalResult.error) throw globalResult.error
      if (userResult.error) throw userResult.error

      const combined = [...(globalResult.data as FoodItem[]), ...(userResult.data as FoodItem[])]

      // Apply shadowing: user items override global items
      return applyShadowing(combined, user.id)
    },
    enabled: !!user,
  })
}

/**
 * Search food items (global + user-specific with shadowing)
 */
export function useSearchFoodItems(query: string, colorFilter?: FoodColor) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['foodItems', 'search', user?.id, query, colorFilter],
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

      if (colorFilter) {
        queryBuilder = queryBuilder.eq('energy_density_color', colorFilter)
      }

      const { data, error } = await queryBuilder.order('name')

      if (error) throw error

      // Apply shadowing: user items override global items
      return applyShadowing(data as FoodItem[], user.id)
    },
    enabled: !!user && (!!query || !!colorFilter),
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

      // Trigger handles kcal_per_gram and energy_density_color calculation
      const { data, error } = await supabase
        .from('food_items')
        .insert({
          user_id: user.id,
          source: input.source ?? 'user',
          external_id: input.external_id,
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

      // If it's a global item (user_id is null), use RPC for atomic copy
      if (existingItem.user_id === null) {
        const { data: copyId, error: rpcError } = await supabase.rpc('copy_food_to_user', {
          p_food_item_id: id,
          p_user_id: user.id,
        })
        if (rpcError) throw rpcError

        // If edits were provided, apply them to the copy
        if (Object.keys(input).length > 0) {
          const { data, error } = await supabase
            .from('food_items')
            .update(input)
            .eq('id', copyId)
            .eq('user_id', user.id)
            .select()
            .single()
          if (error) throw error
          return data as FoodItem
        }

        // Return the copy as-is
        const { data, error } = await supabase
          .from('food_items')
          .select('*')
          .eq('id', copyId)
          .single()
        if (error) throw error
        return data as FoodItem
      }

      // For user's own items, update normally — trigger handles derived fields
      const { data, error } = await supabase
        .from('food_items')
        .update(input)
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
            source: 'user',
            name: `_hidden_${existingItem.name}`,
            default_amount: 100,
            default_unit: 'g',
            weight_grams: 100,
            reference_amount: 100,
            reference_unit: 'g',
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

/**
 * Paginated food items with server-side shadowing, search, and filtering.
 * Uses the search_food_items RPC function.
 */
export function usePaginatedFoodItems(params: {
  tab: FoodTab
  page: number
  pageSize?: number
  searchQuery?: string
  colorFilter?: FoodColor | null
  isRecipeFilter?: boolean
}) {
  const { user } = useAuth()
  const { tab, page, pageSize = 50, searchQuery, colorFilter, isRecipeFilter } = params

  return useQuery({
    queryKey: [
      'foodItems',
      'paginated',
      tab,
      page,
      pageSize,
      searchQuery,
      colorFilter,
      isRecipeFilter,
      user?.id,
    ],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('search_food_items', {
        p_tab: tab,
        p_user_id: user.id,
        p_search: searchQuery || null,
        p_color: colorFilter || null,
        p_is_recipe: isRecipeFilter || null,
        p_limit: pageSize,
        p_offset: page * pageSize,
      })

      if (error) throw error

      const row = (data as Array<{ items: unknown; total_count: number; total_pages: number }>)[0]
      return {
        items: (row.items ?? []) as FoodItem[],
        totalCount: Number(row.total_count),
        totalPages: Number(row.total_pages),
      } as PaginatedResult
    },
    enabled: !!user,
    keepPreviousData: true,
  })
}
