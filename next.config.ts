import type { NextConfig } from 'next'

// CAP_BUILD=1 triggers the static-export build used to bundle the native
// (Capacitor) app — see scripts/build-capacitor.mjs. The regular `next build`
// used for the live website (via OpenNext/Cloudflare) is unaffected.
const isCapacitorBuild = process.env.CAP_BUILD === '1'

const nextConfig: NextConfig = {
  ...(isCapacitorBuild
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
}

export default nextConfig
