'use client'

import { useState } from 'react'
import { supabase, FieldConditionValue, ParkingStatus, GamesStatus, Field } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Props {
  complexId: string
  fields: Field[]
  onSubmit: () => void
  onCancel: () => void
}

function Pills<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T | null) => void
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? null : o.value)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            value === o.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function FieldConditionCheckinForm({ complexId, fields, onSubmit, onCancel }: Props) {
  const { user } = useAuth()
  const [fieldId, setFieldId] = useState<string | null>(null)
  const [fieldCondition, setFieldCondition] = useState<FieldConditionValue | null>(null)
  const [parking, setParking] = useState<ParkingStatus | null>(null)
  const [gamesStatus, setGamesStatus] = useState<GamesStatus | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAnyValue = fieldCondition || parking || gamesStatus

  const handleSubmit = async () => {
    if (!user || !hasAnyValue) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('field_condition_checkins').insert({
      complex_id: complexId,
      field_id: fieldId,
      user_id: user.id,
      field_condition: fieldCondition,
      parking,
      games_status: gamesStatus,
      note: note.trim() || null,
    })
    setSaving(false)
    if (error) {
      setError("Couldn't save that check-in — try again in a moment.")
      return
    }
    onSubmit()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {fields.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Which field?
          </label>
          <select
            value={fieldId ?? 'whole-complex'}
            onChange={e => setFieldId(e.target.value === 'whole-complex' ? null : e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white w-full"
          >
            <option value="whole-complex">Whole complex</option>
            {fields.map(f => <option key={f.id} value={f.id}>{f.field_name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Field condition
        </label>
        <Pills<FieldConditionValue>
          value={fieldCondition}
          onChange={setFieldCondition}
          options={[
            { value: 'dry', label: 'Dry' },
            { value: 'windy', label: 'Windy' },
            { value: 'muddy', label: 'Muddy' },
            { value: 'perfect', label: 'Perfect' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Parking
        </label>
        <Pills<ParkingStatus>
          value={parking}
          onChange={setParking}
          options={[
            { value: 'crowded', label: 'Crowded' },
            { value: 'lots_of_space', label: 'Lots Of Space' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Games are
        </label>
        <Pills<GamesStatus>
          value={gamesStatus}
          onChange={setGamesStatus}
          options={[
            { value: 'ahead_of_schedule', label: 'Ahead Of Schedule' },
            { value: 'on_time', label: 'Right On Time' },
            { value: 'running_behind', label: 'Running Behind' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Quick note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value.slice(0, 140))}
          maxLength={140}
          placeholder="e.g. Field 3 has standing water in the outfield"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !hasAnyValue}
          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? 'Saving…' : 'Post check-in'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600 px-3"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
