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
  /** RevenueCat's current offering (packages available to purchase). Null on web or before it loads. */
  offering: PurchasesOffering | null
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
  const [nativeLoading, setNativeLoading] = useState(Capacitor.isNativePlatform())
  const [profileIsPremium, setProfileIsPremium] = useState<boolean | null>(null)
  const configuredForUserId = useRef<string | null>(null)

  // Keep our own copy in sync with AuthProvider's profile (it already
  // selects '*', so is_premium rides along), but also allow refresh()
  // below to poll Supabase directly right after a purchase.
  useEffect(() => {
    setProfileIsPremium(profile?.is_premium ?? null)
  }, [profile?.is_premium])

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) {
      setNativeLoading(false)
      return
    }

    let cancelled = false

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
          if (!cancelled) setNativeLoading(false)
          return
        }

        if (configuredForUserId.current === null) {
          await Purchases.configure({ apiKey, appUserID: user.id })
          configuredForUserId.current = user.id
        } else if (configuredForUserId.current !== user.id) {
          await Purchases.logIn({ appUserID: user.id })
          configuredForUserId.current = user.id
        }

        const [{ customerInfo }, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings().catch(() => null),
        ])

        if (cancelled) return
        setNativeEntitlementActive(!!customerInfo.entitlements.active[ENTITLEMENT_ID])
        setOffering(offerings?.current ?? null)
      } catch (err) {
        console.error('[premium] RevenueCat init failed', err)
      } finally {
        if (!cancelled) setNativeLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  // Signed out — clear the native session so the next sign-in (possibly a
  // different account on a shared device) doesn't inherit this one's entitlement.
  useEffect(() => {
    if (user || !Capacitor.isNativePlatform() || configuredForUserId.current === null) return
    ;(async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor')
        await Purchases.logOut()
      } catch {
        // not configured yet / already logged out — fine
      }
      configuredForUserId.current = null
      setNativeEntitlementActive(null)
      setOffering(null)
    })()
  }, [user])

  const refresh = useCallback(async () => {
    if (user) {
      const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle()
      if (data) setProfileIsPremium(data.is_premium)
    }
    if (Capacitor.isNativePlatform() && configuredForUserId.current) {
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
