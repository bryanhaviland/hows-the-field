'use client'

import { useState } from 'react'
import { supabase, ShadeAmount, WalkwaysCongestion, WaterAccess, ConcessionsTime, Review } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AuthModal from '@/components/AuthModal'

interface Props {
  complexId: string
  /** Pre-select a specific field, e.g. when the user clicked "leave a note" on that field. Not user-editable — the fields table is its own separate form. */
  initialFieldId?: string | null
  /** The current user's own existing review, when they're editing it rather than filing a new visit report. */
  existingReview?: Review | null
  onSubmit: () => void
}

export function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
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

export function BoolPicker({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
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

export function SelectPicker<T extends string>({
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

export function MultiSelectPicker<T extends string>({
  label, values, onChange, options
}: {
  label: string
  values: T[]
  onChange: (v: T[]) => void
  options: { value: T; label: string }[]
}) {
  const toggle = (v: T) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1 flex-wrap justify-end">
        {options.map(o => (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              values.includes(o.value)
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
  concessions_onsite: null as boolean | null,
  free_admission: null as boolean | null,
  ample_parking: null as boolean | null,
  concessions_available_for: [] as ConcessionsTime[],
  water_access: null as WaterAccess | null,
  reviewer_note: '',
}

function formFromReview(r: Review): typeof defaultForm {
  return {
    bathroom_cleanliness: r.bathroom_cleanliness ?? 0,
    diaper_changing_tables: r.diaper_changing_tables,
    soap_stocked: r.soap_stocked,
    paper_towels_stocked: r.paper_towels_stocked,
    concessions_quality: r.concessions_quality ?? 0,
    concessions_value: r.concessions_value ?? 0,
    bleachers_cleanliness: r.bleachers_cleanliness ?? 0,
    cement_pad_for_chairs: r.cement_pad_for_chairs,
    shade_amount: r.shade_amount,
    walkways_congestion: r.walkways_congestion,
    covered_from_fly_balls: r.covered_from_fly_balls,
    tents_allowed: r.tents_allowed,
    pets_allowed: r.pets_allowed,
    concessions_onsite: r.concessions_onsite,
    free_admission: r.free_admission,
    ample_parking: r.ample_parking,
    concessions_available_for: r.concessions_available_for ?? [],
    water_access: r.water_access,
    reviewer_note: r.reviewer_note ?? '',
  }
}

export default function RatingForm({ complexId, initialFieldId = null, existingReview = null, onSubmit }: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState(existingReview ? formFromReview(existingReview) : defaultForm)
  const [fieldId] = useState<string | null>(existingReview ? existingReview.field_id : initialFieldId)
  const [anonymous, setAnonymous] = useState(existingReview?.is_anonymous ?? false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const set = (patch: Partial<typeof defaultForm>) => setForm(f => ({ ...f, ...patch }))

  if (!user) {
    return (
      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-3">Log in to submit a visit report — it helps us credit consistent reviewers.</p>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Log In / Create Account
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  const handleSubmit = async () => {
    setSaving(true)

    // Build the insert/update — only include fields the user actually touched
    const row: Record<string, unknown> = {
      complex_id: complexId,
      field_id: fieldId,
      user_id: user.id,
      is_anonymous: anonymous,
    }

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
    if (form.concessions_onsite !== null) row.concessions_onsite   = form.concessions_onsite
    if (form.free_admission !== null)  row.free_admission          = form.free_admission
    if (form.ample_parking !== null)   row.ample_parking           = form.ample_parking
    if (form.concessions_available_for.length > 0) row.concessions_available_for = form.concessions_available_for
    if (form.shade_amount)             row.shade_amount            = form.shade_amount
    if (form.walkways_congestion)      row.walkways_congestion     = form.walkways_congestion
    if (form.water_access)             row.water_access            = form.water_access
    if (form.reviewer_note.trim())     row.reviewer_note           = form.reviewer_note.trim()

    if (existingReview) {
      await supabase.from('reviews').update(row).eq('id', existingReview.id)
    } else {
      await supabase.from('reviews').insert(row)
    }
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

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-1 pb-1">Amenities</p>
        <BoolPicker label="Concessions On-Site" value={form.concessions_onsite} onChange={v => set({ concessions_onsite: v })} />
        <BoolPicker label="Tents / Canopies Allowed" value={form.tents_allowed} onChange={v => set({ tents_allowed: v })} />
        <BoolPicker label="Pets Allowed" value={form.pets_allowed} onChange={v => set({ pets_allowed: v })} />
        <BoolPicker label="Free Admission" value={form.free_admission} onChange={v => set({ free_admission: v })} />
        <BoolPicker label="Ample Parking" value={form.ample_parking} onChange={v => set({ ample_parking: v })} />
        <BoolPicker label="Protected From Fly Balls" value={form.covered_from_fly_balls} onChange={v => set({ covered_from_fly_balls: v })} />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Bathrooms</p>
        <StarPicker label="Cleanliness" value={form.bathroom_cleanliness} onChange={v => set({ bathroom_cleanliness: v })} />
        <BoolPicker label="Diaper Changing Tables" value={form.diaper_changing_tables} onChange={v => set({ diaper_changing_tables: v })} />
        <BoolPicker label="Soap Stocked" value={form.soap_stocked} onChange={v => set({ soap_stocked: v })} />
        <BoolPicker label="Paper Towels Stocked" value={form.paper_towels_stocked} onChange={v => set({ paper_towels_stocked: v })} />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Concessions</p>
        <StarPicker label="Food Quality" value={form.concessions_quality} onChange={v => set({ concessions_quality: v })} />
        <StarPicker label="Value For Money" value={form.concessions_value} onChange={v => set({ concessions_value: v })} />
        <MultiSelectPicker<ConcessionsTime>
          label="Concessions Available For"
          values={form.concessions_available_for}
          onChange={v => set({ concessions_available_for: v })}
          options={[
            { value: 'breakfast', label: 'Breakfast' },
            { value: 'lunch', label: 'Lunch' },
            { value: 'dinner', label: 'Dinner' },
            { value: 'select_times_only', label: 'Select Times Only' },
          ]}
        />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Water</p>
        <SelectPicker<WaterAccess>
          label="Water Access"
          value={form.water_access}
          onChange={v => set({ water_access: v })}
          options={[
            { value: 'purchase_only',      label: 'Purchase Only' },
            { value: 'fountains_marginal', label: 'Drinking Fountain - Barely Working' },
            { value: 'fountains_good',     label: 'Drinking Fountain - Good Condition' },
            { value: 'bottle_filler',      label: 'Bottle Filler' },
            { value: 'none',               label: 'None Available' },
          ]}
        />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Seating &amp; Walkways</p>
        <StarPicker label="Bleacher Cleanliness" value={form.bleachers_cleanliness} onChange={v => set({ bleachers_cleanliness: v })} />
        <BoolPicker label="Hard Surface For Chairs" value={form.cement_pad_for_chairs} onChange={v => set({ cement_pad_for_chairs: v })} />
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
          label="Walkway Congestion"
          value={form.walkways_congestion}
          onChange={v => set({ walkways_congestion: v })}
          options={[
            { value: 'open',     label: 'Open' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'tight',    label: 'Tight' },
          ]}
        />

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-1">Tip For Other Parents</p>
        <textarea
          value={form.reviewer_note}
          onChange={e => set({ reviewer_note: e.target.value })}
          maxLength={500}
          rows={3}
          placeholder="Anything else parents should know before heading out? (optional)"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mt-1 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <label className="flex items-center gap-2 py-3 border-t border-gray-100 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={e => setAnonymous(e.target.checked)}
            className="rounded border-gray-300"
          />
          Post this report anonymously (your name won&apos;t be shown — but it won&apos;t count toward your reviewer badge either)
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-3 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
      >
        {saving ? 'Saving…' : existingReview ? 'Save Changes' : 'Submit Visit Report'}
      </button>
    </div>
  )
}
