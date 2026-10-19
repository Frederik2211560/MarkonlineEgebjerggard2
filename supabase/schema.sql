create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null,
  display_name text not null,
  role text not null default 'employee' check (role in ('director', 'employee')),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index profiles_username_lower_unique on public.profiles (lower(username));

create table public.fields (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area double precision not null check (area > 0 and area <= 100000),
  crop text not null,
  variety text not null default '',
  soil_type text not null default '',
  last_crop text not null default '',
  status text not null default 'Aktiv' check (status in ('Aktiv', 'Høstet', 'Hvile')),
  nitrogen_target double precision not null default 0 check (nitrogen_target >= 0 and nitrogen_target <= 1000),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  date date not null,
  product text not null,
  amount double precision not null check (amount > 0 and amount <= 100000),
  unit text not null check (unit in ('kg/ha', 'l/ha', 'ton/ha')),
  method text not null default '',
  status text not null default 'Planlagt' check (status in ('Planlagt', 'Udført')),
  notes text not null default '',
  created_by uuid not null references public.profiles (id),
  created_by_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  date date not null,
  stage text not null,
  health text not null check (health in ('God', 'Middel', 'Kræver opmærksomhed')),
  notes text not null default '',
  created_by uuid not null references public.profiles (id),
  created_by_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (id, email, username, display_name)
  values (
    new.id,
    new.email,
    trim(metadata ->> 'username'),
    trim(metadata ->> 'display_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and active
  );
$$;

create or replace function public.is_director()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and active and role = 'director'
  );
$$;

create or replace function public.keep_record_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by
    or new.created_by_name is distinct from old.created_by_name then
    raise exception 'Registreringens opretter kan ikke ændres.';
  end if;
  return new;
end;
$$;

create trigger plans_creator_immutable
  before update on public.plans
  for each row execute procedure public.keep_record_creator();

create trigger observations_creator_immutable
  before update on public.observations
  for each row execute procedure public.keep_record_creator();

create or replace function public.setup_required()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where role = 'director');
$$;

create or replace function public.claim_initial_director()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Log ind for at oprette direktørkontoen.';
  end if;

  perform pg_advisory_xact_lock(hashtext('egebjerggaard-initial-director'));

  if exists (select 1 from public.profiles where role = 'director') then
    raise exception 'Direktørkontoen er allerede oprettet.';
  end if;

  update public.profiles
  set role = 'director', active = true
  where id = current_user_id;

  if not found then
    raise exception 'Brugerprofilen blev ikke fundet.';
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.fields enable row level security;
alter table public.plans enable row level security;
alter table public.observations enable row level security;

revoke all on public.profiles, public.fields, public.plans, public.observations from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_active_user() from public, anon, authenticated;
revoke all on function public.is_director() from public, anon, authenticated;
revoke all on function public.keep_record_creator() from public, anon, authenticated;
revoke all on function public.setup_required() from public, anon, authenticated;
revoke all on function public.claim_initial_director() from public, anon, authenticated;
grant execute on function public.setup_required() to anon, authenticated;
grant execute on function public.claim_initial_director() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_director() to authenticated;

grant select on public.profiles to authenticated;
grant update (active) on public.profiles to authenticated;
grant select, insert, update, delete on public.fields to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.observations to authenticated;

create policy "Users can read their profile or directors can read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_director()));

create policy "Directors can manage employee access"
  on public.profiles for update to authenticated
  using ((select public.is_director()))
  with check (
    (select public.is_director())
    and (id <> (select auth.uid()) or active)
  );

create policy "Active users can read fields"
  on public.fields for select to authenticated using ((select public.is_active_user()));
create policy "Active users can add fields"
  on public.fields for insert to authenticated with check ((select public.is_active_user()));
create policy "Active users can update fields"
  on public.fields for update to authenticated
  using ((select public.is_active_user()))
  with check ((select public.is_active_user()));
create policy "Directors can delete fields"
  on public.fields for delete to authenticated using ((select public.is_director()));

create policy "Active users can read plans"
  on public.plans for select to authenticated using ((select public.is_active_user()));
create policy "Active users can add plans"
  on public.plans for insert to authenticated
  with check ((select public.is_active_user()) and created_by = (select auth.uid()));
create policy "Active users can update plans"
  on public.plans for update to authenticated
  using ((select public.is_active_user()))
  with check ((select public.is_active_user()));
create policy "Directors can delete plans"
  on public.plans for delete to authenticated using ((select public.is_director()));

create policy "Active users can read observations"
  on public.observations for select to authenticated using ((select public.is_active_user()));
create policy "Active users can add observations"
  on public.observations for insert to authenticated
  with check ((select public.is_active_user()) and created_by = (select auth.uid()));
create policy "Active users can update observations"
  on public.observations for update to authenticated
  using ((select public.is_active_user()))
  with check ((select public.is_active_user()));
create policy "Directors can delete observations"
  on public.observations for delete to authenticated using ((select public.is_director()));
