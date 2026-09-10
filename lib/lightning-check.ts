import type { SupabaseClient } from '@supabase/supabase-js'
import { gridKey, compassDirection } from './geo'
import { logXweatherCall } from './xweather-usage'
import type { LightningStatus } from './supabase'

// Storm-aware polling: the whole point of caching server-side is that no
// matter how many phones have this complex's page open, Xweather only
// actually gets hit on this cadence per grid cell — and it tightens up
// automatically when a strike is actually nearby. The lightning-watch cron
// job (lightning-watch-job.ts) shares this same cache and cadence.
export const BASELINE_POLL_SECONDS = 10 * 60   // quiet skies: check every 10 min
export const ELEVATED_POLL_SECONDS = 3 * 60    // something within the hour: every 3 min
export const HOLD_POLL_SECONDS = 60            // active hold: every 60 sec

// Matches the standard Florida youth-sports lightning policy (Thor Guard /
// "30-30 rule" facilities included): stop play on any strike within 10
// miles, hold for 30 minutes after the LAST qualifying strike, and any new
// qualifying strike resets the clock back to 30.
export const DANGER_RADIUS_MILES = 10
export const HOLD_MINUTES = 30

// Informational-only "heads up, lightning has been in the area" window —
// does not by itself mean play should stop, just surfaced so someone
// deciding whether to head to the field has context.
export const ELEVATED_RADIUS_MILES = 30
export const ELEVATED_WINDOW_MINUTES = 60

type CachedRow = {
  last_strike_at: string | null
  distance_miles: number | null
  bearing: string | null
  last_danger_strike_at: string | null
  trend?: string | null
  next_poll_at?: string
  last_notified_hold_active?: boolean | null
}

type Trend = 'approaching' | 'receding' | 'steady' | 'unknown'

export interface LightningCheckResult {
  gridKey: string
  status: LightningStatus
  /**
   * lightning_cache.last_notified_hold_active as it stood BEFORE this poll —
   * lets a caller detect a hold start/clear transition without a second
   * query. Only the lightning-watch cron job cares about this; the API
   * route (app/api/conditions/lightning) ignores it.
   */
  previousNotifiedHoldActive: boolean | null
}

function emptyStatus(pollIntervalSeconds: number, source: 'cache' | 'live'): LightningStatus {
  return {
    hasRecentStrike: false,
    distanceMiles: null,
    bearing: null,
    strikeAt: null,
    ageMinutes: null,
    holdActive: false,
    clearAt: null,
    trend: 'unknown' as Trend,
    pollIntervalSeconds,
    source,
  }
}

/**
 * Fetches (or reuses the cached) lightning status for a lat/lng, keyed by
 * grid cell exactly like the client-facing route — shared so the
 * lightning-watch cron job and the per-complex API route never drift out
 * of sync on what "a hold" means. Extracted from
 * app/api/conditions/lightning/route.ts.
 */
