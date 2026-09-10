'use client'

import { useEffect, useRef, useState } from 'react'
import type { RainForecast } from '@/lib/supabase'

export default function RainForecastStrip({ complexId }: { complexId: string }) {
  const [forecast, setForecast] = useState<RainForecast | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`https://howsthefield.com/api/conditions/rain?complexId=${encodeURIComponent(complexId)}`)
        if (!res.ok) throw new Error(String(res.status))
        const data: RainForecast = await res.json()
        if (cancelled) return
        setForecast(data)
        timerRef.current = setTimeout(poll, Math.max(300, data.pollIntervalSeconds) * 1000)
      } catch {
        if (cancelled) return
        timerRef.current = setTimeout(poll, 30 * 60 * 1000)
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [complexId])

  if (!forecast) {
    return <div className="text-sm text-gray-400">Loading rain forecast…</div>
  }

  const isRainy = forecast.headline.startsWith('Rain likely')

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{isRainy ? '🌧️' : '☀️'}</span>
      <span className={isRainy ? 'text-blue-700 font-medium' : 'text-gray-600'}>{forecast.headline}</span>
    </div>
  )
}
