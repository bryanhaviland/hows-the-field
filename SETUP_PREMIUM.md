# Field Conditions (Premium) — Setup Checklist

Everything the code needs is written. Progress so far (2026-09-04):

- [x] RevenueCat project "How's the Field" created, entitlement named
      `premium` (matches the code), a `default` offering scaffolded with
      Test Store Monthly/Yearly/Lifetime placeholder products, and the
      Supabase webhook wired up and pointed at
      `https://howsthefield.com/api/premium/revenuecat-webhook` — its
      secret is already in `.env.local`/`.env.production` as
      `REVENUECAT_WEBHOOK_SECRET`. A Test Store API key is available on
      the RevenueCat Apps page for local testing before real store
      products exist.
- [x] Database migration applied directly via the Supabase MCP connection
      to the actual project this app uses — **"Off the Bench"**
      (`oumcxrsxrabailncfipb`), a Supabase project shared with your Fill
      My Roster app. Since the two apps must stay separate, every table
      Field Conditions added is its own: `field_condition_checkins`,
      `lightning_cache`, `rain_forecast_cache`, and its own webhook
      idempotency log `field_conditions_webhook_events` (migration
      `0002_field_conditions_webhook_isolation.sql`) — none of these are
      shared with Fill My Roster's `revenuecat_events`/`stripe_events`/
      `teams`/`players` tables. The only genuinely shared things are the
      `profiles` table (which Fill My Roster doesn't touch — confirmed via
      schema inspection, so the added `is_premium`/`premium_*` columns are
      effectively Field-Conditions-only) and Supabase Auth's `auth.users`
      (inherent to sharing one project — the app already has separate
      sign-up/sign-in gating per app, see `lib/auth-context.tsx`).
- [ ] Everything below that needs your App Store Connect / Play Console
      accounts, or a dashboard-only secret (service role key) — I don't
      have access to those, so this part is yours.

What's left: App Store Connect + Play Console subscription products,
an Xweather API key, the Supabase service-role key, and the Cloudflare
secrets. Mostly waiting on App Store Connect / Play Console screens now
that the database side is done.

## 1. Database — Supabase

Already done — the migration (`supabase/migrations/0001_premium_field_conditions.sql`,
kept in the repo for the record) is applied to the live project. All
that's left:

1. Open the **"Off the Bench"** Supabase project → **Project Settings →
   API** and copy the **service_role** key (not the anon key — this one
   bypasses row-level security, so treat it like a password). This key
   isn't retrievable through the MCP connection on purpose.
2. Put it in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` for local dev,
   and see step 5 for production.

## 2. Lightning data — Xweather (formerly AerisWeather)

1. Sign up at https://www.xweather.com — the free tier (15,000
   requests/month, all endpoints including lightning) is plenty here: the
   server-side cache means Xweather only gets hit on the adaptive
   schedule the code already implements (10 min baseline -> 60 sec during
   an active storm), shared across every visitor looking at that field,
   not once per phone.
2. From your dashboard, grab the **Client ID** and **Client Secret**.
3. Add both to `.env.local` (`XWEATHER_CLIENT_ID`, `XWEATHER_CLIENT_SECRET`)
   and to production (step 5).

## 3. Subscriptions — RevenueCat + App Store + Play Store

This is the part with the most steps, because Apple/Google each need
their own subscription product before RevenueCat can sell it.

### 3a. Create the subscription products

- **App Store Connect** -> your app -> Subscriptions -> create a
  subscription group (e.g. "Premium") -> add a product (e.g.
  `htf_premium_monthly`). Requires an active Paid Apps Agreement.
- **Google Play Console** -> your app -> Monetize -> Subscriptions ->
  create a matching product.

Price them the same on both — RevenueCat doesn't sync pricing across
stores for you.

### 3b. RevenueCat project

Already done: the project exists, category Sports, platform
Capacitor. The entitlement is named exactly `premium` (the code checks
for this identifier — `lib/premium-context.tsx`), and a `default`
offering exists with Monthly/Yearly/Lifetime packages — but right now
those packages are RevenueCat **Test Store** products, not real App
Store/Play Store products, because that requires 3a to be done first.

Once you've created the real products in 3a:

1. **Apps (left nav) -> New app configuration -> App Store**: app name
   is fine as suggested, Bundle ID is `com.howsthefield.app`. It will
   ask for an **In-App Purchase key** — generate one in App Store
   Connect (Users and Access -> Integrations -> In-App Purchase keys),
   which gives you a Key ID, Issuer ID, and a `.p8` file to upload here.
2. **Apps -> New app configuration -> Google Play Store**: app name
   fine as suggested, package name `com.howsthefield.app`. It'll ask for
   a Google Play **service account JSON** — create one in Google Cloud
   Console linked to your Play Console account (RevenueCat's own guide
   walks through the exact IAM roles needed).
3. Once both app configs save successfully, go to **Product catalog ->
   Products -> New product** and add the real App Store/Play Store
   product identifiers from 3a, attach each to the `premium`
   entitlement, then swap them into the `default` offering's packages
   (replacing/alongside the Test Store ones).
4. **Project settings -> API keys** -> copy the iOS and Android *public*
   API keys into `.env.local`/`.env.production` as
   `NEXT_PUBLIC_REVENUECAT_IOS_API_KEY` / `NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY`
   (these only exist once step 1/2 above are saved). These are meant to
   ship inside the app bundle — not a secret like the others.

### 3c. Webhook — already done

The webhook ("Supabase premium sync") is created in RevenueCat, pointed
at `https://howsthefield.com/api/premium/revenuecat-webhook`, sending
both Production and Sandbox events. Its secret is already saved in
`.env.local`/`.env.production` as `REVENUECAT_WEBHOOK_SECRET` — just
needs to also be set as a Cloudflare secret before deploying (step 5).

