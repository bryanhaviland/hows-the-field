import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { stripe, premiumPriceId } from '@/lib/stripe'
import { corsJson, corsPreflight } from '@/lib/cors'

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

/**
 * Creates a Stripe Checkout Session for the $2.99/mo Premium subscription,
 * for web visitors who don't have the app (see PremiumPaywall.tsx). Native
 * users still subscribe via RevenueCat/App Store/Play Store IAP — this is
 * the web-only path, feeding the same profiles.is_premium entitlement via
 * app/api/premium/stripe-webhook/route.ts.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return corsJson(req, { error: 'Log in to subscribe.' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return corsJson(req, { error: 'Your session has expired — log in again.' }, { status: 401 })
  }
  const user = userData.user

  const body = await req.json().catch(() => ({}))
  const returnTo: string =
    typeof body?.returnTo === 'string' && body.returnTo.startsWith('/') ? body.returnTo : '/'

  const { data: profileRow } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  const client = stripe()
  let customerId = profileRow?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await client.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const separator = returnTo.includes('?') ? '&' : '?'
  let session
  try {
    session = await client.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: premiumPriceId(), quantity: 1 }],
      success_url: `https://howsthefield.com${returnTo}${separator}checkout=success`,
      cancel_url: `https://howsthefield.com${returnTo}${separator}checkout=cancelled`,
      client_reference_id: user.id,
      subscription_data: { metadata: { supabase_user_id: user.id } },
    })
  } catch (err) {
    console.error('[stripe-checkout] failed to create checkout session', err)
    return corsJson(req, { error: 'Could not start checkout — try again.' }, { status: 500 })
  }

  if (!session.url) {
    return corsJson(req, { error: 'Could not start checkout — try again.' }, { status: 500 })
  }

  return corsJson(req, { url: session.url })
}
