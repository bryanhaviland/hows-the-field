-- Lightning watches used to run forever once turned on. Add an expiry so a
-- "watch this complex" toggle only matters for the window the user actually
-- cares about (e.g. a tournament weekend) instead of silently polling a
-- field they haven't thought about in months.
alter table saved_complexes add column if not exists watch_lightning_expires_at timestamptz;

comment on column saved_complexes.watch_lightning_expires_at is
  'When lightning-watch push notifications for this saved complex stop firing. Set to now() + 2 days whenever watch_lightning is turned on (see lib/saved-complexes.ts setWatch); cleared to NULL when turned off. NULL or a past timestamp means "not actively watching" even if watch_lightning is still true.';

-- Rows created before this column existed had no expiry concept at all —
-- stop watching them rather than silently granting them a perpetual watch
-- that predates (and was never opted into under) this 2-day model.
update saved_complexes
  set watch_lightning = false
  where watch_lightning = true and watch_lightning_expires_at is null;
