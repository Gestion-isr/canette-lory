-- ============================================================
-- Trois sources d'argent : consignes, dons, argent personnel
-- ============================================================

-- 1) Nouvelle valeur possible pour « kind »
alter table public.deposits drop constraint if exists deposits_kind_check;
alter table public.deposits
  add constraint deposits_kind_check check (kind in ('cannettes', 'don', 'personnel'));

-- 2) Le résumé de la cagnotte distingue maintenant les trois sources
drop function if exists public.get_funds_summary();

create or replace function public.get_funds_summary()
returns table (
  total_amount numeric,     -- tout l'argent entré (consignes + dons + personnel)
  total_donations numeric,  -- dont dons reçus
  total_personal numeric,   -- dont argent personnel déposé
  total_cans bigint,
  spent_amount numeric      -- montants des objectifs déjà atteints
) language sql security definer stable set search_path = public as $$
  select
    coalesce((select sum(d.amount) from public.deposits d), 0),
    coalesce((select sum(d.amount) from public.deposits d where d.kind = 'don'), 0),
    coalesce((select sum(d.amount) from public.deposits d where d.kind = 'personnel'), 0),
    coalesce((select sum(d.cans_count) from public.deposits d), 0),
    coalesce((select sum(coalesce(g.spent_amount, g.target_amount)) from public.goals g where g.achieved_at is not null), 0);
$$;
