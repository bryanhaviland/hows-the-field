'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, ReviewerStats } from '@/lib/supabase'
import ReviewerBadge from '@/components/ReviewerBadge'

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<ReviewerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reviewer_stats')
      .select('*')
      .gt('review_count', 0)
      .order('review_count', { ascending: false })
      .then(({ data }) => {
        setReviewers((data as ReviewerStats[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviewers</h1>
        <p className="text-gray-500 mt-1 text-sm">
          See who&apos;s been reporting on fields, and how much you can trust them.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading reviewers…</div>
      ) : reviewers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No reviewers yet — be the first to submit a report.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {reviewers.map(r => (
            <Link
              key={r.user_id}
              href={`/reviewers/${r.user_id}`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{r.display_name}</span>
                  <ReviewerBadge badge={r.badge} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Member since {new Date(r.member_since).toLocaleDateString()} · {r.complexes_reviewed} complex{r.complexes_reviewed !== 1 ? 'es' : ''} reviewed
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-gray-800">{r.review_count}</div>
                <div className="text-xs text-gray-400">report{r.review_count !== 1 ? 's' : ''}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
