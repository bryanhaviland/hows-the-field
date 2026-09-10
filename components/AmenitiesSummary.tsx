import { RatingsSummary } from '@/lib/supabase'

interface Props {
  summary: RatingsSummary | null
}

function AmenityPct({ label, pct }: { label: string; pct: number | null }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      {pct === null ? (
        <span className="text-gray-300 text-xs">Not yet reported</span>
      ) : (
        <span className={`font-medium ${pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
          {pct}% say yes
        </span>
      )}
    </div>
  )
}

/**
 * The 6 core amenity questions, always shown on the complex's main screen —
 * crowdsourced from visit reports (see reviews.concessions_onsite /
 * free_admission / ample_parking / tents_allowed / pets_allowed /
 * covered_from_fly_balls and the complex_ratings_summary view), never
 * admin-curated. Everything else parents report lives behind "see full
 * crowd-sourced report" so this block stays short.
 */
export default function AmenitiesSummary({ summary: s }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
      <AmenityPct label="Concessions On-Site" pct={s?.pct_concessions_onsite ?? null} />
      <AmenityPct label="Tents Allowed" pct={s?.pct_tents_allowed ?? null} />
      <AmenityPct label="Pets Allowed" pct={s?.pct_pets_allowed ?? null} />
      <AmenityPct label="Free Admission" pct={s?.pct_free_admission ?? null} />
      <AmenityPct label="Ample Parking" pct={s?.pct_ample_parking ?? null} />
      <AmenityPct label="Protected From Fly Balls" pct={s?.pct_fly_ball_cover ?? null} />
    </div>
  )
}
