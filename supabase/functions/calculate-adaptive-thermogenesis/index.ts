/**
 * Supabase Edge Function: Calculate Adaptive Thermogenesis (AT)
 *
 * Runs daily via cron job to:
 * 1. Calculate 7-day average calorie balance for each profile
 * 2. Update accumulated AT based on calorie balance
 * 3. Save AT history for tracking
 *
 * Specification: ADAPTIVE_THERMOGENESIS_SPEC.md
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// AT Constants
const AT_DEFICIT_RATE = -0.015 // -1.5% of baseline per week at deficit
const AT_SURPLUS_RATE = 0.0075 // +0.75% of baseline per week at surplus
const AT_MIN_LIMIT = -0.12 // Max -12% of baseline_bmr
const AT_MAX_LIMIT = 0.06 // Max +6% of baseline_bmr

interface Profile {
  id: string
  user_id: string
  weight_kg: number | null
  height_cm: number | null
  birth_date: string | null
  gender: 'male' | 'female' | null
  baseline_bmr: number | null
  accumulated_at: number | null
  tdee: number | null
}

interface WeightHistory {
  weight_kg: number
  recorded_at: string
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  const baseBMR = 9.99 * weight + 6.25 * height - 4.92 * age
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Calculate weekly AT change
 */
function calculateWeeklyAT(
  baseline_bmr: number,
  calorie_balance_7d: number,
  current_accumulated_at: number
): {
  at_weekly: number
  accumulated_at: number
  is_at_max_limit: boolean
  is_at_min_limit: boolean
} {
  // 1. Calculate weekly AT based on baseline_bmr
  let at_weekly = 0
  if (calorie_balance_7d < 0) {
    at_weekly = AT_DEFICIT_RATE * baseline_bmr
  } else if (calorie_balance_7d > 0) {
    at_weekly = AT_SURPLUS_RATE * baseline_bmr
  }

  // 2. Calculate new accumulated AT
  let new_accumulated_at = current_accumulated_at + at_weekly

  // 3. Apply limits
  const min_limit = AT_MIN_LIMIT * baseline_bmr
  const max_limit = AT_MAX_LIMIT * baseline_bmr

  const is_at_min_limit = new_accumulated_at <= min_limit
  const is_at_max_limit = new_accumulated_at >= max_limit

  new_accumulated_at = Math.max(min_limit, Math.min(max_limit, new_accumulated_at))

  return {
    at_weekly,
    accumulated_at: new_accumulated_at,
    is_at_max_limit,
    is_at_min_limit,
  }
}

serve(async (_req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all profiles with baseline_bmr set (AT enabled)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, weight_kg, height_cm, birth_date, gender, baseline_bmr, accumulated_at, tdee')
      .not('baseline_bmr', 'is', null)

    if (profilesError) throw profilesError

    console.log(`Processing ${profiles?.length || 0} profiles with AT enabled`)

    const results = []

    for (const profile of profiles as Profile[]) {
      try {
        // Skip if missing required data
        if (!profile.baseline_bmr || !profile.weight_kg || !profile.height_cm || !profile.birth_date || !profile.gender || !profile.tdee) {
          console.log(`Skipping profile ${profile.id}: Missing required data`)
          continue
        }

        // Get weight history for last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: weightHistory, error: weightError } = await supabase
          .from('weight_history')
          .select('weight_kg, recorded_at')
          .eq('profile_id', profile.id)
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true })

        if (weightError) throw weightError

        // Need at least 2 weight entries to calculate balance
        if (!weightHistory || weightHistory.length < 2) {
          console.log(`Skipping profile ${profile.id}: Insufficient weight data (need at least 2 entries in last 7 days)`)
          continue
        }

        const weights = weightHistory as WeightHistory[]

        // Calculate weight change
        const firstWeight = weights[0].weight_kg
        const lastWeight = weights[weights.length - 1].weight_kg
        const weightChange = lastWeight - firstWeight

        // Estimate calorie balance from weight change
        // 1 kg = ~7700 kcal
        const calorie_balance_7d = weightChange * 7700

        // Calculate current expected BMR
        const age = calculateAge(profile.birth_date)
        const bmr_expected = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)

        // Calculate AT
        const current_accumulated_at = profile.accumulated_at || 0
        const atResult = calculateWeeklyAT(
          profile.baseline_bmr,
          calorie_balance_7d,
          current_accumulated_at
        )

        // Calculate effective BMR
        const bmr_effective = bmr_expected + atResult.accumulated_at

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            accumulated_at: atResult.accumulated_at,
            last_at_calculation_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', profile.id)

        if (updateError) throw updateError

        // Save to AT history
        const { error: historyError } = await supabase
          .from('adaptive_thermogenesis_history')
          .insert({
            profile_id: profile.id,
            calculation_date: new Date().toISOString().split('T')[0],
            baseline_bmr: profile.baseline_bmr,
            bmr_expected,
            calorie_balance_7d,
            at_weekly: atResult.at_weekly,
            accumulated_at: atResult.accumulated_at,
            bmr_effective,
          })

        if (historyError) {
          // Ignore duplicate key errors (already calculated today)
          if (!historyError.message.includes('duplicate')) {
            throw historyError
          }
        }

        results.push({
          profile_id: profile.id,
          weight_change: weightChange.toFixed(2),
          calorie_balance_7d: Math.round(calorie_balance_7d),
          at_weekly: Math.round(atResult.at_weekly),
          accumulated_at: Math.round(atResult.accumulated_at),
          bmr_effective: Math.round(bmr_effective),
        })

        console.log(`Processed profile ${profile.id}: AT=${Math.round(atResult.accumulated_at)} kcal`)
      } catch (error) {
        console.error(`Error processing profile ${profile.id}:`, error)
        results.push({
          profile_id: profile.id,
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('AT calculation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
