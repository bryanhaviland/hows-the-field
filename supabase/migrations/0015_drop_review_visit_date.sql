-- The "when did you visit?" question is gone from the review form — a
-- visit report's date is just when it was logged (reviews.submitted_at).
-- Asking for a separate visit_date was friction and redundant now that
-- fields have their own dedicated, separately-dated form.
--
-- reviews_with_reviewer must be dropped and recreated (not just
-- CREATE OR REPLACE) to remove a column. While recreating it, also fix a
-- gap from migration 0011: concessions_onsite/free_admission/ample_parking
-- were added to `reviews` but never exposed through this view, so "Edit my
-- Review" was silently losing those three answers on load.
drop view reviews_with_reviewer;

alter table reviews drop column if exists visit_date;

create view reviews_with_reviewer as
select
  r.id,
  r.complex_id,
  r.submitted_at,
  r.bathroom_cleanliness,
  r.diaper_changing_tables,
  r.soap_stocked,
  r.paper_towels_stocked,
  r.concessions_quality,
  r.concessions_value,
  r.bleachers_cleanliness,
  r.cement_pad_for_chairs,
  r.shade_amount,
  r.walkways_congestion,
  r.covered_from_fly_balls,
  r.tents_allowed,
  r.pets_allowed,
  r.water_access,
  r.reviewer_note,
  r.user_id,
  r.field_id,
  r.is_anonymous,
  case when r.is_anonymous then null::text else p.display_name end as reviewer_display_name,
  case when r.is_anonymous then null::text else rs.badge end as reviewer_badge,
  f.field_name,
  r.concessions_onsite,
  r.free_admission,
  r.ample_parking
from reviews r
left join profiles p on p.id = r.user_id
left join reviewer_stats rs on rs.user_id = r.user_id
left join fields f on f.id = r.field_id;
