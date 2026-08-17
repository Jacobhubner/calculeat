/**
 * Driftkontroll för receptbanken.
 *
 * Ett recepts näringsvärden räknas bara om när receptet sparas om. Ändras ett
 * globalt livsmedel står de officiella recepten kvar med gamla värden tills
 * någon åtgärdar dem. Den här hooken hämtar vilka som berörs.
 *
 * Endast läsning — omräkning sker medvetet via receptredigeraren, så att
 * näringsberäkningen går genom samma kod som skapade receptet.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface DriftedIngredient {
  ingredient: string
  was: number
  now: number
}

export interface DriftedRecipe {
  recipe_id: string
  recipe_name: string
  drifted_ingredients: number
  total_ingredients: number
  /** Receptets lagrade kcal/100 g — det användaren ser idag */
  stored_per_100g: number | null
  /** Vad det skulle bli vid en omräkning */
  recalculated_per_100g: number | null
  /** Skillnad i kcal/100 g. Nära noll = bara varningen är inaktuell. */
  delta_per_100g: number | null
  details: DriftedIngredient[] | null
}

export function useDriftedRecipes(enabled: boolean) {
  return useQuery({
    queryKey: ['drifted-official-recipes'],
    queryFn: async (): Promise<DriftedRecipe[]> => {
      const { data, error } = await supabase.rpc('get_drifted_official_recipes')
      if (error) throw error
      return (data as DriftedRecipe[]) ?? []
    },
    enabled,
    staleTime: 60_000,
  })
}
