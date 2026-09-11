import Stripe from 'stripe'

/**
 * Server-only Stripe client — never import from a 'use client' component.
 * Powers the web checkout/portal/webhook routes that let browser visitors
 * subscribe to Premium ("Field Conditions") without the app. The native
 * apps use RevenueCat (App Store / Play Store IAP) instead — see
 * lib/premium-context.tsx and SETUP_PREMIUM.md. The API version is pinned
 * so a Stripe-side default bump can't silently change response shapes here.
 */
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY env var')
  }
  return new Stripe(key, { apiVersion: '2026-08-26.dahlia' })
}

/** Stripe Price id for the $2.99/mo Premium subscription (see SETUP_PREMIUM.md). */
export function premiumPriceId(): string {
  const id = process.env.STRIPE_PREMIUM_PRICE_ID
  if (!id) {
    throw new Error('Missing STRIPE_PREMIUM_PRICE_ID env var')
  }
  return id
}
