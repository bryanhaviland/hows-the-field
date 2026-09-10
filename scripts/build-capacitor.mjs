#!/usr/bin/env node
// Builds the static bundle used by the native (Capacitor) app.
//
// The app's API routes (app/api/**) only run on the live server (Cloudflare
// via OpenNext) — the native app calls those same routes over the network
// at https://howsthefield.com/api/... (see the absolute fetch() calls in
// LightningMonitor, RainForecastStrip, SubmitComplexForm) instead of
// shipping its own copy. Next.js's static export (`output: 'export'`)
// can't include server Route Handlers at all, so this script temporarily
// moves app/api completely outside the app/ directory (Next's App Router
// scans for route.ts anywhere under app/, so renaming it in place isn't
// enough), runs the export build, then restores it — even if the build
// fails.
import { existsSync, renameSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const API_DIR = 'app/api'
const API_BACKUP = '.api-build-backup'

function restore() {
  if (existsSync(API_BACKUP)) {
    renameSync(API_BACKUP, API_DIR)
    console.log('Restored app/api')
  }
}

// In case a previous run crashed before restoring.
if (existsSync(API_BACKUP) && !existsSync(API_DIR)) {
  console.log('Found leftover backup from a previous run — restoring first.')
  restore()
}

if (!existsSync(API_DIR)) {
  console.error(`Expected ${API_DIR} to exist — aborting.`)
  process.exit(1)
}

renameSync(API_DIR, API_BACKUP)
console.log('Moved app/api outside app/ for the static export build.')

let result
try {
  result = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, CAP_BUILD: '1' },
  })
} finally {
  restore()
}

if (!result || result.status !== 0) {
  console.error('Capacitor build failed.')
  process.exit(result?.status ?? 1)
}

console.log('Static export complete → out/')
