import Link from 'next/link'
import { FieldComplex } from '@/lib/supabase'

const sportBadge: Record<string, string> = {
  softball: 'bg-purple-100 text-purple-700',
  baseball: 'bg-blue-100 text-blue-700',
  both: 'bg-green-100 text-green-700',
}

const sportLabel: Record<string, string> = {
  softball: 'Softball',
  baseball: 'Baseball',
  both: 'Softball & Baseball',
}

function Pip({ value, label }: { value: boolean | null; label: string }) {
  if (value === null) return null
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {value ? '✓' : '✗'} {label}
    </span>
  )
}

function RatingDots({ value }: { value: number | null }) {
  if (!value) return null
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= value ? 'bg-amber-400' : 'bg-gray-200'}`} />
      ))}
    </span>
  )
}

export default function ComplexCard({ complex: c }: { complex: FieldComplex }) {
  const hasRatings = c.bathroom_cleanliness || c.concessions_quality

  return (
    <Link href={`/complex/${c.id}`} className="block bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-md transition-all p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h2 className="font-semibold text-gray-900 leading-tight">{c.name}</h2>
          <p className="text-sm text-gray-500">{c.city}, {c.state} {c.num_fields ? `· ${c.num_fields} fields` : ''}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${sportBadge[c.sport_type]}`}>
          {sportLabel[c.sport_type]}
        </span>
      </div>

      {/* Key amenity pips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Pip value={c.concessions_onsite} label="Concessions" />
        <Pip value={c.tents_allowed} label="Tents" />
        <Pip value={c.pets_allowed} label="Pets" />
        <Pip value={c.ample_parking} label="Parking" />
        <Pip value={c.free_admission} label="Free Admission" />
        <Pip value={c.covered_from_fly_balls} label="Fly Ball Cover" />
      </div>

      {/* Ratings row */}
      {hasRatings && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
          {c.bathroom_cleanliness && (
            <span className="flex items-center gap-1">🚻 <RatingDots value={c.bathroom_cleanliness} /></span>
          )}
          {c.concessions_quality && (
            <span className="flex items-center gap-1">🌭 <RatingDots value={c.concessions_quality} /></span>
          )}
        </div>
      )}

      {/* Water access badge */}
      {c.water_access && (
        <div className="mt-2 text-xs text-blue-600">
          💧 {c.water_access === 'purchase_only' ? 'Purchase only'
            : c.water_access === 'fountains_marginal' ? 'Fountains (marginal)'
            : c.water_access === 'fountains_good' ? 'Fountains (good)'
            : 'Bottle filler'}
        </div>
      )}
    </Link>
  )
}
