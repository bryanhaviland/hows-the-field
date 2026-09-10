'use client'

import type { SportType } from '@/lib/supabase'
import SportIcon, { sportLabel } from './SportIcon'

/** The four field types a user can pick between — "both" is a complex-level combo, not a selectable preference. */
export const SELECTABLE_SPORTS: Exclude<SportType, 'both'>[] = ['softball', 'baseball', 'soccer', 'flag_football']

interface Props {
  selected: string[]
  onToggle: (sport: string) => void
  size?: number
}

/**
 * Row of tappable sport-icon chips. Used both as the search page's sport
 * filter and as the "which fields do you want to see" preference picker in
 * the profile menu, so both stay visually identical. Selecting none means
 * "show everything" in both places.
 */
export default function SportTypeMultiSelect({ selected, onToggle, size = 22 }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {SELECTABLE_SPORTS.map(sport => {
        const active = selected.includes(sport)
        return (
          <button
            key={sport}
            type="button"
            onClick={() => onToggle(sport)}
            title={sportLabel[sport]}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors ${
              active ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <SportIcon sport={sport} size={size} />
            <span className={`text-xs font-medium ${active ? 'text-blue-700' : 'text-gray-500'}`}>{sportLabel[sport]}</span>
          </button>
        )
      })}
    </div>
  )
}
