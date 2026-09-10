'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useSavedComplexes, sportTypeLabel } from '@/lib/saved-complexes'
import PremiumGate from '@/components/PremiumGate'
import AuthModal from '@/components/AuthModal'
import SportIcon from '@/components/SportIcon'
import { SavedComplexWithField, SportType, isWatchActive } from '@/lib/supabase'

const TABS: SportType[] = ['baseball', 'softball', 'both', 'soccer', 'flag_football']

export default function DashboardPage() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-xl font-bold text-gray-900 mb-2">My Fields</h1>
        <p className="text-sm text-gray-500 mb-4">Log in to see your home fields and favorites.</p>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Log in
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Fields</h1>
        <p className="text-gray-500 mt-1 text-sm">Your home fields and favorites, all in one place.</p>
      </div>

      <PremiumGate
        icon="⭐"
        title="Home Fields & Favorites"
        description="Mark a complex as a home field or favorite from its page and it'll show up here — up to 5 home fields and 10 favorites per sport."
      >
        <DashboardTabs />
      </PremiumGate>
    </div>
  )
}

function DashboardTabs() {
  const { saved, loading, remove, setWatch } = useSavedComplexes()
  const [activeTab, setActiveTab] = useState<SportType>('baseball')

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading…</div>
  }

  if (saved.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
        Nothing saved yet — open a complex and set it as a home field or favorite.
      </div>
    )
  }

  const tabsWithContent = TABS.filter(t => saved.some(s => s.field_complexes.sport_type === t))
  const tabs = tabsWithContent.length > 0 ? tabsWithContent : TABS
  const currentTab: SportType = tabs.includes(activeTab) ? activeTab : tabs[0]

  const home = saved.filter(s => s.kind === 'home' && s.field_complexes.sport_type === currentTab)
  const favorites = saved.filter(s => s.kind === 'favorite' && s.field_complexes.sport_type === currentTab)

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`shrink-0 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
              currentTab === t
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {sportTypeLabel(t)}
          </button>
        ))}
      </div>

      {home.length === 0 && favorites.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
          No home fields or favorites for {sportTypeLabel(currentTab)} yet.
        </div>
      ) : (
        <div className="space-y-5">
          {home.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Home Fields</h2>
              <div className="space-y-2">
                {home.map(s => (
                  <SavedRow
                    key={s.id}
                    saved={s}
                    onRemove={() => remove(s.complex_id, 'home')}
                    onToggleWatch={() => setWatch(s.complex_id, !isWatchActive(s))}
                    accent="blue"
                  />
                ))}
              </div>
            </div>
          )}
          {favorites.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Favorites</h2>
              <div className="space-y-2">
                {favorites.map(s => (
                  <SavedRow
                    key={s.id}
                    saved={s}
                    onRemove={() => remove(s.complex_id, 'favorite')}
                    onToggleWatch={() => setWatch(s.complex_id, !isWatchActive(s))}
                    accent="amber"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SavedRow({
  saved,
  onRemove,
  onToggleWatch,
  accent,
}: {
  saved: SavedComplexWithField
  onRemove: () => void
  onToggleWatch: () => void
  accent: 'blue' | 'amber'
}) {
  const c = saved.field_complexes
  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-lg border border-gray-200 p-3">
      <Link href={`/complex?id=${c.id}`} className="min-w-0 flex items-center gap-2">
        <SportIcon sport={c.sport_type} size={20} />
        <div className="min-w-0">
          <div className="font-medium text-gray-900 text-sm truncate">{c.name}</div>
          <div className="text-xs text-gray-500">
            {c.city}, {c.state}
            {c.num_fields ? ` · ${c.num_fields} fields` : ''}
          </div>
        </div>
      </Link>
      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={onToggleWatch}
          title={
            isWatchActive(saved)
              ? `Watching for lightning until ${new Date(saved.watch_lightning_expires_at as string).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })} — tap to stop`
              : 'Get a lightning alert here for 2 days'
          }
          className={`text-sm px-1.5 py-1.5 rounded-lg ${
            isWatchActive(saved) ? 'text-purple-600' : 'text-gray-300 hover:text-gray-500'
          }`}
        >
          🔔
        </button>
        <button
          onClick={onRemove}
          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg ${
            accent === 'blue' ? 'text-blue-600 hover:bg-blue-50' : 'text-amber-600 hover:bg-amber-50'
          }`}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
