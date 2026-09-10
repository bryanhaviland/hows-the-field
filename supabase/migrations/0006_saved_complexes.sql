-- Premium feature: users can mark up to 5 complexes as "home field" and 10 as
-- "favorite" per sport type (softball/baseball/both/soccer/flag_football are
-- independent buckets, not a shared cumulative cap). Enforced server-side via
-- trigger so it holds regardless of which client path writes the row.
create table if not exists saved_complexes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  complex_id uuid not null references field_complexes(id) on delete cascade,
  kind text not null check (kind in ('home', 'favorite')),
  created_at timestamptz not null default now(),
  unique (user_id, complex_id, kind)
);

create index if not exists saved_complexes_user_id_idx on saved_complexes(user_id);
create index if not exists saved_complexes_complex_id_idx on saved_complexes(complex_id);

alter table saved_complexes enable row level security;

create policy "Users can view their own saved complexes"
  on saved_complexes for select
  using (user_id = auth.uid());

create policy "Users can insert their own saved complexes"
  on saved_complexes for insert
  with check (user_id = auth.uid());

create policy "Users can delete their own saved complexes"
  on saved_complexes for delete
  using (user_id = auth.uid());

-- No update policy — a saved complex is add/remove only, never edited in place.

create or replace function enforce_saved_complex_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sport_type text;
  v_limit integer;
  v_count integer;
begin
  select sport_type into v_sport_type from field_complexes where id = new.complex_id;
  if v_sport_type is null then
    raise exception 'complex not found';
  end if;

  v_limit := case new.kind when 'home' then 5 when 'favorite' then 10 end;

  select count(*) into v_count
  from saved_complexes sc
  join field_complexes fc on fc.id = sc.complex_id
  where sc.user_id = new.user_id
    and sc.kind = new.kind
    and fc.sport_type = v_sport_type;

  if v_count >= v_limit then
    raise exception 'SAVE_LIMIT_REACHED: % limit of % reached for sport type %', new.kind, v_limit, v_sport_type
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_saved_complex_limit on saved_complexes;
create trigger trg_enforce_saved_complex_limit
  before insert on saved_complexes
  for each row execute function enforce_saved_complex_limit();
