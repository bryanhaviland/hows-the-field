import Link from 'next/link'
import { ReviewWithReviewer } from '@/lib/supabase'
import ReviewerBadge from '@/components/ReviewerBadge'

interface ComplexInfo {
  name: string
  city: string
  state: string
}

interface Props {
  reviews: ReviewWithReviewer[]
  /** id -> complex info. Pass this to show which complex each review belongs to (reviewer profile pages). */
  complexes?: Record<string, ComplexInfo>
  emptyMessage?: string
}

function StarLine({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  return (
    <span className="text-xs text-gray-500">
      {label}: {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  )
}

export default function ReviewsList({ reviews, complexes, emptyMessage = 'No reports yet.' }: Props) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">{emptyMessage}</p>
  }

  return (
    <div className="divide-y divide-gray-100">
      {reviews.map(r => {
        const complex = complexes?.[r.complex_id]
        return (
          <div key={r.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {r.reviewer_display_name ? (
                <Link href={`/reviewers/${r.user_id}`} className="text-sm font-semibold text-gray-800 hover:text-green-700">
                  {r.reviewer_display_name}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-gray-400">Anonymous</span>
              )}
              <ReviewerBadge badge={r.reviewer_badge} />
              {r.field_name && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📍 {r.field_name}</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(r.visit_date ?? r.submitted_at).toLocaleDateString()}
              </span>
            </div>

            {complex && (
              <Link href={`/complex/${r.complex_id}`} className="text-xs text-blue-600 hover:underline">
                {complex.name} — {complex.city}, {complex.state}
              </Link>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              <StarLine label="Bathrooms" value={r.bathroom_cleanliness} />
              <StarLine label="Concessions" value={r.concessions_quality} />
              <StarLine label="Bleachers" value={r.bleachers_cleanliness} />
            </div>

            {r.reviewer_note && (
              <p className="text-sm text-gray-600 mt-1.5 italic">&ldquo;{r.reviewer_note}&rdquo;</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
