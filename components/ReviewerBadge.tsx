import { ReviewerBadgeType } from '@/lib/supabase'

const config: Record<ReviewerBadgeType, { label: string; icon: string; className: string }> = {
  trusted_contributor: { label: 'Trusted Contributor', icon: '🛡️', className: 'bg-blue-100 text-blue-700' },
  rising_star: { label: 'Rising Star', icon: '⭐', className: 'bg-amber-100 text-amber-700' },
}

export default function ReviewerBadge({ badge }: { badge: ReviewerBadgeType | null | undefined }) {
  if (!badge) return null
  const c = config[badge]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${c.className}`}>
      {c.icon} {c.label}
    </span>
  )
}
