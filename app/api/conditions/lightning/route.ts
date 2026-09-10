import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { corsJson, corsPreflight } from '@/lib/cors'
import { resolveComplexLocation } from '@/lib/complex-location'
import { checkLightningForLocation, BASELINE_POLL_SECONDS } from '@/lib/lightning-check'
import type { LightningStatus } from '@/lib/supabase'

function emptyStatus(pollIntervalSeconds: number, source: 'cache' | 'live'): LightningStatus {
  return {
    hasRecentStrike: false,
    distanceMiles: null,
    bearing: null,
    strikeAt: null,
    ageMinutes: null,
    holdActive: false,
    clearAt: null,
    trend: 'unknown',
    pollIntervalSeconds,
    source,
  }
}

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
    // No address on file / geocoding failed — nothing we can do, but don't
    // error the whole panel out over it.
    return corsJson(req, emptyStatus(BASELINE_POLL_SECONDS, 'live'))
  }

  const { status } = await checkLightningForLocation(admin, location.latitude, location.longitude)
  return corsJson(req, status)
}
