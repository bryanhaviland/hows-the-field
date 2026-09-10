import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS entirely. Only import this
 * from server-side code (app/api/** route handlers, never a 'use client'
 * component). Used for the lightning/rain caches and the RevenueCat
 * webhook, none of which the browser should ever touch directly.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
