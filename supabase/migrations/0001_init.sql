-- ============================================================
-- Collecte de cannettes - schéma initial
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Admins ----------
-- Les courriels listés ici obtiennent l'accès admin à la création du compte.
create table public.admin_emails (
  email text primary key
);

-- ---------- Profils ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    new.email,
    exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Empêche un citoyen de modifier lui-même is_admin ou son courriel via l'API.
-- (Le SQL Editor et la clé service ne sont pas concernés.)
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), 'postgres') = 'authenticated' and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.email := old.email;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------- Paramètres (ligne unique) ----------
create table public.settings (
  id int primary key default 1 check (id = 1),
  child_name text not null default 'Ma fille',
  season text not null default 'ete' check (season in ('ete', 'hiver')),
  summer_days int[] not null default '{0,1,2,3,4,5,6}',   -- 0 = dimanche ... 6 = samedi
  winter_days int[] not null default '{0,6}',
  min_notice_days int not null default 1,
  max_per_day int not null default 10,
  horizon_days int not null default 60,
  home_address text,
  home_lat double precision not null default 45.915,
  home_lng double precision not null default -72.465,
  show_goal_to_citizens boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- ---------- Dates bloquées ----------
create table public.blocked_dates (
  date date primary key,
  reason text
);

-- ---------- Récurrences ----------
create table public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  interval_weeks int not null check (interval_weeks between 1 and 8),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Demandes de collecte ----------
create table public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_date date not null,
  estimated_bags int,
  note text,
  status text not null default 'en_attente' check (status in ('en_attente', 'completee', 'annulee')),
  cans_count int,
  completed_at timestamptz,
  recurrence_id uuid references public.recurrences(id) on delete set null,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index pickup_requests_date_idx on public.pickup_requests (requested_date, status);
create index pickup_requests_user_idx on public.pickup_requests (user_id);

-- ---------- Objectif ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_amount numeric(10,2) not null check (target_amount > 0),
  started_at date not null default current_date,
  active boolean not null default true,
  achieved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Dépôts (montants cumulés entrés manuellement) ----------
create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10,2) not null check (amount >= 0),
  cans_count int,
  deposited_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Progression de l'objectif ----------
create or replace function public.get_goal_progress()
returns table (
  goal_id uuid,
  title text,
  target_amount numeric,
  started_at date,
  raised_amount numeric,
  total_amount numeric,
  total_cans bigint
) language sql security definer stable set search_path = public as $$
  select
    g.id,
    g.title,
    g.target_amount,
    g.started_at,
    coalesce((select sum(d.amount) from public.deposits d where d.deposited_at >= g.started_at), 0),
    coalesce((select sum(d.amount) from public.deposits d), 0),
    coalesce((select sum(d.cans_count) from public.deposits d), 0)
  from public.goals g
  where g.active
  order by g.created_at desc
  limit 1;
$$;

-- ---------- Nombre de demandes en attente par date (pour la disponibilité) ----------
create or replace function public.get_pickup_counts(from_date date, to_date date)
returns table (requested_date date, cnt bigint)
language sql security definer stable set search_path = public as $$
  select requested_date, count(*)
  from public.pickup_requests
  where status = 'en_attente' and requested_date between from_date and to_date
  group by requested_date;
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.admin_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.recurrences enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.goals enable row level security;
alter table public.deposits enable row level security;

-- admin_emails : admin seulement
create policy "admin_emails admin" on public.admin_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles
create policy "profiles select own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- settings
create policy "settings read" on public.settings
  for select using (true);
create policy "settings admin write" on public.settings
  for update using (public.is_admin()) with check (public.is_admin());

-- blocked_dates
create policy "blocked read" on public.blocked_dates
  for select using (auth.role() = 'authenticated');
create policy "blocked admin write" on public.blocked_dates
  for all using (public.is_admin()) with check (public.is_admin());

-- recurrences
create policy "recurrences own or admin" on public.recurrences
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- pickup_requests
create policy "requests select" on public.pickup_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy "requests insert own" on public.pickup_requests
  for insert with check (user_id = auth.uid() or public.is_admin());
create policy "requests update own pending" on public.pickup_requests
  for update using ((user_id = auth.uid() and status = 'en_attente') or public.is_admin())
  with check ((user_id = auth.uid() and status in ('en_attente', 'annulee')) or public.is_admin());
create policy "requests admin delete" on public.pickup_requests
  for delete using (public.is_admin());

-- goals
create policy "goals read" on public.goals
  for select using (true);
create policy "goals admin write" on public.goals
  for all using (public.is_admin()) with check (public.is_admin());

-- deposits
create policy "deposits admin" on public.deposits
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Objectif de départ ----------
insert into public.goals (title, target_amount) values ('Trottinette électrique', 350.00);

-- ============================================================
-- À FAIRE APRÈS : ajouter vos courriels admin, par exemple :
-- insert into public.admin_emails (email) values ('parent@exemple.com'), ('fille@exemple.com');
-- Si le compte existe déjà : update public.profiles set is_admin = true where email = 'parent@exemple.com';
-- ============================================================
