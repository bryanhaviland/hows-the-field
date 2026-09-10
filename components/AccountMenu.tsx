'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase, ReviewerBadgeType, SportType } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import ProfileSetupModal from '@/components/ProfileSetupModal'
import ReviewerBadge from '@/components/ReviewerBadge'
import SportTypeMultiSelect from '@/components/SportTypeMultiSelect'

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

export default function AccountMenu() {
  const { user, profile, needsProfile, signOut, updatePreferredSports, deleteAccount } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [badge, setBadge] = useState<ReviewerBadgeType | null>(null)
  const [open, setOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) {
      setBadge(null)
      return
    }
    supabase
      .from('reviewer_stats')
      .select('badge')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setBadge((data?.badge as ReviewerBadgeType) ?? null))
  }, [profile])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmingDelete(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const toggleSport = (sport: string) => {
    if (!profile) return
    const s = sport as SportType
    const next = profile.preferred_sports.includes(s)
      ? profile.preferred_sports.filter(x => x !== s)
      : [...profile.preferred_sports, s]
    updatePreferredSports(next)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    const { error } = await deleteAccount()
    setDeleting(false)
    if (error) {
      setDeleteError(error)
      return
    }
    setOpen(false)
    setConfirmingDelete(false)
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-sm text-gray-400">Finishing setup…</span>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Log In
          </button>
        )}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        {needsProfile && <ProfileSetupModal />}
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account menu"
        className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0"
      >
        {initials(profile.display_name)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-20 p-4 text-sm">
          <Link
            href={`/reviewers/profile?id=${profile.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 font-medium text-gray-900 hover:text-blue-600"
          >
            {profile.display_name}
            <ReviewerBadge badge={badge} />
          </Link>

          <div className="border-t border-gray-100 mt-3 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Which Fields Do You Want To See?
            </p>
            <SportTypeMultiSelect selected={profile.preferred_sports} onToggle={toggleSport} size={18} />
            <p className="text-xs text-gray-400 mt-2">Sets your default filter on the search page.</p>
          </div>

          <div className="border-t border-gray-100 mt-3 pt-3 space-y-2">
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="w-full text-left text-gray-600 hover:text-gray-900"
            >
              Log Out
            </button>

            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="w-full text-left text-red-600 hover:text-red-700"
              >
                Remove My Data
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-xs text-red-800">
                  This permanently deletes your account and personal data. This can&apos;t be undone.
                </p>
                {deleteError && <p className="text-xs text-red-700 font-medium">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="flex-1 bg-white border border-gray-300 text-gray-600 text-xs font-semibold py-1.5 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
