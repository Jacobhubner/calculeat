import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/stores/profileStore'
import type { FoodItem } from './useFoodItems'

export interface RecentFoodItem extends FoodItem {
  last_used_at: string
  times_used: number
}

/**
 * Get recently logged food items for the active profile
 * Returns unique food items logged in the last 7 days, ordered by most recent
 */
export function useRecentFoodItems(limit = 10) {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)

  return useQuery({
    queryKey: ['recentFoodItems', user?.id, activeProfile?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      // Get recent meal entry items with food details
      const { data, error } = await supabase
        .from('meal_entry_items')
        .select(
          `
          food_item_id,
          created_at,
          meal_entry:meal_entries!inner(
            daily_log:daily_logs!inner(
              profile_id,
              log_date
            )
          ),
          food_item:food_items(*)
        `
        )
        .eq('meal_entry.daily_log.profile_id', activeProfile.id)
        .gte('meal_entry.daily_log.log_date', sevenDaysAgoStr)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by food_item_id and get most recent usage
      const foodMap = new Map<string, RecentFoodItem>()

      for (const item of data) {
        if (!item.food_item) continue

        const foodId = item.food_item_id
        const existingEntry = foodMap.get(foodId)

        if (!existingEntry) {
          foodMap.set(foodId, {
            ...(item.food_item as FoodItem),
            last_used_at: item.created_at,
            times_used: 1,
          })
        } else {
          existingEntry.times_used += 1
        }
      }

      // Convert to array and sort by most recent first
      const recentFoods = Array.from(foodMap.values())
        .sort((a, b) => new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime())
        .slice(0, limit)

      return recentFoods
    },
    enabled: !!user && !!activeProfile,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Get most frequently logged food items for the active profile
 * Returns food items ordered by frequency of use in the last 30 days
 */
export function useFrequentFoodItems(limit = 10) {
  const { user } = useAuth()
  const activeProfile = useProfileStore(state => state.activeProfile)

  return useQuery({
    queryKey: ['frequentFoodItems', user?.id, activeProfile?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')
      if (!activeProfile) throw new Error('No active profile')

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

      // Get meal entry items with food details
      const { data, error } = await supabase
        .from('meal_entry_items')
        .select(
          `
          food_item_id,
          created_at,
          meal_entry:meal_entries!inner(
            daily_log:daily_logs!inner(
              profile_id,
              log_date
            )
          ),
          food_item:food_items(*)
        `
        )
        .eq('meal_entry.daily_log.profile_id', activeProfile.id)
        .gte('meal_entry.daily_log.log_date', thirtyDaysAgoStr)

      if (error) throw error

      // Group by food_item_id and count usage
      const foodMap = new Map<string, RecentFoodItem>()

      for (const item of data) {
        if (!item.food_item) continue

        const foodId = item.food_item_id
        const existingEntry = foodMap.get(foodId)

        if (!existingEntry) {
          foodMap.set(foodId, {
            ...(item.food_item as FoodItem),
            last_used_at: item.created_at,
            times_used: 1,
          })
        } else {
          existingEntry.times_used += 1
          // Keep track of most recent usage
          if (new Date(item.created_at) > new Date(existingEntry.last_used_at)) {
            existingEntry.last_used_at = item.created_at
          }
        }
      }

      // Convert to array and sort by frequency
      const frequentFoods = Array.from(foodMap.values())
        .sort((a, b) => b.times_used - a.times_used)
        .slice(0, limit)

      return frequentFoods
    },
    enabled: !!user && !!activeProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
