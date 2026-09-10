-- Rename the 'dusty' field condition check-in option to 'windy' (applied live via Supabase MCP on 2026-09-04).
update field_condition_checkins set field_condition = 'windy' where field_condition = 'dusty';

alter table field_condition_checkins drop constraint field_condition_checkins_field_condition_check;
alter table field_condition_checkins add constraint field_condition_checkins_field_condition_check
  check (field_condition = ANY (ARRAY['dry'::text, 'windy'::text, 'muddy'::text, 'perfect'::text]));
