-- Web checkout for the Premium ("Field Conditions") entitlement, via
-- Stripe — the native apps use RevenueCat (App Store/Play Store IAP);
-- the website has no equivalent, so web visitors could never actually
-- subscribe (see PremiumPaywall.tsx's old "open the app to subscribe"
-- message). This adds Stripe as a second entitlement source feeding the
-- same premium_* columns migration 0001 already added to `profiles`.
--
-- Reuses field_conditions_webhook_events (added in migration 0002) as
-- the idempotency log for Stripe webhook events too, alongside
-- RevenueCat's — it's already a generic (event_id, event_type,
-- processed_at) dedupe table scoped to this app, not RevenueCat-specific
-- by name, and Fill My Roster (the sibling app in this Supabase project)
-- has its own separate stripe_events table, so there's no cross-app
-- collision risk in sharing one dedupe table across How's the Field's
-- own two webhook providers.
alter table profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_customer_id_idx
  on profiles (stripe_customer_id)
  where stripe_customer_id is not null;
