'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Runs only inside the wrapped iOS/Android app (no-ops on the regular website).
 * Hides the native splash once the live page has actually painted, and sets the
 * status bar to match the site's light-green/blue brand instead of Capacitor's default.
 */
export default function NativeInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    ;(async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        await SplashScreen.hide()
      } catch {
        // splash plugin not available — nothing to do
      }
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#F0FDF4' })
      } catch {
        // status bar plugin not available (e.g. web) — nothing to do
      }
    })()
  }, [])

  return null
}
