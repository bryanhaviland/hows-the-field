'use client'

import { useEffect, useRef, useState } from 'react'
import type { RainForecast } from '@/lib/supabase'

function probColor(pct: number): string {
  if (pct >= 60) return 'bg-blue-600 text-white'
  if (pct >= 40) return 'bg-blue-100 text-blue-700'
  if (pct >= 20) return 'bg-gray-100 text-gray-600'
  return 'bg-gray-50 text-gray-400'
}

function formatHour(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}${period}`
}

export default function RainForecastStrip({ complexId }: { complexId: string }) {
  const [forecast, setForecast] = useState<RainForecast | null>(null)
  const [showHourly, setShowHourly] = useState(false)
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

  const isRainingNow = forecast.headline === 'Raining now'
  const isRainLikely = forecast.headline.startsWith('Rain likely')
  const isSlightChance = forecast.headline.startsWith('Slight chance')
  const isRainy = isRainingNow || isRainLikely

  const currentHour = new Date().getHours()
  const remainingHours = forecast.hourly.filter(h => parseInt(h.hour.slice(0, 2), 10) >= currentHour)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span>{isRainy ? '🌧️' : isSlightChance ? '🌦️' : '☀️'}</span>
          <span className={isRainingNow ? 'text-blue-800 font-semibold' : isRainy ? 'text-blue-700 font-medium' : isSlightChance ? 'text-blue-500' : 'text-gray-600'}>{forecast.headline}</span>
        </div>
        {remainingHours.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHourly(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline whitespace-nowrap"
          >
            {showHourly ? 'Hide hourly' : 'Hourly chance'}
          </button>
        )}
      </div>

      {showHourly && remainingHours.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {remainingHours.map(h => {
            const hour24 = parseInt(h.hour.slice(0, 2), 10)
            return (
              <div key={h.hour} className={`shrink-0 flex flex-col items-center rounded-lg px-2 py-1 ${probColor(h.precipProbability)}`}>
                <span className="text-[10px] font-medium leading-tight">{formatHour(hour24)}</span>
                <span className="text-xs font-semibold leading-tight">{h.precipProbability}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
