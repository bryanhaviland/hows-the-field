-- New crowdsourced concessions question: when are concessions available?
-- Multi-select, stored as a text array of 'breakfast' | 'lunch' | 'dinner' |
-- 'select_times_only'.
alter table reviews
  add column if not exists concessions_available_for text[];

comment on column reviews.concessions_available_for is
  'Multi-select: which of breakfast/lunch/dinner/select_times_only concessions were available during this visit.';

-- Append per-option percentages to the summary view (existing columns must
-- stay in place and in order — see migration 0011's note on this).
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
  round(100.0 * count(*) filter (where ample_parking = true)::numeric / nullif(count(*) filter (where ample_parking is not null), 0)::numeric, 0) as pct_ample_parking,
  round(100.0 * count(*) filter (where concessions_available_for @> array['breakfast'])::numeric / nullif(count(*) filter (where concessions_available_for is not null), 0)::numeric, 0) as pct_concessions_breakfast,
  round(100.0 * count(*) filter (where concessions_available_for @> array['lunch'])::numeric / nullif(count(*) filter (where concessions_available_for is not null), 0)::numeric, 0) as pct_concessions_lunch,
  round(100.0 * count(*) filter (where concessions_available_for @> array['dinner'])::numeric / nullif(count(*) filter (where concessions_available_for is not null), 0)::numeric, 0) as pct_concessions_dinner,
  round(100.0 * count(*) filter (where concessions_available_for @> array['select_times_only'])::numeric / nullif(count(*) filter (where concessions_available_for is not null), 0)::numeric, 0) as pct_concessions_select_times_only
from reviews
group by complex_id;