Without this webhook, purchases go through in the App/Play Store but
`profiles.is_premium` never flips — the app checks RevenueCat directly
too (instant, on-device), but the webhook is what makes premium status
show up on the website and on a second device.

## 4. Native app changes

1. `npm install` (already adds `@revenuecat/purchases-capacitor`).
2. `npx cap sync ios android` — pulls the plugin into both native
   projects.
3. **Xcode**: select the app target -> Signing & Capabilities -> add
   **In-App Purchase**.
4. **Android**: no extra capability needed — Play Billing comes with the
   RevenueCat SDK — but you do need the app's Play Console listing to
   have the subscription product attached (done in 3a).
5. Rebuild and resubmit both apps.

## 5. Production secrets (Cloudflare)

This app deploys to Cloudflare Workers via OpenNext. Two different
mechanisms handle env vars there — easy to trip over:

- **`NEXT_PUBLIC_*` vars** (the RevenueCat public keys) get baked into
  the JS bundle at build time — put them in `.env.production` (already
  done, values still empty — fill them in) and they're picked up by
  `npm run cf:build`.
- **Everything else** (`SUPABASE_SERVICE_ROLE_KEY`, `XWEATHER_CLIENT_ID`,
  `XWEATHER_CLIENT_SECRET`, `REVENUECAT_WEBHOOK_SECRET`) is read at
  *runtime* by the deployed Worker, not build time — `.env.production`
  doesn't reach it. Set each one with:

  ```
  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  npx wrangler secret put XWEATHER_CLIENT_ID
  npx wrangler secret put XWEATHER_CLIENT_SECRET
  npx wrangler secret put REVENUECAT_WEBHOOK_SECRET
  ```

  (each prompts for the value, then stores it against the
  `hows-the-field` Worker — one-time, survives future deploys).

**Production secrets — done (2026-09-04)**: all four confirmed live on the
`hows-the-field` Worker via `npx wrangler secret list --name hows-the-field`:
`SUPABASE_SERVICE_ROLE_KEY`, `XWEATHER_CLIENT_ID`, `XWEATHER_CLIENT_SECRET`,
`REVENUECAT_WEBHOOK_SECRET`.

**Wrangler config bug found and fixed (2026-09-04):** a stray
`/Users/bryanhaviland/wrangler.jsonc` sitting directly in Bryan's home
folder (orphaned from an unrelated personal "bryanhaviland" Worker) was
silently winning over this project's own `wrangler.toml` — every
`wrangler secret put` and the first `cf:deploy` attempt actually targeted
the wrong Worker (`bryanhaviland`), and the deploy failed outright trying
to upload assets from `/Users/bryanhaviland/another-round-with-the-bryans`.
Root cause: wrangler's config search appears to prefer `.jsonc` over
`.toml` even across directory levels, and this project was the only one
of Bryan's still on `.toml` (his others already use `.jsonc`). Fixed by
converting this project to `wrangler.jsonc` (same settings) and retiring
`wrangler.toml` → `wrangler.toml.bak`; also updated
`.github/workflows/deploy.yml` which had `--config ./wrangler.toml`
hardcoded. Re-verified with `--name hows-the-field` explicitly (don't
trust a bare `wrangler secret list`/`whoami` alone if this ever recurs —
they resolved to the wrong worker just as silently). First correct
`npm run cf:deploy` succeeded same day, live on howsthefield.com and
www.howsthefield.com.

## 5b. Watching Xweather costs

Every real (non-cached) call to Xweather is logged to
`xweather_usage_log`, with the lightning endpoint's 10x cost multiplier
already baked into a rollup view. Check it anytime in the Supabase SQL
editor:

```sql
select * from xweather_usage_monthly order by month desc;
```

`billable_accesses` already accounts for the 10x lightning multiplier;
`estimated_cost_usd` is `billable_accesses * $0.0006`, i.e. what you'd
owe past the free 15,000/month. Cache hits (the vast majority of
requests — that's the point of the caching) never touch this table, so
this is real paid-API usage only, not page views.

## 6. Testing before going live

- RevenueCat has a full sandbox mode — use an iOS Sandbox Apple ID and an
  Android license-tester account to buy the subscription for free and
  confirm `profiles.is_premium` flips (check the `profiles` table in
  Supabase directly, or just watch the paywall disappear in the app).
- To flip someone premium manually for testing without a real purchase:
  `update profiles set is_premium = true where id = '<their-user-id>';`
  in the Supabase SQL editor.
- Lightning/rain: both endpoints work with no signed-in user and no
  purchase — hit `/api/conditions/lightning?complexId=<id>` and
  `/api/conditions/rain?complexId=<id>` directly once the Xweather keys
  are set, to sanity-check them independent of the paywall.

## What needed no setup

- **Geocoding**: complexes don't have lat/lng yet — the API routes
  geocode from the address/city/state/zip the first time a complex is
  looked up (free, no key, US Census geocoder) and cache it on the row.
  Nothing to backfill manually.
- **Rain forecast**: Open-Meteo, no API key, generous free tier.
