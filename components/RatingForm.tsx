'use client'

import { useState } from 'react'
import { supabase, ShadeAmount, WalkwaysCongestion, WaterAccess } from '@/lib/supabase'

interface Props {
  complexId: string
  onSubmit: () => void
}

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => onChange(i)}
            className={`text-xl transition-colors ${i <= value ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`}>
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

function BoolPicker({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-2">
        {([true, false] as const).map(v => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              value === v
                ? v ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}>
            {v ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  )
}

function SelectPicker<T extends string>({
  label, value, onChange, options
}: {
  label: string
  value: T | null
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1 flex-wrap justify-end">
        {options.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              value === o.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const defaultForm = {
  visit_date: '',
  bathroom_cleanliness: 0,
  diaper_changing_tables: null as boolean | null,
  soap_stocked: null as boolean | null,
  paper_towels_stocked: null as boolean | null,
  concessions_quality: 0,
  concessions_value: 0,
  bleachers_cleanliness: 0,
  cement_pad_for_chairs: null as boolean | null,
  shade_amount: null as ShadeAmount | null,
  walkways_congestion: null as WalkwaysCongestion | null,
  covered_from_fly_balls: null as boolean | null,
  tents_allowed: null as boolean | null,
  pets_allowed: null as boolean | null,
  water_access: null as WaterAccess | null,
  reviewer_note: '',
}

export default function RatingForm({ complexId, onSubmit }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const set = (patch: Partial<typeof defaultForm>) => setForm(f => ({ ...f, ...patch }))

  const handleSubmit = async () => {
    setSaving(true)

    // Build the insert — only include fields the user actually touched
    const row: Record<string, unknown> = { complex_id: complexId }

    if (form.visit_date)              row.visit_date              = form.visit_date
    if (form.bathroom_cleanliness > 0) row.bathroom_cleanliness   = form.bathroom_cleanliness
    if (form.concessions_quality > 0)  row.concessions_quality    = form.concessions_quality
    if (form.concessions_value > 0)    row.concessions_value      = form.concessions_value
    if (form.bleachers_cleanliness > 0) row.bleachers_cleanliness = form.bleachers_cleanliness
    if (form.diaper_changing_tables !== null) row.diaper_changing_tables = form.diaper_changing_tables
    if (form.soap_stocked !== null)    row.soap_stocked            = form.soap_stocked
    if (form.paper_towels_stocked !== null) row.paper_towels_stocked = form.paper_towels_stocked
    if (form.cement_pad_for_chairs !== null) row.cement_pad_for_chairs = form.cement_pad_for_chairs
    if (form.covered_from_fly_balls !== null) row.covered_from_fly_balls = form.covered_from_fly_balls
    if (form.tents_allowed !== null)   row.tents_allowed           = form.tents_allowed
    if (form.pets_allowed !== null)    row.pets_allowed            = form.pets_allowed
    if (form.shade_amount)             row.shade_amount            = form.shade_amount
    if (form.walkways_congestion)      row.walkways_congestion     = form.walkways_congestion
    if (form.water_access)             row.water_access            = form.water_access
    if (form.reviewer_note.trim())     row.reviewer_note           = form.reviewer_note.trim()

    await supabase.from('reviews').insert(row)
    setSaving(false)
    setDone(true)
    setTimeout(onSubmit, 1800)
  }

  if (done) return (
    <p className="mt-4 text-green-700 text-sm font-medium">
      ✓ Thanks! Your visit report helps other parents know what to pack.
    </p>
  )

  return (
    <div className="mt-4 space-y-1">
      <p className="text-xs text-gray-400 mb-3">
        Fill in what you know — skip anything you&apos;re unsure about. Every answer helps.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 px-4 py-1">

        {/* Visit date */}
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-700">When did you visit?</span>
          <input type="date" value={form.visit_date}
            onChange={e => set({ visit_date: e.target.value })}
            className="text-sm border border-gray-300 rounded px-2 py-0.5 text-gray-700"
          />
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Bathrooms</p>
        <StarPicker label="Cleanliness" value={form.bathroom_cleanliness} onChange={v => set({ bathroom_cleanliness: v })} />
        <BoolPicker label="Diaper changing tables" value={form.diaper_changing_tables} onChange={v => set({ diaper_changing_tables: v })} />
        <BoolPicker label="Soap stocked" value={form.soap_stocked} onChange={v => set({ soap_stocked: v })} />
        <BoolPicker label="Paper towels stocked" value={form.paper_towels_stocked} onChange={v => set({ paper_towels_stocked: v })} />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Concessions</p>
        <StarPicker label="Food quality" value={form.concessions_quality} onChange={v => set({ concessions_quality: v })} />
        <StarPicker label="Value for money" value={form.concessions_value} onChange={v => set({ concessions_value: v })} />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Water</p>
        <SelectPicker<WaterAccess>
          label="Water access"
          value={form.water_access}
          onChange={v => set({ water_access: v })}
          options={[
            { value: 'purchase_only',      label: 'Purchase only' },
            { value: 'fountains_marginal', label: 'Fountains (meh)' },
            { value: 'fountains_good',     label: 'Fountains (good)' },
            { value: 'bottle_filler',      label: 'Bottle filler' },
          ]}
        />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Seating &amp; Walkways</p>
        <StarPicker label="Bleacher cleanliness" value={form.bleachers_cleanliness} onChange={v => set({ bleachers_cleanliness: v })} />
        <BoolPicker label="Hard surface for chairs" value={form.cement_pad_for_chairs} onChange={v => set({ cement_pad_for_chairs: v })} />
        <SelectPicker<ShadeAmount>
          label="Shade"
          value={form.shade_amount}
          onChange={v => set({ shade_amount: v })}
          options={[
            { value: 'none',     label: 'None' },
            { value: 'minimal',  label: 'Minimal' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'ample',    label: 'Ample' },
          ]}
        />
        <SelectPicker<WalkwaysCongestion>
          label="Walkway congestion"
          value={form.walkways_congestion}
          onChange={v => set({ walkways_congestion: v })}
          options={[
            { value: 'open',     label: 'Open' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'tight',    label: 'Tight' },
          ]}
        />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Safety &amp; Policies</p>
        <BoolPicker label="Protected from fly balls" value={form.covered_from_fly_balls} onChange={v => set({ covered_from_fly_balls: v })} />
        <BoolPicker label="Tents / canopies allowed" value={form.tents_allowed} onChange={v => set({ tents_allowed: v })} />
        <BoolPicker label="Pets allowed" value={form.pets_allowed} onChange={v => set({ pets_allowed: v })} />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Tip for other parents</p>
        <textarea
          value={form.reviewer_note}
          onChange={e => set({ reviewer_note: e.target.value })}
          maxLength={500}
          rows={3}
          placeholder="Anything else parents should know before heading out? (optional)"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mt-1 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-3 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
      >
        {saving ? 'Saving…' : 'Submit visit report'}
      </button>
    </div>
  )
}
