'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { usePremium } from '@/lib/premium-context'
import { useAuth } from '@/lib/auth-context'
import AuthModal from '@/components/AuthModal'

interface PremiumPaywallProps {
  icon?: string
  title?: string
  description?: string
}

export default function PremiumPaywall({
  icon = '⛈️',
  title = 'Today at the Field',
  description = 'Live field condition & parking check-ins from other parents, a rain forecast for game time, and a lightning monitor that tells you exactly how far out the last strike was — all in real time.',
}: PremiumPaywallProps = {}) {
  const { user, session } = useAuth()
  const { offering, purchase, restore, refresh } = usePremium()
  const [showAuth, setShowAuth] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutBanner, setCheckoutBanner] = useState<'success' | 'cancelled' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isNative = Capacitor.isNativePlatform()

  // Coming back from Stripe Checkout — pick up ?checkout=success|cancelled,
  // strip it from the URL, and (on success) re-check entitlement. The
  // webhook usually beats the redirect back here, but refresh() again in
  // case it hasn't landed yet, same pattern as the native purchase() flow.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const result = params.get('checkout')
    if (result !== 'success' && result !== 'cancelled') return
    params.delete('checkout')
    const query = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
    setCheckoutBanner(result)
    if (result === 'success') {
      refresh()
      setTimeout(refresh, 3000)
    }
  }, [refresh])

  const handleSubscribe = async () => {
    if (!session?.access_token) return
    setError(null)
    setCheckingOut(true)
    try {
      const res = await fetch('https://howsthefield.com/api/premium/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ returnTo: window.location.pathname }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not start checkout — try again.')
        setCheckingOut(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not reach the server — check your connection and try again.')
      setCheckingOut(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-amber-50 border border-blue-200 rounded-xl p-5 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1 mb-4 max-w-sm mx-auto">{description}</p>

      {!user ? (
        <>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Log in to subscribe
          </button>
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </>
      ) : isNative ? (
        <div className="space-y-2 max-w-xs mx-auto">
          {offering && offering.availablePackages.length > 0 ? (
            offering.availablePackages.map(pkg => (
              <button
                key={pkg.identifier}
                disabled={purchasing !== null}
                onClick={async () => {
                  setError(null)
                  setPurchasing(pkg.identifier)
                  const { error } = await purchase(pkg)
                  setPurchasing(null)
                  if (error) setError(error)
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {purchasing === pkg.identifier
                  ? 'Please wait…'
                  : `Subscribe — ${pkg.product.priceString} ${describePeriod(pkg.packageType)}`}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-400">Loading subscription options…</p>
          )}
          <button
            disabled={restoring}
            onClick={async () => {
              setError(null)
              setRestoring(true)
              const { error } = await restore()
              setRestoring(false)
              if (error) setError(error)
            }}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            {restoring ? 'Restoring…' : 'Restore purchases'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2 max-w-xs mx-auto">
          {checkoutBanner === 'success' && (
            <p className="text-sm text-green-700">You&apos;re subscribed! This may take a moment to unlock.</p>
          )}
          {checkoutBanner === 'cancelled' && (
            <p className="text-xs text-gray-400">Checkout cancelled — no charge was made.</p>
          )}
          <button
            disabled={checkingOut}
            onClick={handleSubscribe}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {checkingOut ? 'Redirecting…' : 'Subscribe — $2.99 / month'}
          </button>
          <p className="text-xs text-gray-400">
            Already subscribed in the app? Log in with the same account here to see it on the web too.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}

function describePeriod(packageType: string): string {
  switch (packageType) {
    case 'MONTHLY': return '/ month'
    case 'ANNUAL': return '/ year'
    case 'WEEKLY': return '/ week'
    case 'LIFETIME': return 'one-time'
    default: return ''
  }
}
