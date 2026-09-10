'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, SavedComplexKind, SavedComplexWithField, SportType, isWatchActive } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export const HOME_FIELD_LIMIT = 5
export const FAVORITE_LIMIT = 10
/** How long a lightning watch stays active once turned on, before it stops
 *  firing on its own — see setWatch below. */
export const WATCH_DURATION_DAYS = 2

/** Human-friendly message for the trigger's SAVE_LIMIT_REACHED error — the
 * DB is the source of truth on the cap, this just makes the client message
 * readable rather than surfacing the raw Postgres exception text. */
function limitReachedMessage(kind: SavedComplexKind, sportType: SportType) {
  const limit = kind === 'home' ? HOME_FIELD_LIMIT : FAVORITE_LIMIT
  const label = kind === 'home' ? 'home fields' : 'favorites'
  return `You've reached your limit of ${limit} ${label} for ${sportTypeLabel(sportType)} — remove one first.`
}

export function sportTypeLabel(sportType: SportType): string {
  switch (sportType) {
    case 'baseball': return 'Baseball'
    case 'softball': return 'Softball'
    case 'both': return 'Baseball & Softball'
    case 'soccer': return 'Soccer'
    case 'flag_football': return 'Flag Football'
  }
}

/**
 * Loads every complex the signed-in user has saved (both kinds, all sport
 * types) in one query, and exposes add/remove that keep it in sync. Shared
 * by the per-complex save controls (components/SaveComplexControls.tsx) and
 * the dashboard (app/dashboard/page.tsx) so both read from the same cache
 * instead of each running their own query.
 */
export function useSavedComplexes() {
  const { user } = useAuth()
  const [saved, setSaved] = useState<SavedComplexWithField[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setSaved([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('saved_complexes')
      .select('id, user_id, complex_id, kind, watch_lightning, watch_lightning_expires_at, created_at, field_complexes(id, name, city, state, sport_type, num_fields)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[saved-complexes] load failed', error)
      setSaved([])
    } else {
      setSaved((data as unknown as SavedComplexWithField[]) ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const isSaved = useCallback(
    (complexId: string, kind: SavedComplexKind) =>
      saved.some(s => s.complex_id === complexId && s.kind === kind),
    [saved]
  )

  /** True if ANY saved row (home field or favorite) for this complex has an
   *  active (not-yet-expired) lightning watch on. */
  const isWatched = useCallback(
    (complexId: string) => saved.some(s => s.complex_id === complexId && isWatchActive(s)),
    [saved]
  )

  const countFor = useCallback(
    (kind: SavedComplexKind, sportType: SportType) =>
      saved.filter(s => s.kind === kind && s.field_complexes.sport_type === sportType).length,
    [saved]
  )

  const add = useCallback(
    async (complexId: string, kind: SavedComplexKind, sportType: SportType): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Log in first.' }
      const { error } = await supabase.from('saved_complexes').insert({ user_id: user.id, complex_id: complexId, kind })
      if (error) {
        const friendly = error.message?.includes('SAVE_LIMIT_REACHED')
          ? limitReachedMessage(kind, sportType)
          : error.message?.includes('duplicate key')
            ? null // already saved — treat as a no-op success, refresh will reconcile
            : 'Something went wrong — try again.'
        if (friendly) return { error: friendly }
      }
      await refresh()
      return { error: null }
    },
    [user, refresh]
  )

  const remove = useCallback(
    async (complexId: string, kind: SavedComplexKind): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Log in first.' }
      const { error } = await supabase
        .from('saved_complexes')
        .delete()
        .eq('user_id', user.id)
        .eq('complex_id', complexId)
        .eq('kind', kind)
      if (error) return { error: 'Something went wrong — try again.' }
      await refresh()
      return { error: null }
    },
    [user, refresh]
  )

  /**
   * Toggles lightning-hold push notifications for this complex. Applies to
   * every saved row for it (home field and/or favorite) at once — watching
   * is a per-complex concept from the user's point of view, even though
   * watch_lightning lives on the per-kind saved_complexes row underneath.
   *
   * Turning it on always (re)starts a fresh WATCH_DURATION_DAYS window from
   * right now — there's no "extend" gesture, just toggle off and back on.
   */
  const setWatch = useCallback(
    async (complexId: string, watch: boolean): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Log in first.' }
      const expiresAt = watch
        ? new Date(Date.now() + WATCH_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
        : null
      const { error } = await supabase
        .from('saved_complexes')
        .update({ watch_lightning: watch, watch_lightning_expires_at: expiresAt })
        .eq('user_id', user.id)
        .eq('complex_id', complexId)
      if (error) return { error: 'Something went wrong — try again.' }
      await refresh()
      return { error: null }
    },
    [user, refresh]
  )

  return { saved, loading, refresh, isSaved, isWatched, countFor, add, remove, setWatch }
}
