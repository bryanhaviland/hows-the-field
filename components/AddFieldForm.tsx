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

  const set = (patch: Partial<typeof defaultForm>) => setForm(f => ({ ...f, ...patch }))

  if (!user) {
    return (
      <div className="mt-3 bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-3">Log in to add a field.</p>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Log in / create account
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
        <span className="text-sm text-gray-700">Field name</span>
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
        label="Surface"
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
        label="Outfield depth"
        value={form.outfield_depth}
        onChange={v => set({ outfield_depth: v })}
        options={[
          { value: 'short', label: 'Short' },
          { value: 'standard', label: 'Standard' },
          { value: 'deep', label: 'Deep' },
        ]}
      />
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
        label="Dugout size"
        value={form.dugout_size}
        onChange={v => set({ dugout_size: v })}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />
      <SelectPicker<DugoutMaterial>
        label="Dugout material"
        value={form.dugout_material}
        onChange={v => set({ dugout_material: v })}
        options={[
          { value: 'cement', label: 'Cement' },
          { value: 'chain_link', label: 'Chain link' },
          { value: 'wood', label: 'Wood' },
          { value: 'mixed', label: 'Mixed' },
        ]}
      />
      <BoolPicker label="Covered dugouts" value={form.covered_dugouts} onChange={v => set({ covered_dugouts: v })} />
      <BoolPicker label="Dugouts block view" value={form.dugouts_block_view} onChange={v => set({ dugouts_block_view: v })} />
      <BoolPicker label="Covered stands" value={form.covered_stands} onChange={v => set({ covered_stands: v })} />

      {error && <p className="text-sm text-red-600 py-2">{error}</p>}

      <div className="flex gap-2 py-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Add field'}
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
