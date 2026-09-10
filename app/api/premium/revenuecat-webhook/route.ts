import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Event types that mean "this subscriber should be entitled right now" —
// see https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
const ACTIVE_EVENT_TYPES = new Set([
  'TEST',
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_PAUSED', // still entitled until the period actually ends
  'BILLING_ISSUE',       // RevenueCat/store grace period — stay entitled
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
  'REFUND_REVERSED',
  'TEMPORARY_ENTITLEMENT_GRANT',
  'PRICE_INCREASE_CONSENT_REQUIRED',
  'PRICE_INCREASE_CONSENT_APPROVED',
  'PURCHASE_REDEEMED',
])

const INACTIVE_EVENT_TYPES = new Set(['CANCELLATION', 'EXPIRATION'])

// Event types that don't represent an entitlement change for a single
// subscriber (or that we don't have enough info to act on) — acknowledge
// and ignore.
const IGNORED_EVENT_TYPES = new Set([
  'TRANSFER',
  'INVOICE_ISSUANCE',
  'VIRTUAL_CURRENCY_TRANSACTION',
  'EXPERIMENT_ENROLLMENT',
  'SUBSCRIBER_ALIAS',
])

interface RevenueCatEvent {
  id: string
  type: string
  app_user_id: string
  product_id?: string
  store?: string
  expiration_at_ms?: number | null
}

export async function POST(req: NextRequest) {
  const expectedAuth = process.env.REVENUECAT_WEBHOOK_SECRET
  if (!expectedAuth) {
    console.error('[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET is not set — refusing all events')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const event: RevenueCatEvent | undefined = body?.event
  if (!event?.app_user_id || !event?.type) {
    return NextResponse.json({ error: 'Malformed event' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  // field_conditions_webhook_events is How's the Field's own idempotency
  // table — this Supabase project also hosts Fill My Roster, which has its
  // own separate revenuecat_events table for its own RevenueCat
  // integration. The two apps' data should not intermingle, so each keeps
  // its own dedupe log even though the underlying mechanism is identical.
  const { error: dedupeError } = await admin
    .from('field_conditions_webhook_events')
    .insert({ event_id: event.id, event_type: event.type })

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      // Already processed this exact event — RevenueCat retried delivery.
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('[revenuecat-webhook] failed to record event for idempotency', dedupeError)
    // Fall through and process anyway — better to risk a rare double-process
    // (harmless here, it's just re-setting the same fields) than to drop
    // a legitimate event because the dedupe write itself failed.
  }

  if (IGNORED_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (!ACTIVE_EVENT_TYPES.has(event.type) && !INACTIVE_EVENT_TYPES.has(event.type)) {
    // Unknown/new event type we haven't classified — log it so we notice,
    // but don't silently flip anyone's entitlement based on a guess.
    console.warn('[revenuecat-webhook] unclassified event type', event.type)
    return NextResponse.json({ ok: true, unclassified: true })
  }

  let isPremium = ACTIVE_EVENT_TYPES.has(event.type)

  // Cross-check against the expiration timestamp when one is present — a
  // "positive" event that RevenueCat sent for an already-expired period
  // (can happen with delayed delivery/retries) shouldn't re-activate someone.
  if (isPremium && event.expiration_at_ms != null && event.expiration_at_ms < Date.now()) {
    isPremium = false
  }

  // app_user_id is the Supabase user id — set via Purchases.logIn(user.id)
  // on the client the moment someone signs in, so this always lines up
  // with a profiles row (if that hasn't happened yet, there's nothing to
  // update and we just no-op rather than error the webhook).
  const { error } = await admin
    .from('profiles')
    .update({
      is_premium: isPremium,
      premium_platform: event.store ?? null,
      premium_product_id: event.product_id ?? null,
      premium_expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
      premium_updated_at: new Date().toISOString(),
    })
    .eq('id', event.app_user_id)

  if (error) {
    console.error('[revenuecat-webhook] failed to update profile', event.app_user_id, error)
    // Still 200 — RevenueCat retries on non-2xx, and this is almost always
    // a user who hasn't finished onboarding yet, not a real failure.
  }

  return NextResponse.json({ ok: true })
}
