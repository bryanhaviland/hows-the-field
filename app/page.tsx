'use client'

import { useEffect, useState } from 'react'
import { supabase, FieldComplex } from '@/lib/supabase'
import ComplexCard from '@/components/ComplexCard'
import SearchFilters from '@/components/SearchFilters'

export interface Filters {
  sport: string
  city: string
  concessions: boolean
  tents: boolean
  pets: boolean
  freeAdmission: boolean
  parking: boolean
  flyBallCover: boolean
}

const defaultFilters: Filters = {
  sport: 'all',
  city: 'all',
  concessions: false,
  tents: false,
  pets: false,
  freeAdmission: false,
  parking: false,
  flyBallCover: false,
}

export default function HomePage() {
  const [complexes, setComplexes] = useState<FieldComplex[]>([])
  const [filtered, setFiltered] = useState<FieldComplex[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('field_complexes')
      .select('*')
      .order('city')
      .then(({ data }) => {
        setComplexes(data ?? [])
        setFiltered(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let results = [...complexes]
    if (filters.sport !== 'all') results = results.filter(c => c.sport_type === filters.sport || c.sport_type === 'both')
    if (filters.city !== 'all') results = results.filter(c => c.city === filters.city)
    if (filters.concessions) results = results.filter(c => c.concessions_onsite === true)
    if (filters.tents) results = results.filter(c => c.tents_allowed === true)
    if (filters.pets) results = results.filter(c => c.pets_allowed === true)
    if (filters.freeAdmission) results = results.filter(c => c.free_admission === true)
    if (filters.parking) results = results.filter(c => c.ample_parking === true)
    if (filters.flyBallCover) results = results.filter(c => c.covered_from_fly_balls === true)
    setFiltered(results)
  }, [filters, complexes])

  const cities = Array.from(new Set(complexes.map(c => c.city))).sort()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a Complex</h1>
        <p className="text-gray-500 mt-1 text-sm">Know before you load the car.</p>
      </div>

      <SearchFilters filters={filters} onChange={setFilters} cities={cities} />

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading complexes…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No complexes match your filters.</div>
      ) : (
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          {filtered.map(c => <ComplexCard key={c.id} complex={c} />)}
        </div>
      )}
    </div>
  )
}
