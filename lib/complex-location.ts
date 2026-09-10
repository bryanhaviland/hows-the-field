import { supabaseAdmin } from '@/lib/supabase-admin'
import { geocodeAddress } from '@/lib/geo'

/**
 * Resolves lat/lng for a complex, geocoding + backfilling the row the
 * first time it's needed (existing complexes were never given
 * coordinates). Shared by the lightning and rain routes.
 */
export async function resolveComplexLocation(
  complexId: string
): Promise<{ latitude: number; longitude: number } | null> {
  const admin = supabaseAdmin()

  const { data: complex } = await admin
    .from('field_complexes')
    .select('id, address, city, state, zip, latitude, longitude')
    .eq('id', complexId)
    .maybeSingle()

  if (!complex) return null

  if (complex.latitude != null && complex.longitude != null) {
    return { latitude: complex.latitude, longitude: complex.longitude }
  }

  const geocoded = await geocodeAddress({
    address: complex.address,
    city: complex.city,
    state: complex.state,
    zip: complex.zip,
  })
  if (!geocoded) return null

  // Best-effort backfill — if this write races with another request for the
  // same complex, both just write the same value, no harm done.
  await admin
    .from('field_complexes')
    .update({ latitude: geocoded.latitude, longitude: geocoded.longitude })
    .eq('id', complexId)

  return geocoded
}
