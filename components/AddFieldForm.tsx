'use client'

import { useState } from 'react'
import { supabase, FieldSurface, DugoutSize, DugoutMaterial, OutfieldDepth, BackstopDepth } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AuthModal from '@/components/AuthModal'
import { BoolPicker, SelectPicker } from '@/components/RatingForm'

interface Props {
  complexId: string
  onSubmit: () => void
  onCancel: () => void
}

const defaultForm = {
  field_name: '',
  field_surface: null as FieldSurface | null,
  outfield_depth: null as OutfieldDepth | null,
  outfield_depth_left_ft: '' as string,
  outfield_depth_center_ft: '' as string,
  outfield_depth_right_ft: '' as string,
  backstop: null as BackstopDepth | null,
  dugout_size: null as DugoutSize | null,
  dugout_material: null as DugoutMaterial | null,
  covered_dugouts: null as boolean | null,
  dugouts_block_view: null as boolean | null,
  covered_stands: null as boolean | null,
}

/**
 * Lets any logged-in user add a field's specifics to a complex (crowdsourced,
 * same as reviews — see the "logged-in users can add a field" RLS policy).
 * This was previously admin-only, which is why nobody could ever add field
 * data even though the `fields` table and its display were already built.
 */
export default function AddFieldForm({ complexId, onSubmit, onCancel }: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showExactOutfield, setShowExactOutfield] = useState(false)

  const set = (patch: Partial<typeof defaultForm>) => setForm(f => ({ ...f, ...patch }))

  if (!user) {
    return (
      <div className="mt-3 bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-3">Log in to add a field.</p>
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
    if (!form.field_name.trim()) {
      setError('Give the field a name, e.g. "Field 3" or "Diamond A".')
      return
    }
    setError(null)
    setSaving(true)

    const row: Record<string, unknown> = {
      complex_id: complexId,
      field_name: form.field_name.trim(),
    }
    if (form.field_surface) row.field_surface = form.field_surface
    if (form.outfield_depth) row.outfield_depth = form.outfield_depth
    if (form.outfield_depth_left_ft.trim()) row.outfield_depth_left_ft = Number(form.outfield_depth_left_ft)
    if (form.outfield_depth_center_ft.trim()) row.outfield_depth_center_ft = Number(form.outfield_depth_center_ft)
    if (form.outfield_depth_right_ft.trim()) row.outfield_depth_right_ft = Number(form.outfield_depth_right_ft)
    if (form.backstop) row.backstop = form.backstop
    if (form.dugout_size) row.dugout_size = form.dugout_size
    if (form.dugout_material) row.dugout_material = form.dugout_material
    if (form.covered_dugouts !== null) row.covered_dugouts = form.covered_dugouts
    if (form.dugouts_block_view !== null) row.dugouts_block_view = form.dugouts_block_view
    if (form.covered_stands !== null) row.covered_stands = form.covered_stands

    const { error: insertErr } = await supabase.from('fields').insert(row)
    setSaving(false)
    if (insertErr) {
      setError('Something went wrong saving that — try again.')
      return
    }
    onSubmit()
  }

  return (
    <div className="mt-3 bg-white rounded-lg border border-gray-200 px-4 py-1">
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-700">Field Name</span>
        <input
          type="text"
          value={form.field_name}
          onChange={e => set({ field_name: e.target.value })}
          placeholder="e.g. Field 3"
          maxLength={40}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 max-w-[55%]"
        />
      </div>

      <SelectPicker<FieldSurface>
        label="Infield Surface"
        value={form.field_surface}
        onChange={v => set({ field_surface: v })}
        options={[
          { value: 'grass', label: 'Grass' },
          { value: 'grass_clay', label: 'Grass/Clay' },
          { value: 'clay', label: 'Clay' },
          { value: 'turf', label: 'Turf' },
        ]}
      />
      <SelectPicker<OutfieldDepth>
        label="Outfield Depth"
        value={form.outfield_depth}
        onChange={v => set({ outfield_depth: v })}
        options={[
          { value: 'short', label: 'Short' },
          { value: 'standard', label: 'Standard' },
          { value: 'deep', label: 'Deep' },
        ]}
      />

      <div className="border-b border-gray-100">
        <button
          type="button"
          onClick={() => setShowExactOutfield(v => !v)}
          className="w-full flex items-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          <span className={`inline-block transition-transform ${showExactOutfield ? 'rotate-90' : ''}`}>&#9656;</span>
          Add Exact Measurements
        </button>
        {showExactOutfield && (
          <div className="pb-2 pl-4 space-y-1">
            {([
              ['Left', 'outfield_depth_left_ft'],
              ['Center', 'outfield_depth_center_ft'],
              ['Right', 'outfield_depth_right_ft'],
            ] as const).map(([rowLabel, key]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{rowLabel}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={form[key]}
                    onChange={e => set({ [key]: e.target.value } as Partial<typeof defaultForm>)}
                    placeholder="0"
                    className="w-16 text-sm text-right border border-gray-300 rounded-lg px-2 py-1"
                  />
                  <span className="text-xs text-gray-500">ft</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SelectPicker<BackstopDepth>
        label="Backstop"
        value={form.backstop}
        onChange={v => set({ backstop: v })}
        options={[
          { value: 'short', label: 'Short' },
          { value: 'normal', label: 'Normal' },
          { value: 'deep', label: 'Deep' },
        ]}
      />
      <SelectPicker<DugoutSize>
        label="Dugout Size"
        value={form.dugout_size}
        onChange={v => set({ dugout_size: v })}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />
      <SelectPicker<DugoutMaterial>
        label="Dugout Material"
        value={form.dugout_material}
        onChange={v => set({ dugout_material: v })}
        options={[
          { value: 'cement', label: 'Cement' },
          { value: 'chain_link', label: 'Chain Link' },
          { value: 'wood', label: 'Wood' },
          { value: 'mixed', label: 'Mixed' },
        ]}
      />
      <BoolPicker label="Covered Dugouts" value={form.covered_dugouts} onChange={v => set({ covered_dugouts: v })} />
      <BoolPicker label="Dugouts Block View" value={form.dugouts_block_view} onChange={v => set({ dugouts_block_view: v })} />
      <BoolPicker label="Covered Stands" value={form.covered_stands} onChange={v => set({ covered_stands: v })} />

      {error && <p className="text-sm text-red-600 py-2">{error}</p>}

      <div className="flex gap-2 py-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Add Field'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-sm text-gray-500 hover:text-gray-700 px-3"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
