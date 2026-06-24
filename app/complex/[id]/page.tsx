'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, FieldComplex, Field, RatingsSummary } from '@/lib/supabase'
import AmenityRow from '@/components/AmenityRow'
import RatingBar from '@/components/RatingBar'
import FieldsList from '@/components/FieldsList'
import RatingForm from '@/components/RatingForm'
import CrowdRatings from '@/components/CrowdRatings'

export default function ComplexDetail() {
  const { id } = useParams<{ id: string }>()
  const [complex, setComplex] = useState<FieldComplex | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [summary, setSummary] = useState<RatingsSummary | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = () =>
    Promise.all([
      supabase.from('field_complexes').select('*').eq('id', id).single(),
      supabase.from('fields').select('*').eq('complex_id', id).order('field_name'),
      supabase.from('complex_ratings_summary').select('*').eq('complex_id', id).maybeSingle(),
    ]).then(([{ data: c }, { data: f }, { data: s }]) => {
      setComplex(c)
      setFields(f ?? [])
      setSummary(s ?? null)
      setLoading(false)
    })

  useEffect(() => { loadData() }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>
  if (!complex) return <div className="text-center py-16 text-gray-400">Complex not found.</div>

  const sportLabel: Record<string, string> = {
    softball: 'Softball', baseball: 'Baseball', both: 'Softball & Baseball',
  }

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
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            {sportLabel[complex.sport_type]}
          </span>
        </div>
        {complex.website && (
          <a href={complex.website} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Visit website →
          </a>
        )}
      </div>

      {/* Admin-confirmed amenities */}
      <Section title="Amenities" subtitle="Confirmed">
        <div className="grid grid-cols-2 gap-1">
          <AmenityRow label="Concessions on-site"     value={complex.concessions_onsite} />
          <AmenityRow label="Tents allowed"           value={complex.tents_allowed} />
          <AmenityRow label="Pets allowed"            value={complex.pets_allowed} />
          <AmenityRow label="Free admission"          value={complex.free_admission} />
          <AmenityRow label="Ample parking"           value={complex.ample_parking} />
          <AmenityRow label="Protected from fly balls" value={complex.covered_from_fly_balls} />
        </div>
        {complex.water_access && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-700">
            <span>💧</span>
            <span className="font-medium">Water:</span>
            <span>{
              complex.water_access === 'purchase_only'      ? 'Purchase only — bring your own'
              : complex.water_access === 'fountains_marginal' ? 'Drinking fountains (marginal)'
              : complex.water_access === 'fountains_good'     ? 'Drinking fountains (good)'
              : 'Bottle filler stations'
            }</span>
          </div>
        )}
      </Section>

      {/* Crowd-sourced ratings */}
      {summary && summary.review_count > 0 ? (
        <Section title="From Parents" subtitle={`${summary.review_count} visit report${summary.review_count !== 1 ? 's' : ''}`}>
          <CrowdRatings summary={summary} />
        </Section>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-sm text-gray-500 text-center">
          No visit reports yet — be the first to submit one below.
        </div>
      )}

      {/* Admin ratings (if set) */}
      {(complex.bathroom_cleanliness || complex.concessions_quality || complex.concessions_value) && (
        <Section title="Bathrooms" subtitle="Admin data">
          {complex.bathroom_cleanliness && <RatingBar label="Cleanliness" value={complex.bathroom_cleanliness} />}
          <div className="grid grid-cols-2 gap-1 mt-1">
            <AmenityRow label="Diaper changing tables" value={complex.diaper_changing_tables} />
            <AmenityRow label="Soap stocked"           value={complex.soap_stocked} />
            <AmenityRow label="Paper towels stocked"   value={complex.paper_towels_stocked} />
          </div>
        </Section>
      )}

      {/* Seating */}
      {(complex.shade_amount || complex.walkways_congestion || complex.bleachers_cleanliness || complex.cement_pad_for_chairs !== null) && (
        <Section title="Seating &amp; Walkways" subtitle="Admin data">
          <div className="grid grid-cols-2 gap-1 mb-2">
            <AmenityRow label="Hard surface for chairs" value={complex.cement_pad_for_chairs} />
          </div>
          {complex.bleachers_cleanliness && <RatingBar label="Bleacher cleanliness" value={complex.bleachers_cleanliness} />}
          {complex.shade_amount && (
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Shade</span>
              <span className="font-medium capitalize">{complex.shade_amount}</span>
            </div>
          )}
          {complex.walkways_congestion && (
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-600">Walkway congestion</span>
              <span className={`font-medium capitalize ${
                complex.walkways_congestion === 'tight' ? 'text-red-600'
                : complex.walkways_congestion === 'open' ? 'text-green-600'
                : 'text-amber-600'
              }`}>{complex.walkways_congestion}</span>
            </div>
          )}
        </Section>
      )}

      {/* Fields */}
      {fields.length > 0 && (
        <Section title={`Fields (${fields.length})`}>
          <FieldsList fields={fields} />
        </Section>
      )}

      {/* Submit a report */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Been here recently?</h3>
        <p className="text-sm text-gray-600 mb-3">Help other parents know what to pack.</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Never mind' : 'Submit a visit report'}
        </button>
        {showForm && (
          <RatingForm complexId={complex.id} onSubmit={() => {
            setShowForm(false)
            setLoading(true)
            loadData()
          }} />
        )}
      </div>

      {complex.field_notes && (
        <div className="text-xs text-gray-400 leading-relaxed">{complex.field_notes}</div>
      )}
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
