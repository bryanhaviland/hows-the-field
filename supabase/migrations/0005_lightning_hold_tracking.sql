-- Track the last strike that fell inside the danger radius separately from
-- the "closest strike overall" already cached, so a rolling 30-min
-- all-clear hold can be computed even after that strike ages out of
-- Xweather's closest-N results (applied live via Supabase MCP on 2026-09-04).
alter table lightning_cache add column if not exists last_danger_strike_at timestamptz null;

-- Persist a coarse "is the closest strike getting closer or farther away
-- since the last poll" trend so the UI can say something more useful than
-- a static reassurance message (applied live via Supabase MCP on 2026-09-04).
alter table lightning_cache add column if not exists trend text null;
