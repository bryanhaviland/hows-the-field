'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase, CorrectionIssueType } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'

const ISSUE_OPTIONS: { value: CorrectionIssueType; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'address', label: 'Address' },
  { value: 'sports', label: 'Sports offered' },
  { value: 'other', label: 'Something else' },
]

export default function ReportIssueForm({ complexId, complexName }: { complexId: string; complexName: string }) {
  const { user, session } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [issueType, setIssueType] = useState<CorrectionIssueType>('sports')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!user || !session) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-3">Log in to report an issue with this listing.</p>
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

  if (done) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
        <p className="text-green-700 text-sm font-medium">✓ Thanks — we&apos;ve logged it.</p>
        <p className="text-xs text-gray-500 mt-2">
          Reports are reviewed before anything changes on the listing, so nothing updates immediately.
        </p>
      </div>
    )
  }

  const handleSubmit = async () => {
    setError(null)
    if (!note.trim()) {
      setError('Add a quick note on what should change.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('complex_corrections').insert({
      complex_id: complexId,
      user_id: user.id,
      issue_type: issueType,
      note: note.trim(),
    })
    setSubmitting(false)
    if (error) {
      console.error('[report-issue] insert failed', error)
      setError('Something went wrong — try again.')
      return
    }
    setDone(true)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <p className="text-sm text-gray-500">Reporting an issue with <span className="font-medium text-gray-800">{complexName}</span>.</p>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">What&apos;s wrong?</label>
        <select
          value={issueType}
          onChange={e => setIssueType(e.target.value as CorrectionIssueType)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          {ISSUE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">What should it say instead?</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          placeholder="e.g. This complex only has soccer and flag football fields, not baseball/softball."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  )
}
