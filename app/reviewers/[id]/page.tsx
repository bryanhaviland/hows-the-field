'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, ReviewerStats, ReviewWithReviewer } from '@/lib/supabase'
import ReviewerBadge from '@/components/ReviewerBadge'
import ReviewsList from '@/components/ReviewsList'

interface ComplexInfo {
  name: string
  city: string
  state: string
}

export default function ReviewerProfile() {
  const { id } = useParams<{ id: string }>()
  const [stats, setStats] = useState<ReviewerStats | null>(null)
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [complexes, setComplexes] = useState<Record<string, ComplexInfo>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.from('reviewer_stats').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('reviews_with_reviewer').select('*').eq('user_id', id).order('submitted_at', { ascending: false }),
    ]).then(async ([{ data: s }, { data: r }]) => {
      if (!active) return
      const reviewRows = (r as ReviewWithReviewer[]) ?? []
      setStats(s as ReviewerStats | null)
      setReviews(reviewRows)

      const complexIds = Array.from(new Set(reviewRows.map(rv => rv.complex_id)))
      if (complexIds.length > 0) {
        const { data: c } = await supabase.from('field_complexes').select('id,name,city,state').in('id', complexIds)
        if (!active) return
        const lookup: Record<string, ComplexInfo> = {}
        for (const row of c ?? []) lookup[row.id] = { name: row.name, city: row.city, state: row.state }
        setComplexes(lookup)
      }
      setLoading(false)
    })

    return () => { active = false }
  }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>
  if (!stats) return <div className="text-center py-16 text-gray-400">Reviewer not found.</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/reviewers" className="text-sm text-gray-500 hover:text-gray-800">← Back to reviewers</Link>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-gray-900">{stats.display_name}</h1>
          <ReviewerBadge badge={stats.badge} />
        </div>
        <p className="text-sm text-gray-500">Member since {new Date(stats.member_since).toLocaleDateString()}</p>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-lg font-bold text-gray-900">{stats.review_count}</div>
            <div className="text-xs text-gray-400">Total reports</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{stats.reviews_last_30_days}</div>
            <div className="text-xs text-gray-400">Last 30 days</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{stats.complexes_reviewed}</div>
            <div className="text-xs text-gray-400">Complexes reviewed</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Review history</h2>
        <ReviewsList reviews={reviews} complexes={complexes} emptyMessage="No reports submitted yet." />
      </div>
    </div>
  )
}
