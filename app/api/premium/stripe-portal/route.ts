import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'
import { corsJson, corsPreflight } from '@/lib/cors'

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

/**
 * Billing Portal session for self-service management (update card, cancel,
 * view invoices) of the web Stripe subscription — the "Manage Subscription"
 * link in AccountMenu.tsx, shown only when premium_platform === 'stripe'
 * (native subscribers manage theirs via the App Store / Play Store instead).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return corsJson(req, { error: 'Log in to manage your subscription.' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return corsJson(req, { error: 'Your session has expired — log in again.' }, { status: 401 })
  }

  const { data: profileRow } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (!profileRow?.stripe_customer_id) {
    return corsJson(req, { error: 'No Stripe subscription found for this account.' }, { status: 404 })
  }

  let session
  try {
    session = await stripe().billingPortal.sessions.create({
      customer: profileRow.stripe_customer_id,
      return_url: 'https://howsthefield.com/',
    })
  } catch (err) {
    console.error('[stripe-portal] failed to create billing portal session', err)
    return corsJson(req, { error: 'Could not open the billing portal — try again.' }, { status: 500 })
  }

  return corsJson(req, { url: session.url })
}
