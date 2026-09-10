import { timeAgo } from '@/lib/time'

const COLOR_CLASSES: Record<string, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gray: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function ConditionPill({
  icon,
  label,
  value,
  color,
  at,
}: {
  icon: string
  label: string
  value: string
  color: keyof typeof COLOR_CLASSES
  /** ISO timestamp of the report this came from — shown as "12m ago". Omit for a static/no-data pill. */
  at?: string | null
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${COLOR_CLASSES[color]}`}>
      <span className="text-base leading-none">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide opacity-70">{label}</div>
        <div className="text-sm font-semibold leading-tight truncate">{value}</div>
      </div>
      {at && <span className="ml-auto text-[11px] opacity-60 whitespace-nowrap">{timeAgo(at)}</span>}
    </div>
  )
}
