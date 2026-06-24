'use client'

import { Filters } from '@/app/page'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  cities: string[]
}

const toggleClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer select-none ${
    active
      ? 'bg-green-600 text-white border-green-600'
      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
  }`

export default function SearchFilters({ filters, onChange, cities }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const toggle = (key: keyof Filters) => set({ [key]: !filters[key] })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Sport + City */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sport</label>
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
            value={filters.sport}
            onChange={e => set({ sport: e.target.value })}
          >
            <option value="all">All sports</option>
            <option value="softball">Softball</option>
            <option value="baseball">Baseball</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City / Area</label>
          <select
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
            value={filters.city}
            onChange={e => set({ city: e.target.value })}
          >
            <option value="all">All cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Must-have toggles */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Must have</p>
        <div className="flex flex-wrap gap-2">
          <button className={toggleClass(filters.concessions)} onClick={() => toggle('concessions')}>🌭 Concessions</button>
          <button className={toggleClass(filters.tents)} onClick={() => toggle('tents')}>⛺ Tents OK</button>
          <button className={toggleClass(filters.pets)} onClick={() => toggle('pets')}>🐾 Pets OK</button>
          <button className={toggleClass(filters.freeAdmission)} onClick={() => toggle('freeAdmission')}>🆓 Free Admission</button>
          <button className={toggleClass(filters.parking)} onClick={() => toggle('parking')}>🅿️ Ample Parking</button>
          <button className={toggleClass(filters.flyBallCover)} onClick={() => toggle('flyBallCover')}>🪖 Fly Ball Cover</button>
        </div>
      </div>
    </div>
  )
}
