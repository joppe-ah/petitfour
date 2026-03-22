-- ============================================================
-- Sprint 8: Family profiles and authentication schema
-- ============================================================

-- ── families ────────────────────────────────────────────────

create table if not exists families (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text unique not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ── profiles ────────────────────────────────────────────────

create table if not exists profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  name                  text not null default '',
  avatar_url            text,
  avatar_preset         text,
  color_theme           text not null default 'teal',
  dietary_preferences   text[] not null default '{}',
  family_id             uuid references families(id) on delete set null,
  role                  text not null default 'member' check (role in ('admin', 'member')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── family_invites ──────────────────────────────────────────

create table if not exists family_invites (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  email       text not null,
  token       text unique not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ── Add auth columns to existing tables ─────────────────────

alter table if exists recipes
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists family_id  uuid references families(id) on delete set null;

alter table if exists meal_plans
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists family_id  uuid references families(id) on delete set null;

-- ── Row Level Security ───────────────────────────────────────

alter table profiles enable row level security;
alter table families enable row level security;
alter table family_invites enable row level security;

-- profiles: read all in same family, update own
create policy "profiles_select" on profiles
  for select using (
    auth.uid() = id
    or family_id in (
      select family_id from profiles where id = auth.uid()
    )
  );

create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id);

-- families: members can read their family
create policy "families_select" on families
  for select using (
    id in (select family_id from profiles where id = auth.uid())
  );

create policy "families_insert" on families
  for insert with check (auth.uid() = created_by);

-- family_invites: admin can create, anyone can read by token
create policy "invites_select_admin" on family_invites
  for select using (
    family_id in (
      select family_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "invites_insert_admin" on family_invites
  for insert with check (
    family_id in (
      select family_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "invites_delete_admin" on family_invites
  for delete using (
    family_id in (
      select family_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- recipes RLS
alter table if exists recipes enable row level security;

create policy "recipes_select" on recipes
  for select using (
    family_id in (select family_id from profiles where id = auth.uid())
    or created_by = auth.uid()
    or family_id is null
  );

create policy "recipes_insert" on recipes
  for insert with check (auth.uid() = created_by);

create policy "recipes_update" on recipes
  for update using (
    family_id in (select family_id from profiles where id = auth.uid())
    or created_by = auth.uid()
  );

create policy "recipes_delete" on recipes
  for delete using (
    family_id in (select family_id from profiles where id = auth.uid())
    or created_by = auth.uid()
  );

-- meal_plans RLS (same pattern as recipes)
alter table if exists meal_plans enable row level security;

create policy "meal_plans_select" on meal_plans
  for select using (
    family_id in (select family_id from profiles where id = auth.uid())
    or created_by = auth.uid()
    or family_id is null
  );

create policy "meal_plans_insert" on meal_plans
  for insert with check (auth.uid() = created_by);

create policy "meal_plans_update" on meal_plans
  for update using (
    family_id in (select family_id from profiles where id = auth.uid())
    or created_by = auth.uid()
  );

create policy "meal_plans_delete" on meal_plans
  for delete using (
    family_id in (select family_id from profiles where id = auth.uid())
    or created_by = auth.uid()
  );

-- ── Auto-create profile on signup ───────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Updated_at trigger ───────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();
