import type { SportType } from '@/lib/supabase'

/** Label + accessible name for each sport (kept alongside the icon as a tooltip/aria-label). */
export const sportLabel: Record<SportType, string> = {
  softball: 'Softball',
  baseball: 'Baseball',
  both: 'Softball & Baseball',
  soccer: 'Soccer',
  flag_football: 'Flag Football',
}

/** A sport that has its own ball icon (everything except the "both" combo). */
type SingleSport = Exclude<SportType, 'both'>

/** Chip background color per sport — same palette the old text pill used. */
const sportChipBg: Record<SingleSport, string> = {
  softball: 'bg-purple-100',
  baseball: 'bg-blue-100',
  soccer: 'bg-orange-100',
  flag_football: 'bg-amber-100',
}

/** "both" fans out into these two single-sport icons, shown side by side (never overlapped). */
const comboSports: SingleSport[] = ['baseball', 'softball']

function BaseballBall({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <path d="M6.5 4.5c2 2.3 2 12.7 0 15" fill="none" stroke="#DC2626" strokeWidth="1.1" />
      <path d="M17.5 4.5c-2 2.3-2 12.7 0 15" fill="none" stroke="#DC2626" strokeWidth="1.1" />
      <path d="M6 6.3l.9-.5M6.9 8.8l.9-.5M7.4 11.4l.95-.35M7.4 14l.95.3M6.9 16.5l.9.5M6 18.7l.9.5" stroke="#DC2626" strokeWidth="0.6" />
      <path d="M18 6.3l-.9-.5M17.1 8.8l-.9-.5M16.6 11.4l-.95-.35M16.6 14l-.95.3M17.1 16.5l-.9.5M18 18.7l-.9.5" stroke="#DC2626" strokeWidth="0.6" />
    </svg>
  )
}

function SoftballBall({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#E1F97A" stroke="#A3C400" strokeWidth="1" />
      <path d="M6.5 4.5c2 2.3 2 12.7 0 15" fill="none" stroke="#DC2626" strokeWidth="1.1" />
      <path d="M17.5 4.5c-2 2.3-2 12.7 0 15" fill="none" stroke="#DC2626" strokeWidth="1.1" />
      <path d="M6 6.3l.9-.5M6.9 8.8l.9-.5M7.4 11.4l.95-.35M7.4 14l.95.3M6.9 16.5l.9.5M6 18.7l.9.5" stroke="#DC2626" strokeWidth="0.6" />
      <path d="M18 6.3l-.9-.5M17.1 8.8l-.9-.5M16.6 11.4l-.95-.35M16.6 14l-.95.3M17.1 16.5l-.9.5M18 18.7l-.9.5" stroke="#DC2626" strokeWidth="0.6" />
    </svg>
  )
}

function SoccerBall({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" stroke="#111827" strokeWidth="1" />
      <polygon points="12,7.3 15.1,9.6 14,13.2 10,13.2 8.9,9.6" fill="#111827" />
      <path
        d="M12,7.3 L11.3,3.2 M15.1,9.6 L18.9,8.1 M14,13.2 L16.3,16.7 M10,13.2 L7.7,16.7 M8.9,9.6 L5.1,8.1"
        stroke="#111827"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

function FootballBall({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g transform="rotate(-35 12 12)">
        <ellipse cx="12" cy="12" rx="9.5" ry="5.8" fill="#92653C" stroke="#5C3A1E" strokeWidth="1" />
        <line x1="6.2" y1="12" x2="17.8" y2="12" stroke="#F5EBDD" strokeWidth="1" />
        <line x1="9.5" y1="10.5" x2="9.5" y2="13.5" stroke="#F5EBDD" strokeWidth="0.9" />
        <line x1="11.2" y1="10.5" x2="11.2" y2="13.5" stroke="#F5EBDD" strokeWidth="0.9" />
        <line x1="12.8" y1="10.5" x2="12.8" y2="13.5" stroke="#F5EBDD" strokeWidth="0.9" />
        <line x1="14.5" y1="10.5" x2="14.5" y2="13.5" stroke="#F5EBDD" strokeWidth="0.9" />
      </g>
    </svg>
  )
}

const ballBySport: Record<SingleSport, (props: { size: number }) => React.ReactElement> = {
  baseball: BaseballBall,
  softball: SoftballBall,
  soccer: SoccerBall,
  flag_football: FootballBall,
}

/** One sport's ball icon inside its own colored chip. */
function SingleSportChip({ sport, size, className = '' }: { sport: SingleSport; size: number; className?: string }) {
  const Ball = ballBySport[sport]
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center rounded-full p-1.5 ${sportChipBg[sport]} ${className}`}
      title={sportLabel[sport]}
      aria-label={sportLabel[sport]}
    >
      <Ball size={size} />
    </span>
  )
}

/**
 * Icon of the ball used to play the complex's sport (replaces the old text pill).
 * Complexes that host multiple sports ("both") get one chip per sport, laid out
 * side by side with a gap — never overlapped into a single combined icon.
 */
export default function SportIcon({
  sport,
  size = 18,
  className = '',
}: {
  sport: SportType
  size?: number
  className?: string
}) {
  if (sport === 'both') {
    return (
      <span className={`shrink-0 inline-flex items-center gap-1 ${className}`}>
        {comboSports.map(s => (
          <SingleSportChip key={s} sport={s} size={size} />
        ))}
      </span>
    )
  }

  return <SingleSportChip sport={sport} size={size} className={className} />
}
