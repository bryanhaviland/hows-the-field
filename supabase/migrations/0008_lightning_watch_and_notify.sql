-- Lets a signed-in user "watch" a saved complex (home field or favorite) for
-- lightning: when the 10-mile/30-min hold starts or clears, they get a push
-- notification via OneSignal, sent by a Cloudflare Cron Trigger job
-- (lib/lightning-watch-job.ts) that polls every watched complex's grid cell.
alter table saved_complexes add column if not exists watch_lightning boolean not null default false;

create index if not exists saved_complexes_watch_lightning_idx
  on saved_complexes (watch_lightning) where watch_lightning = true;

-- Toggling watch_lightning on an existing saved row is the first in-place
-- edit this table needs — the original migration was add/remove-only.
create policy "Users can update their own saved complexes"
  on saved_complexes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Tracks whether a push has already gone out for the CURRENT hold state of
-- this grid cell, so the watch job notifies once on hold-start and once on
-- all-clear rather than every time it polls during a multi-strike storm.
alter table lightning_cache add column if not exists last_notified_hold_active boolean;
