import { supabaseAdmin } from './supabase-admin'
import { gridKey } from './geo'
import { checkLightningForLocation } from './lightning-check'
import { sendPushToUsers } from './fcm'

type WatchRow = {
  user_id: string
  complex_id: string
  field_complexes: {
    id: string
    name: string
    latitude: number | null
    longitude: number | null
  } | null
}

/**
 * Runs on a Cloudflare Cron Trigger (see worker.ts). Polls lightning status
 * for every grid cell that has at least one signed-in user watching a home
 * field or favorite there, and pushes a notification on a hold-state
 * transition only (storm starts → "Lightning nearby", storm clears →
 * "All clear") — never on every poll, so a long storm doesn't spam users.
 */
export async function runLightningWatchJob(): Promise<void> {
  const admin = supabaseAdmin()

  const { data, error } = await admin
    .from('saved_complexes')
    .select('user_id, complex_id, field_complexes(id, name, latitude, longitude)')
    .eq('watch_lightning', true)
    // NULL fails a plain `gt` comparison in Postgres, so a legacy row with
    // watch_lightning=true but no expiry (predating this column) is
    // correctly excluded rather than treated as watching forever.
    .gt('watch_lightning_expires_at', new Date().toISOString())

  if (error) {
    console.error('[lightning-watch-job] failed to load watched complexes', error)
    return
  }

  const rows = (data as unknown as WatchRow[]) ?? []
  const withLocation = rows.filter(
    (r) => r.field_complexes?.latitude != null && r.field_complexes?.longitude != null
  )
  if (withLocation.length === 0) return

  // Group watchers by grid cell so a storm system only triggers one
  // Xweather poll (and one push per user) no matter how many complexes in
  // that cell are being watched.
  const cells = new Map<
    string,
    { latitude: number; longitude: number; complexNames: Set<string>; userIds: Set<string> }
  >()

  for (const row of withLocation) {
    const field = row.field_complexes!
    const key = gridKey(field.latitude as number, field.longitude as number)
    let cell = cells.get(key)
    if (!cell) {
      cell = { latitude: field.latitude as number, longitude: field.longitude as number, complexNames: new Set(), userIds: new Set() }
      cells.set(key, cell)
    }
    cell.complexNames.add(field.name)
    cell.userIds.add(row.user_id)
  }

  for (const [key, cell] of cells) {
    const { status, previousNotifiedHoldActive } = await checkLightningForLocation(admin, cell.latitude, cell.longitude)

    // Only act on an actual transition — nothing to do if this cell's hold
    // state hasn't changed since the last time we notified for it.
    if (previousNotifiedHoldActive === status.holdActive) continue

    const userIds = Array.from(cell.userIds)
    const complexLabel = Array.from(cell.complexNames)[0] ?? 'your field'

    if (status.holdActive) {
      await sendPushToUsers(
        admin,
        userIds,
        '⚡ Lightning nearby',
        `Lightning within ${DANGER_LABEL_MILES} miles of ${complexLabel} — play should be on hold.`
      )
    } else {
      await sendPushToUsers(
        admin,
        userIds,
        '✅ All clear',
        `The lightning hold near ${complexLabel} has lifted.`
      )
    }

    await admin.from('lightning_cache').update({ last_notified_hold_active: status.holdActive }).eq('grid_key', key)
  }
}

// Matches DANGER_RADIUS_MILES in lightning-check.ts — kept as a small local
// constant here purely for the push copy, so this file doesn't need to
// import it just to interpolate one number into a notification string.
const DANGER_LABEL_MILES = 10
