# Field Conditions (Premium) — Handover

**Date:** 2026-09-04
**Repo:** Hows The Field (`/Users/bryanhaviland/Claude/Projects/Hows The Field`)
**Supabase project:** "Off the Bench" (`oumcxrsxrabailncfipb`) — shared with Fill My Roster, see Data Isolation below
**Cloudflare Worker:** `hows-the-field` → `howsthefield.com` / `www.howsthefield.com`

Everything below is current as of today. `SETUP_PREMIUM.md` in the repo root has the same information in checklist form and will keep getting updated — treat this doc as the one-time narrative snapshot, that one as the living reference.

---

## What shipped

A premium, subscription-gated "Today at the Field" panel on each complex page:

- **Field Conditions** check-in: Dry / Dusty / Muddy / Perfect
- **Parking**: Crowded / Lots of Space
- **Games Are**: On Time / Ahead of Schedule / Running Behind
- **Rain forecast** strip (Open-Meteo, free, no key)
- **Lightning monitor**: time + distance of the last strike, storm-adaptive polling (Xweather)

Crowdsourced from any premium subscriber, same trust model as the existing reviews feature. Gated by `PremiumGate`/`PremiumPaywall`, billed natively via RevenueCat (App Store / Play Store IAP, not Stripe — required since this ships as a native app via Capacitor).

Code is complete, `tsc --noEmit` and `npm run build` both clean, and it's deployed to production.

---

## Current status

**Live and working:**
- Database schema applied to the real "Off the Bench" project (migrations `0001`–`0003`)
- RevenueCat project "How's the Field" created — entitlement `premium`, `default` offering (Test Store products only, see below), webhook wired to `/api/premium/revenuecat-webhook`
- All 4 production secrets set on the correct Cloudflare Worker (`SUPABASE_SERVICE_ROLE_KEY`, `XWEATHER_CLIENT_ID`, `XWEATHER_CLIENT_SECRET`, `REVENUECAT_WEBHOOK_SECRET`) — confirmed via `wrangler secret list --name hows-the-field`
- Site deployed and live on both custom domains
- Xweather account connected — lightning data should be flowing on real requests
- Cost tracking in place (see below)
- Demo/reviewer login created (see below)

**Not done yet — all on your side, no code needed:**
1. App Store Connect: subscription group + product (e.g. `htf_premium_monthly`), plus an In-App Purchase API key (Key ID / Issuer ID / `.p8`) to attach to RevenueCat
2. Google Play Console: matching subscription product, plus a service account JSON to attach to RevenueCat
3. Once both are attached in RevenueCat, grab the real `NEXT_PUBLIC_REVENUECAT_IOS_API_KEY` / `NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY` and put them in `.env.local` + `.env.production` (these two are public/safe to commit — unlike everything else in that file)
4. `npx cap sync ios android`
5. Xcode: add the In-App Purchase capability under Signing & Capabilities
6. Rebuild and resubmit both native apps

