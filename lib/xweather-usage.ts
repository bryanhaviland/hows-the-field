import type { SupabaseClient } from '@supabase/supabase-js'

// Fire-and-forget-safe logger for real (non-cached) Xweather calls, so
// actual monthly usage/cost can be checked in Supabase (xweather_usage_monthly
// view) instead of finding out from a bill. Never lets a logging failure
// break the actual API response.
export async function logXweatherCall(admin: SupabaseClient, endpoint: string, gridKey: string) {
  const { error } = await admin.from('xweather_usage_log').insert({ endpoint, grid_key: gridKey })
  if (error) {
    console.error('[xweather-usage] failed to log call', error)
  }
}
