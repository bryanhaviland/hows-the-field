'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import AuthModal from '@/components/AuthModal'

const SPORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'baseball', label: 'Baseball' },
  { value: 'softball', label: 'Softball' },
  { value: 'both', label: 'Baseball & Softball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'flag_football', label: 'Flag Football' },
]

const defaultForm = {
  name: '',
  address: '',
  city: '',
  state: 'FL',
  zip: '',
  sport_type: 'baseball',
  num_fields: '',
  website: '',
}

export default function SubmitComplexForm() {
  const { user, session } = useAuth()
  const [form, setForm] = useState(defaultForm)
  const [showAuth, setShowAuth] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successAddress, setSuccessAddress] = useState<string | null>(null)
  const [autoVerified, setAutoVerified] = useState(false)

  const set = (patch: Partial<typeof defaultForm>) => setForm(f => ({ ...f, ...patch }))

  if (!user || !session) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-3">Log in to submit a complex — it helps us credit coaches who help build this out.</p>
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

  if (successAddress) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
        <p className="text-green-700 text-sm font-medium">
          {autoVerified ? '✓ Added! Your complex is live now:' : '✓ Thanks! We verified the address:'}
        </p>
        <p className="text-gray-700 text-sm mt-1">{successAddress}</p>
        <p className="text-xs text-gray-500 mt-3">
          {autoVerified
            ? 'It should show up in search right away.'
            : "We couldn't confirm a field at that spot automatically, so it's in the queue for a quick review before it shows up in search."}
        </p>
        <button
          onClick={() => { setForm(defaultForm); setSuccessAddress(null); setAutoVerified(false) }}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Submit another
        </button>
      </div>
    )
  }

  const handleSubmit = async () => {
    setError(null)
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Name, address, and city are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('https://howsthefield.com/api/complexes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim() || 'FL',
          zip: form.zip.trim() || null,
          sport_type: form.sport_type,
          num_fields: form.num_fields ? Number(form.num_fields) : null,
          website: form.website.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong — try again.')
        return
      }
      setAutoVerified(Boolean(data.verified))
      setSuccessAddress(data.formattedAddress ?? form.address)
    } catch {
      setError('Could not reach the server — check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <p className="text-xs text-gray-400">
        We verify every address against Google&apos;s mapping data before it&apos;s submitted for review — a coach still checks it before it goes live.
      </p>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Complex name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => set({ name: e.target.value })}
          placeholder="e.g. Riverview Youth Sports Complex"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Street address</label>
        <input
          type="text"
          value={form.address}
          onChange={e => set({ address: e.target.value })}
          placeholder="123 Ballfield Rd"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input
            type="text"
            value={form.city}
            onChange={e => set({ city: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
          <input
            type="text"
            value={form.state}
            onChange={e => set({ state: e.target.value.toUpperCase() })}
            maxLength={2}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Zip (optional)</label>
          <input
            type="text"
            value={form.zip}
            onChange={e => set({ zip: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1"># of fields (optional)</label>
          <input
            type="number"
            min={1}
            value={form.num_fields}
            onChange={e => set({ num_fields: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Sport</label>
        <div className="flex flex-wrap gap-1.5">
          {SPORT_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => set({ sport_type: o.value })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                form.sport_type === o.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Website (optional)</label>
        <input
          type="text"
          value={form.website}
          onChange={e => set({ website: e.target.value })}
          placeholder="https://..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
      >
        {submitting ? 'Verifying address…' : 'Submit for review'}
      </button>
    </div>
  )
}
