'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

/**
 * Wires up push notifications inside the wrapped iOS/Android app (no-ops
 * on the regular website) — registers with Firebase Cloud Messaging
 * directly, no third-party push vendor. Uses @capacitor-firebase/messaging
 * rather than the bare @capacitor/push-notifications plugin because that
 * one hands back a raw APNs token on iOS (not something FCM's send API
 * accepts); this plugin wraps Firebase's native SDKs on both platforms so
 * getToken() always returns an FCM token, matching what lib/fcm.ts sends
 * to server-side.
 *
 * Stores the token in field_push_tokens (a table of its own — Fill My
 * Roster's push_tokens table has no per-app column, so writing into it
 * here would let one account's Hows The Field login silently overwrite
 * their Fill My Roster push token). The lightning-watch cron job
 * (lib/lightning-watch-job.ts) reads from field_push_tokens by user id.
 */
export default function PushInit() {
  const { user } = useAuth()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (!user) return

    ;(async () => {
      try {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')

        const permission = await FirebaseMessaging.requestPermissions()
        if (permission.receive !== 'granted') return

        const { token } = await FirebaseMessaging.getToken()
        if (!token) return

        const { error } = await supabase
          .from('field_push_tokens')
          .upsert({ user_id: user.id, fcm_token: token, updated_at: new Date().toISOString() })
        if (error) console.warn('[push] failed to save FCM token:', error.message)
      } catch {
        // Firebase Messaging plugin not available (e.g. web) — nothing to do
      }
    })()
  }, [user])

  return null
}
