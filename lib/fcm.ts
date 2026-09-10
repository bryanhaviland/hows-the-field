import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Firebase Cloud Messaging (HTTP v1) client. Sends push
 * notifications directly to FCM — no OneSignal or other third-party
 * relay — using a Firebase service account, matching how Bryan's other
 * app (Fill My Roster) avoids a middleman too, just with Expo's own relay
 * instead since that app is Expo/React Native rather than Capacitor.
 *
 * Client devices register an FCM token via @capacitor-firebase/messaging
 * (see components/PushInit.tsx) and store it in field_push_tokens —
 * deliberately a separate table from Fill My Roster's push_tokens, since
 * both apps share this Supabase project but push_tokens has no per-app
 * column: writing into it here would let one account's Hows The Field
 * login silently overwrite their Fill My Roster push token.
 *
 * Auth: FCM v1 needs a short-lived OAuth2 access token obtained via a
 * service-account JWT bearer flow (RFC 7523) — signed here with the
 * platform's native Web Crypto (crypto.subtle), so no googleapis/JWT
 * npm dependency is needed, and this works unmodified in both the
 * Cloudflare Worker runtime (the lightning-watch cron job) and Node.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

// Cached for the lifetime of this module instance (a single Worker
// invocation, typically) so multiple sendPushToUsers calls in the same
// lightning-watch-job run — one per grid cell — don't each re-sign a JWT
// and round-trip to Google's token endpoint.
let cachedAccessToken: { token: string; expiresAt: number } | null = null

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of arr) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlEncodeString(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str))
}

/** Parses a PEM-encoded PKCS#8 private key (as stored in a Firebase service
 * account JSON's `private_key` field) into a CryptoKey for RS256 signing. */
async function importServiceAccountKey(pem: string): Promise<CryptoKey> {
  const contents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')
  const binary = atob(contents)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!clientEmail || !privateKey) {
    console.error('[fcm] FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY not set — skipping push')
    return null
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }
  const unsigned = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(claims))}`

  try {
    const key = await importServiceAccountKey(privateKey)
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
    const jwt = `${unsigned}.${base64UrlEncode(signature)}`

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('[fcm] token exchange failed', res.status, await res.text().catch(() => ''))
      return null
    }
    const json = (await res.json()) as { access_token: string; expires_in: number }
    cachedAccessToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
    return json.access_token
  } catch (err) {
    console.error('[fcm] failed to sign/exchange service account JWT', err)
    return null
  }
}

/**
 * Sends a push to every user id that has a registered FCM token, looked up
 * from field_push_tokens. Silently skips users with no token on file (push
 * permission never granted, or web-only user). Prunes tokens FCM reports
 * as no-longer-registered so a stale install doesn't get queried forever.
 */
export async function sendPushToUsers(admin: SupabaseClient, userIds: string[], title: string, body: string): Promise<void> {
  if (userIds.length === 0) return

  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) {
    console.error('[fcm] FIREBASE_PROJECT_ID not set — skipping push')
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) return

  const { data: tokenRows } = await admin.from('field_push_tokens').select('user_id, fcm_token').in('user_id', userIds)
  const rows = tokenRows ?? []
  if (rows.length === 0) return

  const staleUserIds: string[] = []

  await Promise.all(
    rows.map(async (row: { user_id: string; fcm_token: string }) => {
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: row.fcm_token,
              notification: { title, body },
            },
          }),
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) {
          const errJson = await res.json().catch(() => null)
          const status = errJson?.error?.status
          if (status === 'NOT_FOUND' || status === 'UNREGISTERED' || status === 'INVALID_ARGUMENT') {
            staleUserIds.push(row.user_id)
          } else {
            console.error('[fcm] send failed', res.status, errJson)
          }
        }
      } catch (err) {
        console.error('[fcm] send threw', err)
      }
    })
  )

  if (staleUserIds.length > 0) {
    await admin.from('field_push_tokens').delete().in('user_id', staleUserIds)
  }
}
