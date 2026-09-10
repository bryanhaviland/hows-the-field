import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * "Remove my data" from the profile menu — required by App Store/Play Store
 * review guidelines: an account created in-app must be deletable in-app,
 * not just via a support request. This actually deletes the auth account
 * (not a soft "deactivate"). Reviews the user submitted stay on complexes
 * they helped document (that's the crowdsourced data other parents rely
 * on), but are stripped of anything tying them back to this person —
 * user_id cleared and is_anonymous set true — before the account itself,
 * their saved complexes, and their profile row are deleted.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: 'Log in to manage your account.' }, { status: 401 })
  }

  const admin = supabaseAdmin()
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'Your session has expired — log in again.' }, { status: 401 })
  }
  const userId = userData.user.id

  const { error: anonymizeErr } = await admin
    .from('reviews')
    .update({ user_id: null, is_anonymous: true })
    .eq('user_id', userId)
  if (anonymizeErr) {
    console.error('[account/delete] anonymize reviews failed', anonymizeErr)
    return NextResponse.json({ error: 'Something went wrong — try again.' }, { status: 500 })
  }

  await admin.from('saved_complexes').delete().eq('user_id', userId)
  await admin.from('profiles').delete().eq('id', userId)

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
  if (deleteErr) {
    console.error('[account/delete] deleteUser failed', deleteErr)
    return NextResponse.json({ error: 'Something went wrong — try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
