import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { corsJson, corsPreflight } from '@/lib/cors'
import { verifyAddress, checkAthleticFieldNearby } from '@/lib/geo'

const ALLOWED_SPORTS = ['baseball', 'softball', 'both', 'soccer', 'flag_football']

/**
 * A coach submits a complex we don't have yet. Two checks run before it's
 * saved: verifyAddress() confirms the address is real and specific
 * (Google Geocoding), then checkAthleticFieldNearby() confirms Google has
 * an actual park/sports facility indexed near that pin (Places API New).
 * When both pass, the row is inserted with is_verified = true and goes
 * live immediately — no admin step. When Places can't confirm a facility
 * nearby (bad pin, or a real field Google hasn't tagged), it still saves
 * with is_verified = false and sits in the pending queue the FAQ mentions,
 * invisible to public reads (see the "Public can read verified
 * field_complexes" RLS policy) until an admin flips is_verified.
 */
export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return corsJson(req, { error: 'Log in to submit a complex.' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return corsJson(req, { error: 'Your session has expired — log in again.' }, { status: 401 })
  }
  const user = userData.user

  const body = await req.json().catch(() => null)
  if (!body) {
    return corsJson(req, { error: 'Invalid request.' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const address = String(body.address ?? '').trim()
  const city = String(body.city ?? '').trim()
  const state = (String(body.state ?? 'FL').trim() || 'FL').toUpperCase()
  const zip = body.zip ? String(body.zip).trim() : null
  const sportType = String(body.sport_type ?? '')
  const website = body.website ? String(body.website).trim() : null
  const numFields =
    typeof body.num_fields === 'number' && Number.isFinite(body.num_fields) && body.num_fields > 0
      ? Math.round(body.num_fields)
      : null

  if (!name || !address || !city) {
    return corsJson(req, { error: 'Name, address, and city are required.' }, { status: 400 })
  }
  if (!ALLOWED_SPORTS.includes(sportType)) {
    return corsJson(req, { error: 'Pick a valid sport.' }, { status: 400 })
  }

  const verification = await verifyAddress({ address, city, state, zip })
  if (!verification.ok) {
    return corsJson(req, { error: verification.reason }, { status: 422 })
  }

  const fieldCheck = await checkAthleticFieldNearby(verification.latitude, verification.longitude)

  // Purely for attribution — a coach may not have a team on file, that's fine.
  const { data: team } = await admin.from('teams').select('id').eq('user_id', user.id).maybeSingle()

  const { data: inserted, error: insertErr } = await admin
    .from('field_complexes')
    .insert({
      name,
      address,
      city,
      state,
      zip,
      sport_type: sportType,
      num_fields: numFields,
      website,
      latitude: verification.latitude,
      longitude: verification.longitude,
      is_verified: fieldCheck.confirmed,
      submitted_by_team_id: team?.id ?? null,
      submission_count: 1,
      raw_input: JSON.stringify({ name, address, city, state, zip, sport_type: sportType, num_fields: numFields, website }),
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('[complexes/submit] insert failed', insertErr)
    return corsJson(req, { error: 'Something went wrong saving that — try again.' }, { status: 500 })
  }

  return corsJson(req, {
    ok: true,
    id: inserted.id,
    formattedAddress: verification.formattedAddress,
    verified: fieldCheck.confirmed,
  })
}
