'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase, ReviewerBadgeType } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import ProfileSetupModal from '@/components/ProfileSetupModal'
import ReviewerBadge from '@/components/ReviewerBadge'

export default function AccountMenu() {
  const { user, profile, needsProfile, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [badge, setBadge] = useState<ReviewerBadgeType | null>(null)

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

  return (
    <div className="flex items-center gap-3">
      {profile ? (
        <>
          <Link href={`/reviewers/${profile.id}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <span className="font-medium">{profile.display_name}</span>
            <ReviewerBadge badge={badge} />
          </Link>
          <button onClick={() => signOut()} className="text-sm text-gray-400 hover:text-gray-700">
            Log out
          </button>
        </>
      ) : user ? (
        <span className="text-sm text-gray-400">Finishing setup…</span>
      ) : (
        <button
          onClick={() => setShowAuth(true)}
          className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Log in
        </button>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {needsProfile && <ProfileSetupModal />}
    </div>
  )
}
