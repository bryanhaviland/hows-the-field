'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  supabase,
  FieldComplex,
  Field,
  ComplexConditionsCurrent,
  FieldConditionCheckinWithReporter,
  FieldConditionValue,
  ParkingStatus,
  GamesStatus,
} from '@/lib/supabase'
import PremiumGate from '@/components/PremiumGate'
import ConditionPill from '@/components/ConditionPill'
import LightningMonitor from '@/components/LightningMonitor'
import RainForecastStrip from '@/components/RainForecastStrip'
import FieldConditionCheckinForm from '@/components/FieldConditionCheckinForm'
import { timeAgo } from '@/lib/time'

const FIELD_CONDITION_META: Record<FieldConditionValue, { label: string; color: 'green' | 'amber' | 'red' }> = {
  perfect: { label: 'Perfect', color: 'green' },
  dry: { label: 'Dry', color: 'amber' },
  windy: { label: 'Windy', color: 'amber' },
  muddy: { label: 'Muddy', color: 'red' },
}

const PARKING_META: Record<ParkingStatus, { label: string; color: 'green' | 'amber' | 'red' }> = {
  lots_of_space: { label: 'Lots Of Space', color: 'green' },
  crowded: { label: 'Crowded', color: 'red' },
}

const GAMES_META: Record<GamesStatus, { label: string; color: 'green' | 'amber' | 'red' }> = {
  ahead_of_schedule: { label: 'Ahead Of Schedule', color: 'green' },
  on_time: { label: 'Right On Time', color: 'green' },
  running_behind: { label: 'Running Behind', color: 'red' },
}

export default function FieldConditionsPanel({ complex, fields }: { complex: FieldComplex; fields: Field[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="font-semibold text-gray-800">Today at the Field</h2>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Premium</span>
      </div>
      <PremiumGate>
        <PanelContent complex={complex} fields={fields} />
      </PremiumGate>
    </div>
  )
}

function PanelContent({ complex, fields }: { complex: FieldComplex; fields: Field[] }) {
  const [current, setCurrent] = useState<ComplexConditionsCurrent | null>(null)
  const [recent, setRecent] = useState<FieldConditionCheckinWithReporter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    return Promise.all([
      supabase.from('complex_conditions_current').select('*').eq('complex_id', complex.id).maybeSingle(),
      supabase
        .from('field_condition_checkins_with_reporter')
        .select('*')
        .eq('complex_id', complex.id)
        .order('submitted_at', { ascending: false })
        .limit(5),
    ]).then(([{ data: c }, { data: r }]) => {
      setCurrent((c as ComplexConditionsCurrent) ?? null)
      setRecent((r as FieldConditionCheckinWithReporter[]) ?? [])
      setLoading(false)
    })
  }, [complex.id])

  useEffect(() => { load() }, [load])

  const hasAnyCurrent = current && (current.field_condition || current.parking || current.games_status)

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="h-16 animate-pulse bg-gray-50 rounded-lg" />
      ) : hasAnyCurrent ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {current!.field_condition && (
            <ConditionPill
              icon="🏟️" label="Field" at={current!.field_condition_at}
              value={FIELD_CONDITION_META[current!.field_condition].label}
              color={FIELD_CONDITION_META[current!.field_condition].color}
            />
          )}
          {current!.parking && (
            <ConditionPill
              icon="🚗" label="Parking" at={current!.parking_at}
              value={PARKING_META[current!.parking].label}
              color={PARKING_META[current!.parking].color}
            />
          )}
          {current!.games_status && (
            <ConditionPill
              icon="⏱️" label="Games" at={current!.games_status_at}
              value={GAMES_META[current!.games_status].label}
              color={GAMES_META[current!.games_status].color}
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No check-ins yet today — be the first to report in.</p>
      )}

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <RainForecastStrip complexId={complex.id} />
        <LightningMonitor complexId={complex.id} />
      </div>

      {recent.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent check-ins</p>
          <div className="space-y-1.5">
            {recent.map(r => (
              <div key={r.id} className="text-xs text-gray-500 flex flex-wrap gap-x-1">
                <span className="font-medium text-gray-700">{r.reporter_display_name ?? 'A parent'}</span>
                {r.field_name && <span>· {r.field_name}</span>}
                {r.note && <span className="italic">&ldquo;{r.note}&rdquo;</span>}
                <span className="ml-auto">{timeAgo(r.submitted_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-3">
        {showForm ? (
          <FieldConditionCheckinForm
            complexId={complex.id}
            fields={fields}
            onCancel={() => setShowForm(false)}
            onSubmit={() => {
              setShowForm(false)
              setLoading(true)
              load()
            }}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            Check in at this field
          </button>
        )}
      </div>
    </div>
  )
}
