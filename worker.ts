/**
 * Custom Cloudflare Worker entry that wraps OpenNext's generated worker so
 * we can add a `scheduled` handler (Cron Trigger) for the lightning-watch
 * push-notification job, without OpenNext knowing anything about it —
 * OpenNext's own request-handling path (app/api/** routes) has no hook for
 * background/cron work, so this file sits in front of it as the actual
 * `main` the Worker runtime loads (see wrangler.jsonc).
 *
 * Everything else (page requests, API routes, static assets) is passed
 * straight through to OpenNext's own `fetch` handler unchanged.
 */
import openNextWorker, { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
import { runLightningWatchJob } from './lib/lightning-watch-job'

// Re-exported so nothing that binds these Durable Objects in wrangler.jsonc
// later silently breaks — currently unused/unbound in this project, but
// OpenNext generates them and a custom `main` entry must forward them.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge }

type Env = Record<string, unknown>

/**
 * Raw Worker `scheduled(event, env, ctx)` handlers get config via the `env`
 * parameter, NOT `process.env` — `process.env` is an OpenNext-specific shim
 * that only exists during Next.js request handling. Shared lib code
 * (lib/geo.ts, lib/supabase-admin.ts, lib/lightning-check.ts, etc.) reads
 * `process.env.X` directly, so bridge every string-valued binding/var into
 * `process.env` first. Relies on the `nodejs_compat` compatibility flag
 * (already set in wrangler.jsonc) for a real `process` global to exist here.
 */
function bridgeEnvToProcessEnv(env: Env) {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      process.env[key] = value
    }
  }
}

export default {
  ...openNextWorker,
  async scheduled(event: unknown, env: Env, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    bridgeEnvToProcessEnv(env)
    ctx.waitUntil(runLightningWatchJob())
  },
}
