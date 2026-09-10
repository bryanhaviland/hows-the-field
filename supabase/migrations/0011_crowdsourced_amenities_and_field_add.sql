-- The complex-detail "Amenities" block used to read straight off
-- field_complexes (admin-curated columns) for 3 of its 6 questions
-- (concessions on-site, free admission, ample parking) while the other 3
-- (tents, pets, fly-ball cover) were already crowdsourced via reviews.
-- Make the whole block crowdsourced: no admin sourcing, reviews carry all 6.
alter table reviews add column if not exists concessions_onsite boolean;
alter table reviews add column if not exists free_admission boolean;
alter table reviews add column if not exists ample_parking boolean;

comment on column reviews.concessions_onsite is 'Crowdsourced report: was there concessions on-site during this visit?';
comment on column reviews.free_admission is 'Crowdsourced report: was admission free during this visit?';
comment on column reviews.ample_parking is 'Crowdsourced report: was there ample parking during this visit?';

-- Recreate the summary view, appending the 3 new percentages strictly after
-- all existing columns (Postgres forbids reordering/inserting mid-view).
create or replace view complex_ratings_summary as
select
  complex_id,
  count(*) as review_count,
  max(submitted_at) as last_reviewed_at,
  round(avg(bathroom_cleanliness), 1) as avg_bathroom_cleanliness,
  round(avg(concessions_quality), 1) as avg_concessions_quality,
  round(avg(concessions_value), 1) as avg_concessions_value,
  round(avg(bleachers_cleanliness), 1) as avg_bleachers_cleanliness,
  round(100.0 * count(*) filter (where diaper_changing_tables = true)::numeric / nullif(count(*) filter (where diaper_changing_tables is not null), 0)::numeric, 0) as pct_diaper_tables,
  round(100.0 * count(*) filter (where soap_stocked = true)::numeric / nullif(count(*) filter (where soap_stocked is not null), 0)::numeric, 0) as pct_soap_stocked,
  round(100.0 * count(*) filter (where paper_towels_stocked = true)::numeric / nullif(count(*) filter (where paper_towels_stocked is not null), 0)::numeric, 0) as pct_paper_towels,
  round(100.0 * count(*) filter (where cement_pad_for_chairs = true)::numeric / nullif(count(*) filter (where cement_pad_for_chairs is not null), 0)::numeric, 0) as pct_cement_pad,
  round(100.0 * count(*) filter (where covered_from_fly_balls = true)::numeric / nullif(count(*) filter (where covered_from_fly_balls is not null), 0)::numeric, 0) as pct_fly_ball_cover,
  round(100.0 * count(*) filter (where tents_allowed = true)::numeric / nullif(count(*) filter (where tents_allowed is not null), 0)::numeric, 0) as pct_tents_allowed,
  round(100.0 * count(*) filter (where pets_allowed = true)::numeric / nullif(count(*) filter (where pets_allowed is not null), 0)::numeric, 0) as pct_pets_allowed,
  mode() within group (order by shade_amount) as mode_shade_amount,
  mode() within group (order by walkways_congestion) as mode_walkways_congestion,
  mode() within group (order by water_access) as mode_water_access,
  round(100.0 * count(*) filter (where concessions_onsite = true)::numeric / nullif(count(*) filter (where concessions_onsite is not null), 0)::numeric, 0) as pct_concessions_onsite,
  round(100.0 * count(*) filter (where free_admission = true)::numeric / nullif(count(*) filter (where free_admission is not null), 0)::numeric, 0) as pct_free_admission,
  round(100.0 * count(*) filter (where ample_parking = true)::numeric / nullif(count(*) filter (where ample_parking is not null), 0)::numeric, 0) as pct_ample_parking
from reviews
group by complex_id;

-- Fields were built admin-only ("Admins can manage fields"), which is why
-- there was no way to add a field in the app. Make adding one crowdsourced
-- like everything else — any logged-in user can add a field. Admins keep
-- full manage rights via the existing ALL policy.
create policy "logged-in users can add a field" on fields
  for insert
  to authenticated
  with check (auth.uid() is not null);