export async function checkLightningForLocation(
  admin: SupabaseClient,
  latitude: number,
  longitude: number
): Promise<LightningCheckResult> {
  const key = gridKey(latitude, longitude)

  const { data: cached } = await admin
    .from('lightning_cache')
    .select('*')
    .eq('grid_key', key)
    .maybeSingle()

  const previousNotifiedHoldActive: boolean | null = cached?.last_notified_hold_active ?? null

  const now = Date.now()
  if (cached && new Date(cached.next_poll_at).getTime() > now) {
    return { gridKey: key, status: toStatus(cached, 'cache'), previousNotifiedHoldActive }
  }

  const clientId = process.env.XWEATHER_CLIENT_ID
  const clientSecret = process.env.XWEATHER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    // Not configured yet — behave as "no data" rather than erroring out.
    return { gridKey: key, status: emptyStatus(BASELINE_POLL_SECONDS, 'live'), previousNotifiedHoldActive }
  }

  let closest: {
    last_strike_at: string | null
    distance_miles: number | null
    bearing: string | null
  }
  let dangerStrikeAtFromThisPoll: string | null = null
  let strikeCountRecent = 0

  try {
    const url = new URL(`https://data.api.xweather.com/lightning/closest`)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('client_secret', clientSecret)
    url.searchParams.set('p', `${latitude},${longitude}`)
    url.searchParams.set('radius', '80km') // ~50mi — Xweather's max on standard access is ~100km
    url.searchParams.set('filter', 'cg')   // cloud-to-ground only — the strikes that matter for field safety
    url.searchParams.set('limit', '10')

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    // Log the call the moment we know it actually went out over the wire —
    // this is what Xweather bills for, regardless of what comes back.
    await logXweatherCall(admin, 'lightning/closest', key)
    const json = await res.json()
    const hits: unknown[] = Array.isArray(json?.response) ? json.response : []

    const parsed = hits
      .map((h) => {
        const nearest = h as Record<string, unknown>
        const ob = (nearest.ob ?? {}) as Record<string, unknown>
        const relativeTo = (nearest.relativeTo ?? {}) as Record<string, unknown>
        const timestampIso =
          (ob.dateTimeISO as string | undefined) ??
          (typeof ob.timestamp === 'number' ? new Date(ob.timestamp * 1000).toISOString() : null)
        const distanceMiles = typeof relativeTo.distanceMI === 'number' ? relativeTo.distanceMI : null
        const bearing =
          (relativeTo.bearingENG as string | undefined) ??
          (typeof relativeTo.bearing === 'number' ? compassDirection(relativeTo.bearing) : null)
        return { timestampIso, distanceMiles, bearing }
      })
      // "closest" sorts by distance, not time — a strike further down the
      // list can still be the most recent one inside the danger radius.
      .filter((h) => h.timestampIso && h.distanceMiles != null)

    strikeCountRecent = parsed.length

    const nearestOverall = parsed[0] as
      | { timestampIso: string | null; distanceMiles: number | null; bearing: string | null }
      | undefined
    closest = nearestOverall
      ? { last_strike_at: nearestOverall.timestampIso, distance_miles: nearestOverall.distanceMiles, bearing: nearestOverall.bearing ?? null }
      : { last_strike_at: null, distance_miles: null, bearing: null }

    const withinDanger = parsed.filter((h) => (h.distanceMiles ?? Infinity) <= DANGER_RADIUS_MILES)
    if (withinDanger.length > 0) {
      dangerStrikeAtFromThisPoll = withinDanger.reduce((latest, h) =>
        !latest || new Date(h.timestampIso as string).getTime() > new Date(latest).getTime() ? (h.timestampIso as string) : latest
      , null as string | null)
    }
  } catch (err) {
    console.error('[lightning-check] Xweather fetch failed', err)
    // Upstream hiccup — fall back to "no data" rather than caching a hard
    // failure, but still back off the poll interval so we don't hammer it.
    return { gridKey: key, status: emptyStatus(BASELINE_POLL_SECONDS, 'live'), previousNotifiedHoldActive }
  }

  // The hold clock only ever moves forward — a poll that doesn't happen to
  // surface a danger-radius strike this time (it's aged out of the
  // closest-10 results, say) must not erase a hold that's still active.
  const previousDangerAt = cached?.last_danger_strike_at ?? null
  const lastDangerStrikeAt =
    dangerStrikeAtFromThisPoll && (!previousDangerAt || new Date(dangerStrikeAtFromThisPoll).getTime() > new Date(previousDangerAt).getTime())
      ? dangerStrikeAtFromThisPoll
      : previousDangerAt

  const pollIntervalSeconds = pollIntervalFor(lastDangerStrikeAt, closest.last_strike_at)
  const fetchedAt = new Date().toISOString()
  const nextPollAt = new Date(now + pollIntervalSeconds * 1000).toISOString()

  // Trend: is the closest strike getting nearer or farther than it was on
  // the previous poll? Only meaningful when the previous reading is recent
  // enough to be "the same weather system" rather than an unrelated one.
  const trend = computeTrend(closest.distance_miles, cached ?? null)

  // Deliberately NOT touching last_notified_hold_active here — that column
  // belongs to the lightning-watch cron job, which updates it separately
  // only after it has actually sent (or decided not to send) a push.
  await admin.from('lightning_cache').upsert({
    grid_key: key,
    last_strike_at: closest.last_strike_at,
    distance_miles: closest.distance_miles,
    bearing: closest.bearing,
    last_danger_strike_at: lastDangerStrikeAt,
    trend,
    strike_count_recent: strikeCountRecent,
    fetched_at: fetchedAt,
    next_poll_at: nextPollAt,
  })

  return {
    gridKey: key,
    status: toStatus(
      { ...closest, last_danger_strike_at: lastDangerStrikeAt, trend, next_poll_at: nextPollAt },
      'live'
    ),
    previousNotifiedHoldActive,
  }
}

