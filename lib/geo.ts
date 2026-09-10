/**
 * Shared geo helpers for the Field Conditions premium feature: rounding
 * coordinates into a cache "grid cell" (so nearby lookups reuse the same
 * lightning/rain cache row instead of each complex hitting the upstream
 * API separately), and geocoding a complex's address the first time it's
 * needed.
 */

/** ~111m per 0.001° of latitude — plenty precise for "is there a storm near this field". */
export function gridKey(lat: number, lon: number, precision = 3): string {
  return `${lat.toFixed(precision)},${lon.toFixed(precision)}`
}

/**
 * Google Geocoding API. Switched from the free US Census Bureau geocoder
 * on 2026-09-04 — Census's "Public Address Ranges" dataset routinely
 * failed to match park/sports-complex addresses (confirmed: 0/159
 * complexes ever resolved, including ones with a complete, valid street
 * address), so lightning and rain silently never worked. Google's
 * coverage handles these addresses correctly. 10,000 free requests/month,
 * far more than this app's one-time-per-complex backfill needs. Falls
 * back to null on any failure so callers can just skip lightning/rain for
 * that complex rather than error out.
 */
export async function geocodeAddress(parts: {
  address: string | null
  city: string
  state: string
  zip: string | null
}): Promise<{ latitude: number; longitude: number } | null> {
  const oneLine = [parts.address, parts.city, parts.state, parts.zip].filter(Boolean).join(', ')
  if (!oneLine) return null

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
  if (!apiKey) {
    console.error('[geo] GOOGLE_GEOCODING_API_KEY is not set')
    return null
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', oneLine)
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'OK') {
      if (data.status !== 'ZERO_RESULTS') console.error('[geo] Google geocode error', data.status, data.error_message)
      return null
    }
    const location = data?.results?.[0]?.geometry?.location
    if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return null
    return { latitude: location.lat, longitude: location.lng }
  } catch (err) {
    console.error('[geo] Google geocode fetch failed', err)
    return null
  }
}

/**
 * Verifies a user-submitted address against the Google Geocoding API before
 * we accept a new complex submission. This confirms the address is REAL
 * and SPECIFIC (resolves to a street address or a named place, not just
 * "somewhere in this city") — it does NOT confirm there's actually a ball
 * field there. Google's Geocoding API has no concept of "is this a sports
 * complex"; that would need the separate Places API (and a coach could
 * paste a street address for a park that Google hasn't tagged as one
 * anyway). So this is a real-address check, and every submission still
 * lands with is_verified = false for manual review before it goes public.
 */
export async function verifyAddress(parts: {
  address: string
  city: string
  state: string
  zip: string | null
}): Promise<
  | { ok: true; latitude: number; longitude: number; formattedAddress: string }
  | { ok: false; reason: string }
> {
  const oneLine = [parts.address, parts.city, parts.state, parts.zip].filter(Boolean).join(', ')
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
  if (!apiKey) {
    console.error('[geo] GOOGLE_GEOCODING_API_KEY is not set')
    return { ok: false, reason: 'Address verification is not available right now — try again later.' }
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', oneLine)
  url.searchParams.set('key', apiKey)

  let data: {
    status?: string
    results?: {
      formatted_address?: string
      geometry?: { location?: { lat?: number; lng?: number }; location_type?: string }
      types?: string[]
    }[]
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    data = await res.json()
  } catch (err) {
    console.error('[geo] verifyAddress fetch failed', err)
    return { ok: false, reason: 'Could not reach the address verification service — try again.' }
  }

  if (data.status === 'ZERO_RESULTS') {
    return { ok: false, reason: "That address doesn't look real — double-check it and try again." }
  }
  if (data.status !== 'OK') {
    return { ok: false, reason: 'Could not verify that address — double-check it and try again.' }
  }

  const result = data.results?.[0]
  const location = result?.geometry?.location
  const locationType = result?.geometry?.location_type
  const types: string[] = result?.types ?? []
  if (typeof location?.lat !== 'number' || typeof location?.lng !== 'number') {
    return { ok: false, reason: 'Could not verify that address — double-check it and try again.' }
  }

  // Reject matches that only resolved to a city/zip/county centroid rather
  // than a specific street address or named place — those are Google's
  // best guess at "somewhere around here," not a real pin for this field.
  const genericTypes = new Set([
    'locality', 'political', 'postal_code', 'administrative_area_level_1',
    'administrative_area_level_2', 'administrative_area_level_3',
    'administrative_area_level_4', 'administrative_area_level_5', 'country',
  ])
  const isGenericOnly = types.length > 0 && types.every((t) => genericTypes.has(t))
  const isSpecific =
    locationType === 'ROOFTOP' ||
    locationType === 'RANGE_INTERPOLATED' ||
    types.includes('street_address') ||
    types.includes('premise') ||
    types.includes('point_of_interest') ||
    types.includes('park') ||
    types.includes('establishment')

  if (isGenericOnly || !isSpecific) {
    return { ok: false, reason: 'That only matched a general area, not a specific address — add the street address and try again.' }
  }

  return {
    ok: true,
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: result?.formatted_address ?? oneLine,
  }
}

/**
 * Places API (New) — Nearby Search. Checks whether Google has an actual
 * park/athletic-facility indexed within a short walk of a geocoded
 * submission. This is what lets a coach's submission auto-publish without
 * anyone manually confirming it: verifyAddress() above only proves the
 * address is real, this proves there's a recognizable sports facility
 * sitting there. Requires "Places API (New)" enabled in Google Cloud
 * Console for the same project/key as GOOGLE_GEOCODING_API_KEY (reuses
 * that key — no separate secret needed).
 *
 * A confirmed match here is treated as strong enough to auto-verify a
 * submission outright. No match (a bad/imprecise address, or a real field
 * Google just hasn't tagged yet — common for smaller towns) falls back to
 * the manual pending-review queue rather than rejecting outright, so a
 * legitimate complex never silently gets bounced.
 */
const FIELD_LIKE_PLACE_TYPES = [
  'park',
  'sports_complex',
  'athletic_field',
  'stadium',
  'sports_club',
  'sports_activity_location',
]

const FIELD_SEARCH_RADIUS_METERS = 200

export async function checkAthleticFieldNearby(
  latitude: number,
  longitude: number
): Promise<{ confirmed: boolean; matchedName?: string; matchedType?: string }> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
  if (!apiKey) {
    console.error('[geo] GOOGLE_GEOCODING_API_KEY is not set (checkAthleticFieldNearby)')
    return { confirmed: false }
  }

  let data: {
    places?: { displayName?: { text?: string }; types?: string[] }[]
  }
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.types',
      },
      body: JSON.stringify({
        includedTypes: FIELD_LIKE_PLACE_TYPES,
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: FIELD_SEARCH_RADIUS_METERS,
          },
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('[geo] Places nearby search failed', res.status, await res.text().catch(() => ''))
      return { confirmed: false }
    }
    data = await res.json()
  } catch (err) {
    console.error('[geo] Places nearby search fetch failed', err)
    return { confirmed: false }
  }

  const match = (data.places ?? []).find((p) =>
    (p.types ?? []).some((t) => FIELD_LIKE_PLACE_TYPES.includes(t))
  )
  if (!match) return { confirmed: false }

  const matchedType = (match.types ?? []).find((t) => FIELD_LIKE_PLACE_TYPES.includes(t))
  return { confirmed: true, matchedName: match.displayName?.text, matchedType }
}

/** Degrees → 8-point compass direction, e.g. for Xweather's strike bearing. */
export function compassDirection(degrees: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return points[Math.round(degrees / 45) % 8]
}
