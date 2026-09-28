'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import type { PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

// The entitlement identifier configured in the RevenueCat dashboard for
// this feature. Matches the "Premium" entitlement wired to the App
// Store / Play Store subscription products — see SETUP_PREMIUM.md.
const ENTITLEMENT_ID = 'premium'

interface PremiumContextValue {
  /** True if the signed-in user should see premium content, right now. */
  isPremium: boolean
  /** Still figuring out entitlement status — avoid flashing a paywall before this resolves. */
  loading: boolean
  /** RevenueCat's current offering (packages available to purchase). Null on web, before it loads, or on failure. */
  offering: PurchasesOffering | null
  /** True once offerings have failed to load (or came back empty) — lets the UI stop claiming to be "loading" and offer a retry instead. */
  offeringsError: boolean
  /** Re-fetches offerings after a failure. Safe to call repeatedly (e.g. from a "Try again" button). */
  retryOfferings: () => void
  purchase: (pkg: PurchasesPackage) => Promise<{ error: string | null }>
  restore: () => Promise<{ error: string | null }>
  /** Re-checks entitlement from Supabase — call after a purchase in case the webhook needs a moment. */
  refresh: () => Promise<void>
}

const PremiumContext = createContext<PremiumContextValue | null>(null)

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [nativeEntitlementActive, setNativeEntitlementActive] = useState<boolean | null>(null)
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [offeringsError, setOfferingsError] = useState(false)
  const [nativeLoading, setNativeLoading] = useState(Capacitor.isNativePlatform())
  const [profileIsPremium, setProfileIsPremium] = useState<boolean | null>(null)
  // Which Supabase user id (if any) RevenueCat is currently logged in as. Null
  // means RevenueCat is running anonymously (device-identified only) — that's
  // the default and normal state for a purchaser who hasn't created an account.
  const configuredForUserId = useRef<string | null>(null)
  const initialized = useRef(false)

  // Keep our own copy in sync with AuthProvider's profile (it already
  // selects '*', so is_premium rides along), but also allow refresh()
  // below to poll Supabase directly right after a purchase.
  useEffect(() => {
    setProfileIsPremium(profile?.is_premium ?? null)
  }, [profile?.is_premium])

  // Fetches (or re-fetches) RevenueCat's current offering. Split out from the
  // init effect below so a failed/empty load — which previously left the
  // paywall stuck on "Loading subscription options…" forever (App Review
  // Guideline 2.1(b), Sep 2026) — can be retried from the UI instead of
  // silently swallowed.
  const loadOfferings = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return
    setOfferingsError(false)
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const offerings = await Purchases.getOfferings()
      const current = offerings.current
      if (current && current.availablePackages.length > 0) {
        setOffering(current)
      } else {
        console.warn('[premium] RevenueCat returned no current offering with packages')
        setOffering(null)
        setOfferingsError(true)
      }
    } catch (err) {
      console.error('[premium] Failed to load offerings', err)
      setOffering(null)
      setOfferingsError(true)
    }
  }, [])

  // Configure RevenueCat as soon as we're on a native platform — independent of
  // whether a How's the Field account exists. App Review guideline 5.1.1(v):
  // purchases must be possible without requiring registration first. With no
  // appUserID, RevenueCat generates and persists its own anonymous id for this
  // device, which is enough to unlock the purchase immediately.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || initialized.current) return
    initialized.current = true

    let cancelled = false
    let configured = false

    ;(async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const platform = Capacitor.getPlatform()
        const apiKey =
          platform === 'ios'
            ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY
            : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY

        if (!apiKey) {
          console.warn('[premium] No RevenueCat API key configured for platform', platform)
          return
        }

        await Purchases.configure({ apiKey })
        configured = true

        const { customerInfo } = await Purchases.getCustomerInfo()
        if (cancelled) return
        setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
      } catch (err) {
        console.error('[premium] RevenueCat init failed', err)
      } finally {
        if (!cancelled) setNativeLoading(false)
      }

      // Only attempt offerings once RevenueCat is actually configured — and
      // don't let a slow/failed offerings fetch hold up nativeLoading, which
      // gates entitlement checks elsewhere in the app.
      if (configured && !cancelled) loadOfferings()
    })()

    return () => {
      cancelled = true
    }
  }, [loadOfferings])

  // Signed in (including signing up right after an anonymous purchase) — link this
  // device's RevenueCat identity to the Supabase account, so a subscription bought
  // anonymously carries forward to other devices and the web, as Apple requires we
  // offer (optionally, never as a purchase prerequisite).
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !initialized.current || !user) return
    if (configuredForUserId.current === user.id) return

    let cancelled = false

    ;(async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const { customerInfo } = await Purchases.logIn({ appUserID: user.id })
        if (cancelled) return
        configuredForUserId.current = user.id
        setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
      } catch (err) {
        console.error('[premium] RevenueCat logIn failed', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  // Signed out — log back out to an anonymous RevenueCat identity so the next
  // sign-in (possibly a different account on a shared device) doesn't inherit
  // this one's entitlement.
  useEffect(() => {
    if (user || !Capacitor.isNativePlatform() || configuredForUserId.current === null) return
    ;(async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const { customerInfo } = await Purchases.logOut()
        setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
      } catch {
        // not configured yet / already logged out — fine
      }
      configuredForUserId.current = null
    })()
  }, [user])

  const refresh = useCallback(async () => {
    if (user) {
      const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle()
      if (data) setProfileIsPremium(data.is_premium)
    }
    if (Capacitor.isNativePlatform() && initialized.current) {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        const { customerInfo } = await Purchases.getCustomerInfo()
        setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
      } catch {
        // ignore — profile check above is the fallback source of truth
      }
    }
  }, [user])

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    if (!Capacitor.isNativePlatform()) {
      return { error: 'Purchases can only be made from the app.' }
    }
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
      // The webhook updates Supabase within moments, not instantly — check
      // a couple times so cross-device/web views pick it up soon too.
      setTimeout(refresh, 2000)
      setTimeout(refresh, 6000)
      return { error: null }
    } catch (err: unknown) {
      const userCancelled = (err as { userCancelled?: boolean })?.userCancelled
      if (userCancelled) return { error: null }
      console.error('[premium] purchase failed', err)
      return { error: 'That purchase could not be completed. Please try again.' }
    }
  }, [refresh])

  const restore = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return { error: 'Restoring purchases is only available in the app.' }
    }
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      const { customerInfo } = await Purchases.restorePurchases()
      setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
      setTimeout(refresh, 2000)
      return { error: null }
    } catch (err) {
      console.error('[premium] restore failed', err)
      return { error: "Couldn't restore purchases — try again in a moment." }
    }
  }, [refresh])

  const isPremium = nativeEntitlementActive === true || profileIsPremium === true

  const value: PremiumContextValue = {
    isPremium,
    loading: nativeLoading,
    offering,
    offeringsError,
    retryOfferings: loadOfferings,
    purchase,
    restore,
    refresh,
  }

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
}

export function usePremium() {
  const ctx = useContext(PremiumContext)
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider')
  return ctx
}