function computeTrend(
  currentDistanceMiles: number | null,
  previousRow: { distance_miles: number | null; fetched_at?: string | null } | null
): Trend {
  if (currentDistanceMiles == null) return 'unknown'
  const previousDistance = previousRow?.distance_miles ?? null
  const previousFetchedAt = previousRow?.fetched_at ?? null
  if (previousDistance == null || !previousFetchedAt) return 'unknown'

  const previousAgeMinutes = (Date.now() - new Date(previousFetchedAt).getTime()) / 60000
  if (previousAgeMinutes > ELEVATED_WINDOW_MINUTES) return 'unknown' // too stale to compare

  const delta = currentDistanceMiles - previousDistance
  if (delta <= -1) return 'approaching'
  if (delta >= 1) return 'receding'
  return 'steady'
}

function pollIntervalFor(lastDangerStrikeAtIso: string | null, closestStrikeAtIso: string | null): number {
  if (lastDangerStrikeAtIso) {
    const holdAgeMinutes = (Date.now() - new Date(lastDangerStrikeAtIso).getTime()) / 60000
    if (holdAgeMinutes <= HOLD_MINUTES) return HOLD_POLL_SECONDS
  }
  if (closestStrikeAtIso) {
    const ageMinutes = (Date.now() - new Date(closestStrikeAtIso).getTime()) / 60000
    if (ageMinutes <= ELEVATED_WINDOW_MINUTES) return ELEVATED_POLL_SECONDS
  }
  return BASELINE_POLL_SECONDS
}

function toStatus(row: CachedRow, source: 'cache' | 'live'): LightningStatus {
  const pollIntervalSeconds = row.next_poll_at
    ? Math.max(15, Math.round((new Date(row.next_poll_at).getTime() - Date.now()) / 1000))
    : BASELINE_POLL_SECONDS

  const holdActive =
    !!row.last_danger_strike_at &&
    Date.now() - new Date(row.last_danger_strike_at).getTime() < HOLD_MINUTES * 60000
  const clearAt = holdActive
    ? new Date(new Date(row.last_danger_strike_at as string).getTime() + HOLD_MINUTES * 60000).toISOString()
    : null

  const trend: Trend = (row.trend as Trend | undefined) ?? 'unknown'

  if (!row.last_strike_at) {
    return { ...emptyStatus(pollIntervalSeconds, source), holdActive, clearAt }
  }

  const ageMinutes = Math.round((Date.now() - new Date(row.last_strike_at).getTime()) / 60000)
  const hasRecentStrike =
    ageMinutes <= ELEVATED_WINDOW_MINUTES && (row.distance_miles ?? Infinity) <= ELEVATED_RADIUS_MILES

  return {
    hasRecentStrike: hasRecentStrike || holdActive,
    distanceMiles: row.distance_miles,
    bearing: row.bearing,
    strikeAt: row.last_strike_at,
    ageMinutes,
    holdActive,
    clearAt,
    trend,
    pollIntervalSeconds,
    source,
  }
}
