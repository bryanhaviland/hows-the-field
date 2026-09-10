-- Lets a user pick which sport/field types they care about from the new
-- profile menu; the search page defaults its sport filter to this on load
-- instead of always starting on "All sports". Empty array = no preference set.
alter table profiles add column if not exists preferred_sports text[] not null default '{}';
comment on column profiles.preferred_sports is
  'Sport type values the user selected in the profile menu as their default field-type filter (e.g. {softball,baseball}). Empty array means no preference set / show all sports.';
