'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase, ReviewWithReviewer } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ReviewerBadge from '@/components/ReviewerBadge'

interface ComplexInfo {
  name: string
  city: string
  state: string
}

interface Props {
  reviews: ReviewWithReviewer[]
  /** id -> complex info. Pass this to show which complex each review belongs to (reviewer profile pages). */
  complexes?: Record<string, ComplexInfo>
  emptyMessage?: string
}

function StarLine({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  return (
    <span className="text-xs text-gray-500">
      {label}: {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  )
}

type ReportState = 'idle' | 'confirming' | 'submitting' | 'reported' | 'error'

function ReportControl({ reviewId }: { reviewId: string }) {
  const { user } = useAuth()
  const [state, setState] = useState<ReportState>('idle')

  if (!user) return null // reporting requires a signed-in account, same as leaving a review

  if (state === 'reported') {
    return <span className="text-xs text-gray-400 mt-1.5 block">Reported — thanks, we&apos;ll take a look.</span>
  }

  if (state === 'confirming' || state === 'submitting') {
    const submitting = state === 'submitting'
    return (
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <span className="text-gray-500">Report this as inappropriate?</span>
        <button
          type="button"
          disabled={submitting}
          onClick={async () => {
            setState('submitting')
            const { error } = await supabase
              .from('review_reports')
              .insert({ review_id: reviewId, reporter_user_id: user.id })
            if (error) {
              // unique-violation (23505) just means they already reported this one
              setState(error.code === '23505' ? 'reported' : 'error')
            } else {
              setState('reported')
            }
          }}
          className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {submitting ? 'Reporting…' : 'Yes, report'}
        </button>
        <button type="button" disabled={submitting} onClick={() => setState('idle')} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
          Cancel
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return <span className="text-xs text-red-500 mt-1.5 block">Couldn&apos;t submit that — try again in a moment.</span>
  }

  return (
    <button
      type="button"
      onClick={() => setState('confirming')}
      className="text-xs text-gray-400 hover:text-red-600 mt-1.5"
    >
      Report
    </button>
  )
}

export default function ReviewsList({ reviews, complexes, emptyMessage = 'No reports yet.' }: Props) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyMessage}</p>
  }

  return (
    <div className="divide-y divide-gray-100">
      {reviews.map(r => {
        const complex = complexes?.[r.complex_id]
        return (
          <div key={r.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {r.reviewer_display_name ? (
                <Link href={`/reviewers/${r.user_id}`} className="text-sm font-semibold text-gray-800 hover:text-blue-700">
                  {r.reviewer_display_name}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-gray-400">Anonymous</span>
              )}
              <ReviewerBadge badge={r.reviewer_badge} />
              {r.field_name && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📍 {r.field_name}</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(r.visit_date ?? r.submitted_at).toLocaleDateString()}
              </span>
            </div>

            {complex && (
              <Link href={`/complex/${r.complex_id}`} className="text-xs text-blue-600 hover:underline">
                {complex.name} — {complex.city}, {complex.state}
              </Link>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              <StarLine label="Bathrooms" value={r.bathroom_cleanliness} />
              <StarLine label="Concessions" value={r.concessions_quality} />
              <StarLine label="Bleachers" value={r.bleachers_cleanliness} />
            </div>

            {r.reviewer_note && (
              <>
                <p className="text-sm text-gray-600 mt-1.5 italic">&ldquo;{r.reviewer_note}&rdquo;</p>
                <ReportControl reviewId={r.id} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
