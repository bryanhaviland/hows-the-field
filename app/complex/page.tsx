'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, FieldComplex, Field, RatingsSummary, ReviewWithReviewer } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AmenitiesSummary from '@/components/AmenitiesSummary'
import FieldsList from '@/components/FieldsList'
import RatingForm from '@/components/RatingForm'
import CrowdRatings from '@/components/CrowdRatings'
import ReviewsList from '@/components/ReviewsList'
import SportIcon from '@/components/SportIcon'
import FieldConditionsPanel from '@/components/FieldConditionsPanel'
import SaveComplexControls from '@/components/SaveComplexControls'
import AddFieldForm from '@/components/AddFieldForm'

function ComplexDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { user } = useAuth()
  const [complex, setComplex] = useState<FieldComplex | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [summary, setSummary] = useState<RatingsSummary | null>(null)
  const [reviews, setReviews] = useState<ReviewWithReviewer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState<ReviewWithReviewer | null>(null)
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null)
  const [showMoreCrowdData, setShowMoreCrowdData] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    if (!id) {
      setLoading(false)
      return Promise.resolve()
    }
    return Promise.all([
      supabase.from('field_complexes').select('*').eq('id', id).single(),
      supabase.from('fields').select('*').eq('complex_id', id).order('field_name'),
      supabase.from('complex_ratings_summary').select('*').eq('complex_id', id).maybeSingle(),
      supabase.from('reviews_with_reviewer').select('*').eq('complex_id', id).order('submitted_at', { ascending: false }),
    ]).then(([{ data: c }, { data: f }, { data: s }, { data: r }]) => {
      setComplex(c)
      setFields(f ?? [])
      setSummary(s ?? null)
      setReviews((r as ReviewWithReviewer[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [id])

  const myReview = user ? reviews.find(r => r.user_id === user.id) ?? null : null

  const leaveNoteOnField = (fieldId: string) => {
    setEditingReview(null)
    setFocusFieldId(fieldId)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('submit-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const openReviewForm = () => {
    setEditingReview(myReview)
    setFocusFieldId(null)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('submit-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>
  if (!complex) return <div className="text-center py-16 text-gray-400">Complex not found.</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← Back to search</Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{complex.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {complex.address && `${complex.address}, `}{complex.city}, {complex.state}
              {complex.num_fields ? ` · ${complex.num_fields} fields` : ''}
            </p>
          </div>
          <SportIcon sport={complex.sport_type} size={22} />
        </div>
        {complex.website && (
          <a href={complex.website} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Visit Website →
          </a>
        )}
      </div>

      {/* Home field / favorite (premium) */}
      <SaveComplexControls complexId={complex.id} sportType={complex.sport_type} />

      {/* Today at the Field (premium) */}
      <FieldConditionsPanel complex={complex} fields={fields} />

      {/* Amenities — crowdsourced from parent visit reports, never admin-set */}
      <Section
        title="Amenities"
        subtitle={summary && summary.review_count > 0 ? `${summary.review_count} visit report${summary.review_count !== 1 ? 's' : ''}` : 'Crowdsourced'}
      >
        {summary && summary.review_count > 0 ? (
          <>
            <AmenitiesSummary summary={summary} />
            <button
              onClick={() => setShowMoreCrowdData(v => !v)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {showMoreCrowdData ? 'Hide Full Crowd-Sourced Report' : 'See Full Crowd-Sourced Report'}
            </button>
            {showMoreCrowdData && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <CrowdRatings summary={summary} />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">
            No visit reports yet — be the first to submit one below.
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          {myReview && !showForm ? (
            <button onClick={openReviewForm} className="text-sm text-blue-600 hover:underline font-medium">
              Edit My Review Of Amenities
            </button>
          ) : !showForm ? (
            <button
              onClick={openReviewForm}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Submit A Visit Report
            </button>
          ) : null}
        </div>
      </Section>

      {showForm && (
        <div id="submit-report" className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h3 className="font-semibold text-gray-900">Been Here Recently?</h3>
              <p className="text-sm text-gray-600">Help other parents know what to pack.</p>
            </div>
            <button
              onClick={() => { setShowForm(false); setEditingReview(null); setFocusFieldId(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
            >
              Never Mind
            </button>
          </div>
          <RatingForm
            complexId={complex.id}
            initialFieldId={focusFieldId}
            existingReview={editingReview}
            onSubmit={() => {
              setShowForm(false)
              setEditingReview(null)
              setFocusFieldId(null)
              setLoading(true)
              loadData()
            }}
          />
        </div>
      )}

      {/* Fields */}
      <Section title={`Fields (${fields.length})`}>
        {fields.length > 0 ? (
          <FieldsList fields={fields} onLeaveNote={leaveNoteOnField} />
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">
            No individual fields listed for this complex yet.
          </p>
        )}
        {showAddField ? (
          <AddFieldForm
            complexId={complex.id}
            onSubmit={() => { setShowAddField(false); loadData() }}
            onCancel={() => setShowAddField(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddField(true)}
            className="mt-3 text-sm text-blue-600 hover:underline font-medium"
          >
            + Add A Field
          </button>
        )}
      </Section>

      {/* Individual reviews */}
      {reviews.length > 0 && (
        <Section title="Individual Reports" subtitle={`${reviews.length} report${reviews.length !== 1 ? 's' : ''}`}>
          <ReviewsList reviews={reviews} />
        </Section>
      )}

      {complex.field_notes && (
        <div className="text-xs text-gray-400 leading-relaxed">{complex.field_notes}</div>
      )}

      <div className="text-center">
        <Link href={`/complex/report?id=${complex.id}`} className="text-xs text-gray-400 hover:text-gray-600 underline">
          See something wrong with this listing? Report it →
        </Link>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

export default function ComplexDetail() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading…</div>}>
      <ComplexDetailInner />
    </Suspense>
  )
}
