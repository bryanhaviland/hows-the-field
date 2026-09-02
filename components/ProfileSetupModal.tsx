'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function ProfileSetupModal() {
  const { completeProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (displayName.trim().length < 2) {
      setError('Use at least 2 characters.')
      return
    }
    setSubmitting(true)
    const { error } = await completeProfile(displayName)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h2 className="font-bold text-gray-900 mb-1">Welcome! One last step.</h2>
        <p className="text-sm text-gray-500 mb-4">
          Pick a display name other parents will see on your reviews.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Coach Dana"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Saving…' : 'Finish registering'}
          </button>
        </form>
        <button onClick={() => signOut()} className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600">
          Cancel and sign out
        </button>
      </div>
    </div>
  )
}
