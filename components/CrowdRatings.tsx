import { RatingsSummary } from '@/lib/supabase'

interface Props {
  summary: RatingsSummary
}

function AvgBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  const pct = (value / 5) * 100
  return (
    <div className="py-1.5 border-b border-gray-100">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{value} / 5</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PctRow({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) return null
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
        {pct}% say yes
      </span>
    </div>
  )
}

const waterLabel: Record<string, string> = {
  purchase_only: 'Purchase only',
  fountains_marginal: 'Fountains (marginal)',
  fountains_good: 'Fountains (good)',
  bottle_filler: 'Bottle filler',
}

export default function CrowdRatings({ summary: s }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {s.review_count} visit report{s.review_count !== 1 ? 's' : ''}
        </span>
        {s.last_reviewed_at && (
          <span className="text-xs text-gray-400">
            Last: {new Date(s.last_reviewed_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Averages */}
      {(s.avg_bathroom_cleanliness || s.avg_concessions_quality || s.avg_concessions_value || s.avg_bleachers_cleanliness) && (
        <div className="mb-3">
          <AvgBar label="Bathroom cleanliness" value={s.avg_bathroom_cleanliness} />
          <AvgBar label="Concessions quality"  value={s.avg_concessions_quality} />
          <AvgBar label="Concessions value"    value={s.avg_concessions_value} />
          <AvgBar label="Bleacher cleanliness" value={s.avg_bleachers_cleanliness} />
        </div>
      )}

      {/* Boolean percentages */}
      <PctRow label="Diaper changing tables" pct={s.pct_diaper_tables} />
      <PctRow label="Soap stocked"           pct={s.pct_soap_stocked} />
      <PctRow label="Paper towels stocked"   pct={s.pct_paper_towels} />
      <PctRow label="Hard surface for chairs" pct={s.pct_cement_pad} />
      <PctRow label="Protected from fly balls" pct={s.pct_fly_ball_cover} />
      <PctRow label="Tents / canopies allowed" pct={s.pct_tents_allowed} />
      <PctRow label="Pets allowed"            pct={s.pct_pets_allowed} />

      {/* Categoricals */}
      {s.mode_water_access && (
        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
          <span className="text-gray-600">💧 Water (most reported)</span>
          <span className="font-medium text-blue-700">{waterLabel[s.mode_water_access]}</span>
        </div>
      )}
      {s.mode_shade_amount && (
        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
          <span className="text-gray-600">☀️ Shade (most reported)</span>
          <span className="font-medium capitalize">{s.mode_shade_amount}</span>
        </div>
      )}
      {s.mode_walkways_congestion && (
        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
          <span className="text-gray-600">🚶 Walkways (most reported)</span>
          <span className={`font-medium capitalize ${
            s.mode_walkways_congestion === 'tight' ? 'text-red-600'
            : s.mode_walkways_congestion === 'open' ? 'text-green-600'
            : 'text-amber-600'
          }`}>{s.mode_walkways_congestion}</span>
        </div>
      )}
    </div>
  )
}
