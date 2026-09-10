-- Legacy admin-set amenity/rating columns on field_complexes, fully retired
-- from the app (see migration 0011) and safe to drop: whatever data existed
-- was already migrated into `reviews` as ordinary crowd reports in migration
-- 0012, and no view/policy/function references these columns
-- (complex_conditions_current only touches field_complexes.id — confirmed
-- before dropping).
alter table field_complexes
  drop column if exists concessions_onsite,
  drop column if exists tents_allowed,
  drop column if exists pets_allowed,
  drop column if exists free_admission,
  drop column if exists ample_parking,
  drop column if exists covered_from_fly_balls,
  drop column if exists bathroom_cleanliness,
  drop column if exists diaper_changing_tables,
  drop column if exists soap_stocked,
  drop column if exists paper_towels_stocked,
  drop column if exists concessions_quality,
  drop column if exists concessions_value,
  drop column if exists water_access,
  drop column if exists bleachers_cleanliness,
  drop column if exists cement_pad_for_chairs,
  drop column if exists shade_amount,
  drop column if exists walkways_congestion;
