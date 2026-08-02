/**
 * Raderar ett användarkonto permanent (GDPR art. 17).
 *
 * Tidigare version ignorerade svaren från städ-anropen i steg 1–2. Om någon
 * av dem misslyckades fortsatte körningen ändå, och admin-raderingen föll på
 * kvarvarande rader — men felet som rapporterades pekade då på fel steg. Nu
 * kontrolleras varje anrop och felet namnger steget som faktiskt brast.
 */
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const fail = (step: string, details: string, status = 500) => {
    console.error(`delete-account misslyckades i steg "${step}": ${details}`)
    return new Response(JSON.stringify({ error: `Steg: ${step}`, details }), {
      status,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth header' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Hämta användaren från JWT
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey },
    })

    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to get user', details: await userRes.text() }),
        { status: 401, headers: corsHeaders }
      )
    }

    const userData = await userRes.json()
    if (!userData.id) {
      return new Response(JSON.stringify({ error: 'No user ID' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const userId = userData.id
    const h = {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }

    /** PostgREST svarar 2xx även när noll rader matchar, så !ok = äkta fel. */
    const run = async (step: string, url: string, init: RequestInit) => {
      const res = await fetch(url, init)
      if (!res.ok) return { step, details: await res.text() }
      return null
    }

    // 1. Nolla SET NULL-FK:er så raderna överlever ägarens konto
    const nullSteps = [
      await run('recipes.created_by', `${supabaseUrl}/rest/v1/recipes?created_by=eq.${userId}`, {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ created_by: null }),
      }),
      await run(
        'shared_lists.created_by',
        `${supabaseUrl}/rest/v1/shared_lists?created_by=eq.${userId}`,
        { method: 'PATCH', headers: h, body: JSON.stringify({ created_by: null }) }
      ),
      await run(
        'barcode_lookup_cache.contributed_by',
        `${supabaseUrl}/rest/v1/barcode_lookup_cache?contributed_by=eq.${userId}`,
        { method: 'PATCH', headers: h, body: JSON.stringify({ contributed_by: null }) }
      ),
      // support_threads har två SET NULL-FK:er som pekar på admins. Saknades
      // helt tidigare — en admin som raderar sig själv blockerades inte, men
      // raderna städas nu konsekvent på samma sätt som övriga.
      await run(
        'support_threads.assigned_admin_id',
        `${supabaseUrl}/rest/v1/support_threads?assigned_admin_id=eq.${userId}`,
        { method: 'PATCH', headers: h, body: JSON.stringify({ assigned_admin_id: null }) }
      ),
      await run(
        'support_threads.closed_by',
        `${supabaseUrl}/rest/v1/support_threads?closed_by=eq.${userId}`,
        { method: 'PATCH', headers: h, body: JSON.stringify({ closed_by: null }) }
      ),
    ].filter(Boolean)

    if (nullSteps.length > 0) {
      return fail(nullSteps[0]!.step, nullSteps[0]!.details)
    }

    // 2. Radera profildata explicit före auth-raderingen. profiles först —
    //    sync_profile_to_user_profiles triggar mot user_profiles.
    const profileFail =
      (await run('profiles', `${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: h,
      })) ??
      (await run('user_profiles', `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
        method: 'DELETE',
        headers: h,
      }))

    if (profileFail) {
      return fail(profileFail.step, profileFail.details)
    }

    // 3. Radera auth-användaren. Resterande tabeller följer via ON DELETE CASCADE.
    const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
    })

    if (!deleteRes.ok) {
      return fail('auth.admin.delete', await deleteRes.text())
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    return fail('okänt', String(err))
  }
})
