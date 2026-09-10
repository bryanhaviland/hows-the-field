'use client'

import { Filters } from '@/app/page'
import SportTypeMultiSelect from './SportTypeMultiSelect'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  cities: string[]
  states: string[]
}

export default function SearchFilters({ filters, onChange, cities, states }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const toggleSport = (sport: string) =>
    set({ sport: filters.sport.includes(sport) ? filters.sport.filter(s => s !== sport) : [...filters.sport, sport] })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Search</label>
        <input
          type="text"
          placeholder="Search parks by name…"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
        />
      </div>

      {/* Sport + State + City */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sport</label>
          <SportTypeMultiSelect selected={filters.sport} onToggle={toggleSport} size={18} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State</label>
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
            value={filters.state}
            onChange={e => set({ state: e.target.value, city: 'all' })}
          >
            <option value="all">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City / Area</label>
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
            value={filters.city}
            onChange={e => set({ city: e.target.value })}
          >
            <option value="all">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
