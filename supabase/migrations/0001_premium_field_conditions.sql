-- Premium "Field Conditions" feature
-- Adds: premium entitlement tracking on profiles, geocoding columns on
-- field_complexes, a crowdsourced check-in table (condition/parking/game
-- pace), a "current conditions" aggregation view, and server-only cache
-- tables for the lightning + rain-forecast lookups (populated by the
-- app/api/conditions/* routes using the service-role key — never queried
-- directly from the browser).

-- ── Premium entitlement (synced from RevenueCat via the webhook route) ──
alter table profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_platform text,               -- 'ios' | 'android' | 'promo' etc, whatever RevenueCat reports
  add column if not exists premium_product_id text,
  add column if not exists premium_expires_at timestamptz,
  add column if not exists premium_updated_at timestamptz;

-- ── Coordinates for weather/lightning lookups ──
-- Nullable — the API routes geocode from address/city/state/zip on first
-- request and backfill these columns, so existing complexes don't need a
-- manual data-entry pass.
alter table field_complexes
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

-- ── Crowdsourced "today at the field" check-ins ──
create table if not exists field_condition_checkins (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid not null references field_complexes(id) on delete cascade,
  field_id uuid references fields(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  field_condition text check (field_condition in ('dry', 'dusty', 'muddy', 'perfect')),
  parking text check (parking in ('crowded', 'lots_of_space')),
  games_status text check (games_status in ('on_time', 'ahead_of_schedule', 'running_behind')),
  note text check (char_length(note) <= 140),
  -- a check-in must report at least one of the three fields
  constraint field_condition_checkins_has_content
    check (field_condition is not null or parking is not null or games_status is not null)
);

create index if not exists field_condition_checkins_complex_recent_idx
  on field_condition_checkins (complex_id, submitted_at desc);

alter table field_condition_checkins enable row level security;

-- Only premium subscribers can read check-ins — this is the paid feature,
-- so gate it at the database level too, not just in the UI.
drop policy if exists "premium users can read checkins" on field_condition_checkins;
create policy "premium users can read checkins"
  on field_condition_checkins for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_premium = true)
  );

drop policy if exists "premium users can submit their own checkins" on field_condition_checkins;
create policy "premium users can submit their own checkins"
  on field_condition_checkins for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from profiles where id = auth.uid() and is_premium = true)
  );

-- ── "What's happening right now" per complex ──
-- Most recent check-in per category within the last 4 hours (a field can
-- go from muddy to dry over the course of a day, so a morning report
-- shouldn't linger and mislead an evening visitor). security_invoker
-- means this view enforces the *querying* user's RLS, not the view
-- owner's — so it stays premium-gated automatically.
create or replace view complex_conditions_current
  with (security_invoker = true) as
select
  fcx.id as complex_id,
  fc.field_condition,
  fc.submitted_at as field_condition_at,
  pk.parking,
  pk.submitted_at as parking_at,
  gs.games_status,
  gs.submitted_at as games_status_at,
  (
    select count(*) from field_condition_checkins
    where complex_id = fcx.id and submitted_at > now() - interval '4 hours'
  ) as recent_checkin_count
from field_complexes fcx
left join lateral (
  select field_condition, submitted_at from field_condition_checkins
  where complex_id = fcx.id and field_condition is not null
    and submitted_at > now() - interval '4 hours'
  order by submitted_at desc limit 1
) fc on true
left join lateral (
  select parking, submitted_at from field_condition_checkins
  where complex_id = fcx.id and parking is not null
    and submitted_at > now() - interval '4 hours'
  order by submitted_at desc limit 1
) pk on true
left join lateral (
  select games_status, submitted_at from field_condition_checkins
  where complex_id = fcx.id and games_status is not null
    and submitted_at > now() - interval '4 hours'
  order by submitted_at desc limit 1
) gs on true;

-- Recent check-in feed with the reporter's display name, mirroring
-- reviews_with_reviewer. Also premium-gated via security_invoker.
create or replace view field_condition_checkins_with_reporter
  with (security_invoker = true) as
select
  ck.*,
  p.display_name as reporter_display_name,
  f.field_name
from field_condition_checkins ck
left join profiles p on p.id = ck.user_id
left join fields f on f.id = ck.field_id
order by ck.submitted_at desc;

-- ── Server-only caches (lightning + rain) ──
-- No RLS policies are defined on purpose: these tables are only ever
-- touched by app/api/conditions/* using the Supabase service-role key,
-- which bypasses RLS entirely. With RLS enabled and zero policies, the
-- anon/authenticated roles get nothing if a client ever queried them
-- directly, so mis-wiring the client Supabase key can't leak this data
-- or run up API costs.
create table if not exists lightning_cache (
  grid_key text primary key,       -- rounded "lat,lon", e.g. "28.150,-82.350"
  last_strike_at timestamptz,      -- null = no strike found within the query radius/window
  distance_miles numeric,
  bearing text,                    -- e.g. "NE"
  strike_count_recent int not null default 0,
  fetched_at timestamptz not null default now(),
  next_poll_at timestamptz not null default now()
);
alter table lightning_cache enable row level security;

create table if not exists rain_forecast_cache (
  grid_key text primary key,
  headline text,                   -- e.g. "Rain likely 2–4 PM" / "No rain expected today"
  hourly jsonb,                    -- [{hour: "14:00", precip_probability: 62, precipitation: 0.4}, ...]
  fetched_at timestamptz not null default now(),
  next_poll_at timestamptz not null default now()
);
alter table rain_forecast_cache enable row level security;
