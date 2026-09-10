-- Lightweight crowdsourced error reporting: anyone signed in can flag that a
-- listing's name/address/sports/other detail looks wrong, with a free-text
-- note describing the correction. Nothing here auto-applies to
-- field_complexes — every report just lands in this table for an admin to
-- review and action later (status starts 'open').
create table if not exists complex_corrections (
  id uuid primary key default gen_random_uuid(),
  complex_id uuid not null references field_complexes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_type text not null check (issue_type in ('name', 'address', 'sports', 'other')),
  note text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists complex_corrections_complex_id_idx on complex_corrections(complex_id);
create index if not exists complex_corrections_status_idx on complex_corrections(status);

alter table complex_corrections enable row level security;

create policy "Admins can manage complex_corrections"
  on complex_corrections for all
  using (exists (select 1 from admins where admins.user_id = auth.uid()))
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

create policy "Users can report complex corrections"
  on complex_corrections for insert
  with check (user_id = auth.uid());

-- No select policy for regular users — reports aren't public, and a
-- reporter doesn't need to read them back for this pass.