The RevenueCat offering currently sells **Test Store** products only (RevenueCat's built-in sandbox) — fine for testing the purchase flow end-to-end right now, but real store products need step 1–2 above before this can go live for real users.

---

## Deploying

Web/design/content changes **do not** need an app-store resubmission — the native shell (`capacitor.config.ts`) just loads `https://howsthefield.com` live. To push a change:

```
npm run cf:deploy
```

Only native-shell changes (icon, splash screen, permissions, the RevenueCat SDK itself, IAP config) need the full `cap sync` → Xcode/Android Studio → resubmit cycle.

---

## Demo / reviewer login

For App Store / Play Store review notes, or your own testing without a real purchase:

- **Email:** `demo@howsthefield.com`
- **Password:** `phNGuHq9f3By4M2ikTOP`

`is_premium` is set directly in the database with an expiry of 2099 — it never lapses and doesn't touch RevenueCat or your Xweather quota. Logs in through the normal sign-in screen, no special flow.

---

## Watching Xweather costs

Free tier is 15,000 accesses/month, but the lightning endpoint carries a **10x cost multiplier** — effectively 1,500 real lightning calls/month before billing kicks in (automatic pay-as-you-go, no manual plan upgrade). The caching (10 min baseline poll per location, shared across every viewer, down to 60s only during an active storm) is what keeps this in check.

Every real (non-cached) Xweather call is logged to `xweather_usage_log`, rolled up in the `xweather_usage_monthly` view. I built a small tracker you can check anytime:

**[Lightning Meter](https://claude.ai/code/artifact/651ae214-9b14-441c-a0e7-f470c1ef4512)** — shows this month's billable accesses against the 15,000 free limit, real call count, and estimated cost. It doesn't poll Supabase live (browser can't reach it directly) — ask me to "check Xweather usage" anytime and I'll push fresh numbers into it.

---

## Data isolation (Off the Bench is shared with Fill My Roster)

You flagged partway through that this Supabase project hosts two separate apps and they shouldn't intermingle. Audited and fixed:

- Every table this feature added is its own and untouched by Fill My Roster: `field_condition_checkins`, `lightning_cache`, `rain_forecast_cache`, `xweather_usage_log`, `field_conditions_webhook_events` (its own RevenueCat webhook idempotency log — originally shared Fill My Roster's `revenuecat_events` table, split out once flagged)
- `profiles` (holding the new `is_premium`/`premium_*` columns) is technically project-wide, but confirmed via foreign-key inspection that Fill My Roster's `teams`/`players` tables don't reference it at all — in practice it's How's the Field-exclusive today
- `auth.users` is inherently shared (one Supabase Auth per project) — already handled by the `htf_signup` metadata flag in `lib/auth-context.tsx`, which keeps a Fill My Roster account from being treated as a How's the Field account and vice versa

---

## Infrastructure landmine fixed

Cloudflare deploys were silently targeting the wrong Worker (`bryanhaviland`, an unrelated personal project) instead of `hows-the-field` — a stray `/Users/bryanhaviland/wrangler.jsonc` sitting at your home folder root was winning over this project's `wrangler.toml` whenever wrangler walked up the directory tree. Fixed by converting this project to `wrangler.jsonc` (wrangler.toml kept as `.bak`) and fixing the hardcoded `--config ./wrangler.toml` reference in `.github/workflows/deploy.yml`. Re-verified everything landed on the right Worker with `--name hows-the-field` explicitly before trusting it.

Worth doing on your own time: that stray `~/wrangler.jsonc` is still sitting there and is a landmine for any *future* project without its own `.jsonc` yet. Move it into whatever project it belongs to, or delete it if it's an orphan.

---

## Key files

| Purpose | Path |
|---|---|
| Living setup checklist | `SETUP_PREMIUM.md` |
| DB schema | `supabase/migrations/0001_premium_field_conditions.sql`, `0002_field_conditions_webhook_isolation.sql`, `0003_xweather_usage_tracking.sql` |
| Purchase/entitlement state | `lib/premium-context.tsx` |
| RevenueCat webhook | `app/api/premium/revenuecat-webhook/route.ts` |
| Lightning API (cached, adaptive TTL) | `app/api/conditions/lightning/route.ts` |
| Rain API (cached) | `app/api/conditions/rain/route.ts` |
| Cost logging | `lib/xweather-usage.ts` |
| Main UI | `components/FieldConditionsPanel.tsx` (wired into `app/complex/[id]/page.tsx`) |
| Cloudflare config | `wrangler.jsonc` |

---

## Secrets reference (values, not just names)

Already set — recorded here so they're not lost, not because you need to re-enter them anywhere:

| Secret | Where it lives |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (gitignored) + Cloudflare (`wrangler secret`) |
| `XWEATHER_CLIENT_ID` / `_SECRET` | `.env.local` + Cloudflare |
| `REVENUECAT_WEBHOOK_SECRET` | `.env.local` + Cloudflare |
| `NEXT_PUBLIC_REVENUECAT_IOS/ANDROID_API_KEY` | still blank — pending steps 1–3 above |

`.env.production` is git-tracked, so nothing server-only ever goes there — only the two `NEXT_PUBLIC_*` RevenueCat keys once you have them.
