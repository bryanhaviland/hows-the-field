import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { corsJson, corsPreflight } from '@/lib/cors'
import { gridKey } from '@/lib/geo'
import { resolveComplexLocation } from '@/lib/complex-location'
import type { RainForecast } from '@/lib/supabase'

// Forecasts don't change minute to minute — a 30 min cache is plenty and
// keeps this well inside Open-Meteo's free non-commercial usage.
const POLL_SECONDS = 30 * 60
const RAIN_PROBABILITY_THRESHOLD = 40 // %

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function GET(req: NextRequest) {
  const complexId = req.nextUrl.searchParams.get('complexId')
  if (!complexId) {
    return corsJson(req, { error: 'complexId is required' }, { status: 400 })
  }

  const admin = supabaseAdmin()
  const location = await resolveComplexLocation(complexId)
  if (!location) {
    return corsJson(req, emptyForecast('live'))
  }

  const key = gridKey(location.latitude, location.longitude)
  const now = Date.now()

  const { data: cached } = await admin
    .from('rain_forecast_cache')
    .select('*')
    .eq('grid_key', key)
    .maybeSingle()

  if (cached && new Date(cached.next_poll_at).getTime() > now) {
    return corsJson(req, {
      headline: cached.headline ?? 'No rain expected today',
      hourly: cached.hourly ?? [],
      pollIntervalSeconds: Math.max(60, Math.round((new Date(cached.next_poll_at).getTime() - now) / 1000)),
      source: 'cache',
    } satisfies RainForecast)
  }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(location.latitude))
    url.searchParams.set('longitude', String(location.longitude))
    url.searchParams.set('hourly', 'precipitation_probability,precipitation')
    url.searchParams.set('forecast_days', '1')
    url.searchParams.set('timezone', 'auto')

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const json = await res.json()

    const times: string[] = json?.hourly?.time ?? []
    const probs: number[] = json?.hourly?.precipitation_probability ?? []
    const amounts: number[] = json?.hourly?.precipitation ?? []

    const hourly = times.map((t, i) => ({
      hour: t.slice(11, 16), // "HH:MM" from "YYYY-MM-DDTHH:MM"
      precipProbability: probs[i] ?? 0,
      precipitation: amounts[i] ?? 0,
    }))

    const headline = buildHeadline(hourly)
    const fetchedAt = new Date().toISOString()
    const nextPollAt = new Date(now + POLL_SECONDS * 1000).toISOString()

    await admin.from('rain_forecast_cache').upsert({
      grid_key: key,
      headline,
      hourly,
      fetched_at: fetchedAt,
      next_poll_at: nextPollAt,
    })

    return corsJson(req, {
      headline,
      hourly,
      pollIntervalSeconds: POLL_SECONDS,
      source: 'live',
    } satisfies RainForecast)
  } catch (err) {
    console.error('[rain] Open-Meteo fetch failed', err)
    return corsJson(req, emptyForecast('live'))
  }
}

function buildHeadline(hourly: { hour: string; precipProbability: number }[]): string {
  const now = new Date()
  const currentHour = now.getHours()

  const rainyHours = hourly.filter(h => {
    const hour = parseInt(h.hour.slice(0, 2), 10)
    return hour >= currentHour && h.precipProbability >= RAIN_PROBABILITY_THRESHOLD
  })

  if (rainyHours.length === 0) return 'No rain expected for the rest of today'

  const first = rainyHours[0]
  const last = rainyHours[rainyHours.length - 1]
  const fmt = (h: string) => formatHour(parseInt(h.slice(0, 2), 10))

  if (first.hour === last.hour) return `Rain likely around ${fmt(first.hour)}`
  return `Rain likely ${fmt(first.hour)}–${fmt(last.hour)}`
}

function formatHour(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12} ${period}`
}

function emptyForecast(source: 'cache' | 'live'): RainForecast {
  return {
    headline: 'No rain data available',
    hourly: [],
    pollIntervalSeconds: POLL_SECONDS,
    source,
  }
}
