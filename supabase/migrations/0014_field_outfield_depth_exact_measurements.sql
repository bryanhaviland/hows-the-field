-- Optional exact outfield depth measurements (feet), broken out by field
-- section, alongside the existing coarse short/standard/deep picker.
-- Crowdsourced like everything else in `fields` — anyone can fill in as
-- much or as little as they know.
alter table fields
  add column if not exists outfield_depth_left_ft numeric(5,1),
  add column if not exists outfield_depth_center_ft numeric(5,1),
  add column if not exists outfield_depth_right_ft numeric(5,1);

comment on column fields.outfield_depth_left_ft is 'Optional exact left-field outfield depth in feet.';
comment on column fields.outfield_depth_center_ft is 'Optional exact center-field outfield depth in feet.';
comment on column fields.outfield_depth_right_ft is 'Optional exact right-field outfield depth in feet.';
