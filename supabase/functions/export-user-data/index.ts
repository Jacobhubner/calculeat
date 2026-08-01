import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user
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

    // Fetch all user data
    const [
      { data: userProfile },
      { data: profiles },
      { data: foodItems },
      { data: meals },
      { data: mealItems },
      { data: measurements },
      { data: consentLog },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').eq('user_id', user.id),
      supabase.from('food_items').select('*').eq('user_id', user.id),
      supabase.from('meals').select('*').eq('user_id', user.id),
      supabase
        .from('meal_items')
        .select(
          `
        *,
        meals(id)
      `
        )
        .in(
          'meal_id',
          (await supabase.from('meals').select('id').eq('user_id', user.id)).data?.map(m => m.id) ||
            []
        ),
      supabase
        .from('measurement_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('measurement_date', { ascending: false }),
      supabase.from('consent_audit_log').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      user_profile: userProfile,
      profiles: profiles || [],
      food_items: foodItems || [],
      meals: meals || [],
      meal_items: mealItems || [],
      measurements: measurements || [],
      consent_audit_log: consentLog || [],
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="calculeat-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
