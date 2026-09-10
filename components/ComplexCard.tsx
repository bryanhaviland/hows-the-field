import Link from 'next/link'
import { FieldComplex, RatingsSummary } from '@/lib/supabase'
import SportIcon from './SportIcon'

function Pip({ pct, label }: { pct: number | null; label: string }) {
  if (pct === null) return null
  const value = pct >= 50
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {value ? '✓' : '✗'} {label}
    </span>
  )
}

function RatingDots({ value }: { value: number | null }) {
  if (!value) return null
  const rounded = Math.round(value)
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= rounded ? 'bg-amber-400' : 'bg-gray-200'}`} />
      ))}
    </span>
  )
}

const waterLabel: Record<string, string> = {
  purchase_only: 'Purchase only',
  fountains_marginal: 'Fountains (marginal)',
  fountains_good: 'Fountains (good)',
  bottle_filler: 'Bottle filler',
}

const shadeLabel: Record<string, string> = {
  none: 'None',
  minimal: 'Minimal',
  moderate: 'Moderate',
  ample: 'Ample',
}

/**
 * All amenity/rating info on this card is crowdsourced (complex_ratings_summary,
 * built from parent visit reports) — never admin-set. A complex nobody's
 * reported on yet just shows name/sport/city with no amenity pips, which is
 * correct: nobody picks which field they play at, so unreported amenities
 * shouldn't silently read as "no".
 */
export default function ComplexCard({ complex: c, summary: s }: { complex: FieldComplex; summary: RatingsSummary | null }) {
  const hasRatings = !!(s?.avg_bathroom_cleanliness || s?.avg_concessions_quality)

  return (
    <Link href={`/complex?id=${c.id}`} className="block bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h2 className="font-semibold text-gray-900 leading-tight">{c.name}</h2>
          <p className="text-sm text-gray-500">{c.city}, {c.state} {c.num_fields ? `· ${c.num_fields} fields` : ''}</p>
        </div>
        <SportIcon sport={c.sport_type} size={26} />
      </div>

      {/* Key amenity pips — crowdsourced */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Pip pct={s?.pct_concessions_onsite ?? null} label="Concessions" />
        <Pip pct={s?.pct_tents_allowed ?? null} label="Tents" />
        <Pip pct={s?.pct_pets_allowed ?? null} label="Pets" />
        <Pip pct={s?.pct_ample_parking ?? null} label="Parking" />
        <Pip pct={s?.pct_free_admission ?? null} label="Free Admission" />
        <Pip pct={s?.pct_fly_ball_cover ?? null} label="Fly Ball Cover" />
      </div>

      {/* Water & shade — most-reported, crowdsourced */}
      {(s?.mode_water_access || s?.mode_shade_amount) && (
        <div className="flex flex-wrap gap-3 text-xs text-blue-600 mb-2">
          {s?.mode_water_access && <span>💧 {waterLabel[s.mode_water_access]}</span>}
          {s?.mode_shade_amount && <span className="text-amber-600">☀️ {shadeLabel[s.mode_shade_amount]} shade</span>}
        </div>
      )}

      {/* Ratings row — crowdsourced averages */}
      {hasRatings && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
          {s?.avg_bathroom_cleanliness && (
            <span className="flex items-center gap-1">🚻 <RatingDots value={s.avg_bathroom_cleanliness} /></span>
          )}
          {s?.avg_concessions_quality && (
            <span className="flex items-center gap-1">🌭 <RatingDots value={s.avg_concessions_quality} /></span>
          )}
        </div>
      )}

      {s && s.review_count > 0 ? (
        <p className="text-xs text-gray-400 mt-2">{s.review_count} visit report{s.review_count !== 1 ? 's' : ''}</p>
      ) : (
        <p className="text-xs text-gray-300 mt-2">No visit reports yet</p>
      )}
    </Link>
  )
}
