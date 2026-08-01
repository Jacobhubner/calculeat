import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Sidstorlek för paginering — håller varje enskild query liten nog för
// edge-runtimens wall-clock-gräns även för användare med mycket data.
const PAGE_SIZE = 1000

/**
 * Hämtar ALLA rader för en query via paginering.
 * `build` anropas per sida så att range() kan appliceras på en färsk builder.
 */
async function fetchAll<T = Record<string, unknown>>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = []
  let page = 0

  for (;;) {
    const from = page * PAGE_SIZE
    const { data, error } = await build(from, from + PAGE_SIZE - 1)

    if (error) {
      const message = (error as { message?: string })?.message ?? String(error)
      return { rows, error: message }
    }
    if (!data || data.length === 0) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    page++
  }

  return { rows, error: null }
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Anon-nyckel + vidarebefordrad JWT: RLS gäller, så även om en query
    // nedan skulle sakna user-filter kan ingen läsa någon annans data.
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const uid = user.id
    const errors: Record<string, string> = {}

    // Hjälpare: enkel "alla rader där <col> = uid"
    const byCol = (table: string, col = 'user_id') =>
      fetchAll((from, to) => supabase.from(table).select('*').eq(col, uid).range(from, to))

    // Hjälpare: rader där någon av två kolumner matchar (skickat/mottaget)
    const byEither = (table: string, a: string, b: string) =>
      fetchAll((from, to) =>
        supabase.from(table).select('*').or(`${a}.eq.${uid},${b}.eq.${uid}`).range(from, to)
      )

    const collect = async <T>(
      key: string,
      run: () => Promise<{ rows: T[]; error: string | null }>
    ): Promise<T[]> => {
      const { rows, error } = await run()
      if (error) errors[key] = error
      return rows
    }

    // --- Steg 1: rottabeller (behövs för att härleda barn-ID:n) -----------
    const [userProfileRes, profiles, mealEntries, recipes, savedMeals, supportThreads] =
      await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', uid).maybeSingle(),
        collect('profiles', () => byCol('profiles')),
        collect('meal_entries', () => byCol('meal_entries')),
        collect('recipes', () => byCol('recipes', 'user_id')),
        collect('saved_meals', () => byCol('saved_meals')),
        collect('support_threads', () => byCol('support_threads')),
      ])

    if (userProfileRes.error) errors['user_profile'] = userProfileRes.error.message

    const ids = (rows: Record<string, unknown>[]) => rows.map(r => r.id as string).filter(Boolean)
    const mealEntryIds = ids(mealEntries as Record<string, unknown>[])
    const recipeIds = ids(recipes as Record<string, unknown>[])
    const savedMealIds = ids(savedMeals as Record<string, unknown>[])
    const threadIds = ids(supportThreads as Record<string, unknown>[])

    // Barnrader hämtas i ID-chunkar så att .in() aldrig blir orimligt stor.
    const byParentIds = async (table: string, col: string, parentIds: string[]) => {
      if (parentIds.length === 0) return { rows: [] as Record<string, unknown>[], error: null }
      const out: Record<string, unknown>[] = []
      for (let i = 0; i < parentIds.length; i += 200) {
        const chunk = parentIds.slice(i, i + 200)
        const { rows, error } = await fetchAll<Record<string, unknown>>((from, to) =>
          supabase.from(table).select('*').in(col, chunk).range(from, to)
        )
        if (error) return { rows: out, error }
        out.push(...rows)
      }
      return { rows: out, error: null }
    }

    // --- Steg 2: allt övrigt ---------------------------------------------
    const [
      foodItems,
      dailyLogs,
      weightHistory,
      measurements,
      calibrationHistory,
      userMealSettings,
      scanUsage,
      notifications,
      recipeRequests,
      subscriptions,
      conversionEvents,
      friendships,
      messages,
      hiddenConversations,
      shareInvitations,
      sharedLists,
      sharedListMembers,
      sharedListInvitations,
      consentLog,
      mealEntryItems,
      recipeIngredients,
      savedMealItems,
      supportMessages,
    ] = await Promise.all([
      collect('food_items', () => byCol('food_items')),
      collect('daily_logs', () => byCol('daily_logs')),
      collect('weight_history', () => byCol('weight_history')),
      collect('measurement_sets', () => byCol('measurement_sets')),
      collect('calibration_history', () => byCol('calibration_history')),
      collect('user_meal_settings', () => byCol('user_meal_settings')),
      collect('scan_usage', () => byCol('scan_usage')),
      collect('notifications', () => byCol('notifications')),
      collect('recipe_requests', () => byCol('recipe_requests')),
      collect('user_subscriptions', () => byCol('user_subscriptions')),
      collect('conversion_events', () => byCol('conversion_events')),
      collect('friendships', () => byEither('friendships', 'requester_id', 'addressee_id')),
      collect('messages', () => byCol('messages', 'sender_id')),
      collect('hidden_conversations', () => byCol('hidden_conversations')),
      collect('share_invitations', () =>
        byEither('share_invitations', 'sender_id', 'recipient_id')
      ),
      collect('shared_lists', () => byCol('shared_lists', 'created_by')),
      collect('shared_list_members', () => byCol('shared_list_members')),
      collect('shared_list_invitations', () =>
        byEither('shared_list_invitations', 'sender_id', 'recipient_id')
      ),
      collect('consent_audit_log', () => byCol('consent_audit_log')),
      collect('meal_entry_items', () =>
        byParentIds('meal_entry_items', 'meal_entry_id', mealEntryIds)
      ),
      collect('recipe_ingredients', () =>
        byParentIds('recipe_ingredients', 'recipe_id', recipeIds)
      ),
      collect('saved_meal_items', () =>
        byParentIds('saved_meal_items', 'saved_meal_id', savedMealIds)
      ),
      collect('support_messages', () => byParentIds('support_messages', 'thread_id', threadIds)),
    ])

    const exportData = {
      export_metadata: {
        format_version: 2,
        exported_at: new Date().toISOString(),
        description:
          'Fullständig export av dina personuppgifter hos Calculeat (GDPR art. 15 och 20).',
        // Transparent om något delfel inträffade — hellre en ofullständig
        // export med tydlig markering än en tyst lucka.
        partial_failures: Object.keys(errors).length > 0 ? errors : null,
      },
      account: {
        user_id: uid,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
      },
      user_profile: userProfileRes.data ?? null,
      profiles,
      consent_audit_log: consentLog,
      food_items: foodItems,
      meal_entries: mealEntries,
      meal_entry_items: mealEntryItems,
      daily_logs: dailyLogs,
      user_meal_settings: userMealSettings,
      saved_meals: savedMeals,
      saved_meal_items: savedMealItems,
      recipes,
      recipe_ingredients: recipeIngredients,
      recipe_requests: recipeRequests,
      weight_history: weightHistory,
      measurement_sets: measurements,
      calibration_history: calibrationHistory,
      friendships,
      messages,
      hidden_conversations: hiddenConversations,
      share_invitations: shareInvitations,
      shared_lists: sharedLists,
      shared_list_members: sharedListMembers,
      shared_list_invitations: sharedListInvitations,
      support_threads: supportThreads,
      support_messages: supportMessages,
      notifications,
      scan_usage: scanUsage,
      user_subscriptions: subscriptions,
      conversion_events: conversionEvents,
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="calculeat-data-export-${
          new Date().toISOString().split('T')[0]
        }.json"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
