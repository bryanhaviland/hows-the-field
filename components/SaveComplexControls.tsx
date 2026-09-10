'use client'

import { useState } from 'react'
import { SportType, isWatchActive } from '@/lib/supabase'
import { useSavedComplexes, HOME_FIELD_LIMIT, FAVORITE_LIMIT, sportTypeLabel } from '@/lib/saved-complexes'
import PremiumGate from '@/components/PremiumGate'

/**
 * Lets a signed-in premium user mark this complex as a home field (max 5)
 * or a favorite (max 10) — both capped per sport type, not cumulative
 * across sports (see the trigger in supabase/migrations/0006_saved_complexes.sql).
 * Sits on the complex detail page.
 */
export default function SaveComplexControls({ complexId, sportType }: { complexId: string; sportType: SportType }) {
  return (
    <PremiumGate
      icon="⭐"
      title="Home Fields & Favorites"
      description="Mark this as a home field or favorite so it's one tap away on your dashboard — up to 5 home fields and 10 favorites per sport."
    >
      <SaveComplexControlsInner complexId={complexId} sportType={sportType} />
    </PremiumGate>
  )
}

function SaveComplexControlsInner({ complexId, sportType }: { complexId: string; sportType: SportType }) {
  const { saved, loading, isSaved, isWatched, countFor, add, remove, setWatch } = useSavedComplexes()
  const [busy, setBusy] = useState<'home' | 'favorite' | null>(null)
  const [watchBusy, setWatchBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-16 animate-pulse" />
  }

  const isHome = isSaved(complexId, 'home')
  const isFavorite = isSaved(complexId, 'favorite')
  const homeCount = countFor('home', sportType)
  const favoriteCount = countFor('favorite', sportType)
  const homeFull = !isHome && homeCount >= HOME_FIELD_LIMIT
  const favoriteFull = !isFavorite && favoriteCount >= FAVORITE_LIMIT
  const watched = isWatched(complexId)
  const watchedRow = saved.find(s => s.complex_id === complexId && isWatchActive(s))
  const watchUntilLabel = watchedRow?.watch_lightning_expires_at
    ? new Date(watchedRow.watch_lightning_expires_at).toLocaleString(undefined, {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  const toggle = async (kind: 'home' | 'favorite') => {
    setError(null)
    setBusy(kind)
    const already = kind === 'home' ? isHome : isFavorite
    const result = already ? await remove(complexId, kind) : await add(complexId, kind, sportType)
    setBusy(null)
    if (result.error) setError(result.error)
  }

  const toggleWatch = async () => {
    setError(null)
    setWatchBusy(true)
    const result = await setWatch(complexId, !watched)
    setWatchBusy(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggle('home')}
          disabled={busy !== null || (homeFull && !isHome)}
          className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
            isHome ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {busy === 'home' ? 'Saving…' : isHome ? '🏠 Home field — remove' : '🏠 Set as home field'}
        </button>
        <button
          onClick={() => toggle('favorite')}
          disabled={busy !== null || (favoriteFull && !isFavorite)}
          className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
            isFavorite ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {busy === 'favorite' ? 'Saving…' : isFavorite ? '★ Favorited — remove' : '☆ Add to favorites'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {homeCount}/{HOME_FIELD_LIMIT} home fields · {favoriteCount}/{FAVORITE_LIMIT} favorites — {sportTypeLabel(sportType)}
      </p>
      {(isHome || isFavorite) && (
        <div className="mt-3">
          <button
            onClick={toggleWatch}
            disabled={watchBusy}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              watched ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {watchBusy ? 'Saving…' : watched ? '🔔 Watching for lightning' : '🔕 Get a lightning alert here'}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            {watched && watchUntilLabel
              ? `Pushing lightning alerts for 2 days (until ${watchUntilLabel}) — then turns off automatically.`
              : 'No lightning alerts for this field.'}
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
