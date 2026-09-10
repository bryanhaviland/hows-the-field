-- How's the Field's own RevenueCat webhook idempotency table.
-- Kept separate from the pre-existing public.revenuecat_events table,
-- which belongs to Fill My Roster's RevenueCat integration — this
-- Supabase project ("Off the Bench") hosts two independent apps and
-- their data should not intermingle.
create table if not exists public.field_conditions_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

comment on table public.field_conditions_webhook_events is
  'RevenueCat webhook event idempotency log for How''s the Field only. Do not share with Fill My Roster''s revenuecat_events table.';

alter table public.field_conditions_webhook_events enable row level security;
-- No policies — service-role only, same pattern as lightning_cache / rain_forecast_cache.
