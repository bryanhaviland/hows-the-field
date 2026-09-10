'use client'

import { useEffect, useRef, useState } from 'react'
import type { LightningStatus } from '@/lib/supabase'

/**
 * Polls /api/conditions/lightning at whatever cadence the server hands
 * back — that cadence tightens automatically during an active hold and
 * relaxes again once it passes (see the route for the actual thresholds).
 * The server-side cache is what actually limits upstream API calls; this
 * component additionally avoids polling at all while the tab/app is in
 * the background, so a phone left open in a pocket doesn't burn data.
 */
export default function LightningMonitor({ complexId }: { complexId: string }) {
  const [status, setStatus] = useState<LightningStatus | null>(null)
  const [error, setError] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const poll = async () => {
      if (document.visibilityState !== 'visible') {
        // Skip this tick, try again soon rather than never — the tab may
        // become visible again well before the next "real" interval.
        timerRef.current = setTimeout(poll, 15000)
        return
      }
      try {
        const res = await fetch(`https://howsthefield.com/api/conditions/lightning?complexId=${encodeURIComponent(complexId)}`)
        if (!res.ok) throw new Error(String(res.status))
        const data: LightningStatus = await res.json()
        if (!mountedRef.current) return
        setStatus(data)
        setError(false)
        timerRef.current = setTimeout(poll, Math.max(15, data.pollIntervalSeconds) * 1000)
      } catch {
        if (!mountedRef.current) return
        setError(true)
        timerRef.current = setTimeout(poll, 60000) // back off a minute on failure
      }
    }

    poll()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerRef.current === null) poll()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [complexId])

  // Independent 1s ticker just for the countdown display — cheap, and
  // keeps "clear to resume in Xm" honest between the (much slower) network
  // polls instead of it looking frozen.
  useEffect(() => {
    if (!status?.holdActive) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status?.holdActive])

  if (error && !status) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>⚡</span> Lightning data unavailable right now
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>⚡</span> Checking for nearby lightning…
      </div>
    )
  }

  if (status.holdActive) {
    const remainingMs = status.clearAt ? new Date(status.clearAt).getTime() - now : 0
    const remainingMin = Math.max(0, Math.ceil(remainingMs / 60000))
    return (
      <div className="rounded-lg border px-3 py-2 bg-red-50 border-red-200 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <span className="animate-pulse">⚡</span> Lightning within 10 mi
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {status.distanceMiles != null ? (
              <>Last strike: {status.distanceMiles.toFixed(1)} mi {status.bearing} · {status.ageMinutes}m ago{trendSuffix(status.trend)}</>
            ) : (
              <>Last qualifying strike within the last {HOLD_MINUTES_LABEL} min</>
            )}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Assuming no new strikes within 10 mi</p>
        </div>
        <div className="text-right shrink-0 pl-3 border-l border-red-200">
          {remainingMin > 0 ? (
            <>
              <div className="text-3xl font-bold text-red-700 leading-none tabular-nums">{remainingMin}</div>
              <div className="text-[10px] font-medium text-red-600 uppercase tracking-wide mt-0.5">min until clear</div>
            </>
          ) : (
            <div className="text-sm font-semibold text-red-700">Any moment</div>
          )}
          {holdTrendBadge(status.trend)}
        </div>
      </div>
    )
  }

  if (!status.hasRecentStrike) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700">
        <span>✅</span> No lightning detected nearby
      </div>
    )
  }

  return (
    <div className="rounded-lg border px-3 py-2 bg-amber-50 border-amber-200">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
        <span>⚡</span> Recent lightning in the area
      </div>
      <p className="text-xs text-gray-600 mt-0.5">
        Last strike: {status.distanceMiles?.toFixed(1)} mi {status.bearing} · {status.ageMinutes}m ago
      </p>
      <p className="text-xs text-gray-500 mt-1">{trendLine(status.trend)}</p>
    </div>
  )
}

const HOLD_MINUTES_LABEL = 30

function trendLine(trend: LightningStatus['trend']): string {
  switch (trend) {
    case 'approaching':
      return '⬆ Moving closer'
    case 'receding':
      return '⬇ Moving away'
    case 'steady':
      return '→ Holding steady, not closing in'
    default:
      return 'Outside the 10-mile hold radius'
  }
}

function holdTrendBadge(trend: LightningStatus['trend']) {
  switch (trend) {
    case 'approaching':
      return <div className="text-[10px] font-semibold text-red-800 mt-1">⬆ Picking up</div>
    case 'receding':
      return <div className="text-[10px] font-semibold text-emerald-700 mt-1">⬇ Clearing out</div>
    case 'steady':
      return <div className="text-[10px] font-medium text-gray-500 mt-1">→ Steady</div>
    default:
      return null
  }
}

function trendSuffix(trend: LightningStatus['trend']): string {
  switch (trend) {
    case 'approaching':
      return ' · moving closer'
    case 'receding':
      return ' · moving away'
    case 'steady':
      return ' · holding steady'
    default:
      return ''
  }
}
