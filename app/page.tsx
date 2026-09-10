'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase, FieldComplex, RatingsSummary } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ComplexCard from '@/components/ComplexCard'
import SearchFilters from '@/components/SearchFilters'

export interface Filters {
  search: string
  /** Selected sport types (SportType values, minus 'both'). Empty = all sports. */
  sport: string[]
  city: string
  state: string
}

const defaultFilters: Filters = {
  search: '',
  sport: [],
  city: 'all',
  state: 'all',
}

export default function HomePage() {
  const { profile } = useAuth()
  const [complexes, setComplexes] = useState<FieldComplex[]>([])
  const [summaries, setSummaries] = useState<Record<string, RatingsSummary>>({})
  const [filtered, setFiltered] = useState<FieldComplex[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const appliedPreference = useRef(false)

  useEffect(() => {
    Promise.all([
      supabase.from('field_complexes').select('*').order('city'),
      // Every amenity/rating shown in search is crowdsourced — nobody picks
      // which field they play at, so admin-set columns never belong here.
      supabase.from('complex_ratings_summary').select('*'),
    ]).then(([{ data: complexData }, { data: summaryData }]) => {
      setComplexes(complexData ?? [])
      setFiltered(complexData ?? [])
      const map: Record<string, RatingsSummary> = {}
      for (const s of summaryData ?? []) map[s.complex_id] = s
      setSummaries(map)
      setLoading(false)
    })
  }, [])

  // Default the sport filter to the user's saved field-type preference (profile
  // menu → "Which fields do you want to see?"), once, the first time it loads —
  // never overriding a filter the user has already changed this session.
  useEffect(() => {
    if (appliedPreference.current) return
    if (profile && profile.preferred_sports.length > 0) {
      appliedPreference.current = true
      setFilters(f => ({ ...f, sport: profile.preferred_sports }))
    }
  }, [profile])

  useEffect(() => {
    let results = [...complexes]
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      results = results.filter(c => c.name.toLowerCase().includes(q))
    }
    if (filters.sport.length > 0) {
      results = results.filter(c => c.sport_type === 'both' || filters.sport.includes(c.sport_type))
    }
    if (filters.state !== 'all') results = results.filter(c => c.state === filters.state)
    if (filters.city !== 'all') results = results.filter(c => c.city === filters.city)
    setFiltered(results)
  }, [filters, complexes])

  const states = Array.from(new Set(complexes.map(c => c.state))).sort()
  const cities = Array.from(
    new Set(
      complexes
        .filter(c => filters.state === 'all' || c.state === filters.state)
        .map(c => c.city)
    )
  ).sort()

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Complex</h1>
          <p className="text-gray-500 mt-1 text-sm">Know before you load the car.</p>
        </div>
        <Link
          href="/submit-complex"
          className="shrink-0 text-sm text-blue-600 hover:underline whitespace-nowrap mt-1"
        >
          + Add a complex
        </Link>
      </div>

      <SearchFilters filters={filters} onChange={setFilters} cities={cities} states={states} />

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading complexes…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No complexes match your filters.</div>
      ) : (
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          {filtered.map(c => <ComplexCard key={c.id} complex={c} summary={summaries[c.id] ?? null} />)}
        </div>
      )}
    </div>
  )
}
