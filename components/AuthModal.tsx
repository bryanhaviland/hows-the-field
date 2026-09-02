'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchMode = (m: 'sign-in' | 'sign-up') => {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'sign-in') {
      const { error } = await signIn(email, password)
      setSubmitting(false)
      if (error) { setError(error); return }
      onClose()
    } else {
      const { error, needsEmailConfirm } = await signUp(email, password)
      setSubmitting(false)
      if (error) { setError(error); return }
      if (needsEmailConfirm) {
        setInfo('Check your email to confirm your account, then sign in.')
      } else {
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${mode === 'sign-in' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-400'}`}
            onClick={() => switchMode('sign-in')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${mode === 'sign-up' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-400'}`}
            onClick={() => switchMode('sign-up')}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-blue-700">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button onClick={onClose} className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
