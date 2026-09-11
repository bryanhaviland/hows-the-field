import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

/**
 * Stripe's webhook for the web-only Premium subscription path. Mirrors
 * app/api/premium/revenuecat-webhook/route.ts (the native/App Store/Play
 * Store equivalent) exactly: same idempotency table, same profiles.* fields
 * updated, just a different upstream provider. Called server-to-server by
 * Stripe, so no CORS and no Bearer auth — the request is authenticated by
 * verifying the Stripe-Signature header against STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set — refusing all events')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const client = stripe()
  let event: Stripe.Event
  try {
    event = client.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = supabaseAdmin()

  // field_conditions_webhook_events is shared with the RevenueCat webhook
  // (see supabase/migrations/0017_stripe_premium.sql) — it's already a
  // generic, provider-agnostic dedupe log scoped to How's the Field alone.
  const { error: dedupeError } = await admin
    .from('field_conditions_webhook_events')
    .insert({ event_id: event.id, event_type: event.type })

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      // Already processed this exact event — Stripe retried delivery.
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('[stripe-webhook] failed to record event for idempotency', dedupeError)
    // Fall through and process anyway — same reasoning as the RevenueCat
    // webhook: a rare double-process here is harmless (it just re-sets the
    // same fields), losing a legitimate event because the dedupe write
    // itself failed is worse.
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const subscription = await client.subscriptions.retrieve(subscriptionId)
          await applySubscription(admin, subscription)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await applySubscription(admin, event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await applySubscription(admin, event.data.object as Stripe.Subscription, true)
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[stripe-webhook] failed to process event', event.type, err)
    // Still 200 — Stripe retries on non-2xx, and this is almost always a
    // transient Supabase hiccup, not something retrying the same event fixes.
  }

  return NextResponse.json({ ok: true })
}

async function applySubscription(
  admin: ReturnType<typeof supabaseAdmin>,
  subscription: Stripe.Subscription,
  forceInactive = false
) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const item = subscription.items.data[0]
  const isPremium = !forceInactive && (subscription.status === 'active' || subscription.status === 'trialing')
  const expiresAt = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null

  // Matched by stripe_customer_id, which app/api/premium/stripe-checkout
  // always sets on the profile *before* creating the Checkout Session that
  // leads to this customer having any subscription at all — so this should
  // always find a row.
  const { error, count } = await admin
    .from('profiles')
    .update(
      {
        is_premium: isPremium,
        premium_platform: 'stripe',
        premium_product_id: item?.price?.id ?? null,
        premium_expires_at: expiresAt,
        premium_updated_at: new Date().toISOString(),
        stripe_subscription_id: subscription.id,
      },
      { count: 'exact' }
    )
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[stripe-webhook] failed to update profile for customer', customerId, error)
  } else if (count === 0) {
    console.warn('[stripe-webhook] no profile found for stripe customer', customerId)
  }
}
