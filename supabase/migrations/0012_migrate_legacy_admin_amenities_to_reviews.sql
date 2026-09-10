-- The old admin-set amenity/rating columns on field_complexes are no longer
-- read anywhere in the app (everything's crowdsourced now — see migration
-- 0011 and the Sept 10 2026 punchlist). Rather than just discarding whatever
-- data was already sitting there, fold it into `reviews` as one ordinary
-- anonymous visit report per complex that had anything set — it blends into
-- the crowd averages/percentages like any other report, with no marker
-- distinguishing it as "admin" data. field_complexes' own columns are left
-- in place (dead, unused by the app) rather than dropped.
insert into reviews (
  complex_id, field_id, user_id, is_anonymous, submitted_at,
  concessions_onsite, tents_allowed, pets_allowed, free_admission, ample_parking,
  covered_from_fly_balls, bathroom_cleanliness, diaper_changing_tables, soap_stocked,
  paper_towels_stocked, concessions_quality, concessions_value, water_access,
  bleachers_cleanliness, cement_pad_for_chairs, shade_amount, walkways_congestion
)
select
  id, null, null, true, now(),
  concessions_onsite, tents_allowed, pets_allowed, free_admission, ample_parking,
  covered_from_fly_balls, bathroom_cleanliness, diaper_changing_tables, soap_stocked,
  paper_towels_stocked, concessions_quality, concessions_value, water_access,
  bleachers_cleanliness, cement_pad_for_chairs, shade_amount, walkways_congestion
from field_complexes
where concessions_onsite is not null or tents_allowed is not null or pets_allowed is not null
   or free_admission is not null or ample_parking is not null or covered_from_fly_balls is not null
   or bathroom_cleanliness is not null or diaper_changing_tables is not null or soap_stocked is not null
   or paper_towels_stocked is not null or concessions_quality is not null or concessions_value is not null
   or water_access is not null or bleachers_cleanliness is not null or cement_pad_for_chairs is not null
   or shade_amount is not null or walkways_congestion is not null;
