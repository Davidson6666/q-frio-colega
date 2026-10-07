-- Phase 1: profiles
--
-- One row per auth user. Holds what the user sells, where, and their plan/credits.
--
-- SECURITY NOTE
-- Row Level Security alone is not enough here: an "update own row" policy would let
-- a user run `update profiles set plan = 'king', credits_balance = 100000` from the
-- browser. So we ALSO restrict UPDATE per column. `plan`, `credits_balance` and
-- `credits_renew_at` can only be changed by the service role (webhooks, SQL functions).

create type public.plan_id as enum ('free', 'pro', 'king');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  whatsapp text,
  services_offered text[] not null default '{}',
  default_city text,
  plan public.plan_id not null default 'free',
  credits_balance integer not null default 0,
  credits_renew_at timestamptz,
  created_at timestamptz not null default now(),

  constraint profiles_name_len check (name is null or char_length(name) <= 80),
  constraint profiles_city_len check (default_city is null or char_length(default_city) <= 80),
  -- Canonical Brazilian number: country code 55 + DDD + 8/9 digits (see src/lib/phone.ts).
  constraint profiles_whatsapp_fmt check (whatsapp is null or whatsapp ~ '^55[0-9]{10,11}$'),
  constraint profiles_services_max check (cardinality(services_offered) <= 10),
  constraint profiles_credits_nonneg check (credits_balance >= 0)
);

comment on table public.profiles is 'Per-user profile, plan and credit balance.';

alter table public.profiles enable row level security;

-- A user can read and update only their own row.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Column-level privileges. Supabase grants broad default privileges on new tables,
-- so start from zero and grant back only what the client may do.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, whatsapp, services_offered, default_city) on public.profiles to authenticated;
-- No INSERT/DELETE for clients: rows are created by the trigger below and removed
-- by the cascade when the auth user is deleted.

-- Create the profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    nullif(
      left(
        coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
        80
      ),
      ''
    )
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: users created before this migration (or while the trigger was
-- missing) would otherwise have no profile and could never get one, since
-- clients have no INSERT privilege.
insert into public.profiles (id, name)
select
  u.id,
  nullif(
    left(coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', ''), 80),
    ''
  )
from auth.users u
on conflict (id) do nothing;
