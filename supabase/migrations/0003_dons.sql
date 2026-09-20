-- Distinction entre l'argent des consignes et les dons
alter table public.deposits
  add column if not exists kind text not null default 'cannettes'
  check (kind in ('cannettes', 'don'));

-- La fonction change de signature : on la recrée
drop function if exists public.get_goal_progress();

create or replace function public.get_goal_progress()
returns table (
  goal_id uuid,
  title text,
  target_amount numeric,
  started_at date,
  raised_amount numeric,      -- consignes + dons depuis le début de l'objectif
  raised_donations numeric,   -- dont dons
  total_amount numeric,       -- consignes + dons, tout temps
  total_donations numeric,    -- dont dons, tout temps
  total_cans bigint
) language sql security definer stable set search_path = public as $$
  select
    g.id,
    g.title,
    g.target_amount,
    g.started_at,
    coalesce((select sum(d.amount) from public.deposits d where d.deposited_at >= g.started_at), 0),
    coalesce((select sum(d.amount) from public.deposits d where d.deposited_at >= g.started_at and d.kind = 'don'), 0),
    coalesce((select sum(d.amount) from public.deposits d), 0),
    coalesce((select sum(d.amount) from public.deposits d where d.kind = 'don'), 0),
    coalesce((select sum(d.cans_count) from public.deposits d), 0)
  from public.goals g
  where g.active
  order by g.created_at desc
  limit 1;
$$;
