-- Plusieurs objectifs simultanés, financés dans l'ordre de priorité (cascade).
-- La cagnotte = tous les dépôts - montants des objectifs atteints (dépensés).

alter table public.goals add column if not exists position int not null default 0;
alter table public.goals add column if not exists spent_amount numeric(10,2);

-- Les objectifs déjà atteints sont considérés dépensés à hauteur de leur cible
update public.goals set spent_amount = target_amount where achieved_at is not null and spent_amount is null;

-- Ordre initial = ordre de création
with ordered as (
  select id, row_number() over (order by created_at) - 1 as pos from public.goals where active
)
update public.goals g set position = o.pos from ordered o where g.id = o.id;

-- L'ancienne fonction (un seul objectif) n'est plus utilisée
drop function if exists public.get_goal_progress();

-- Résumé de la cagnotte, lisible par tous (agrégats seulement)
create or replace function public.get_funds_summary()
returns table (
  total_amount numeric,     -- consignes + dons, tout temps
  total_donations numeric,  -- dont dons
  total_cans bigint,
  spent_amount numeric      -- montants des objectifs atteints
) language sql security definer stable set search_path = public as $$
  select
    coalesce((select sum(d.amount) from public.deposits d), 0),
    coalesce((select sum(d.amount) from public.deposits d where d.kind = 'don'), 0),
    coalesce((select sum(d.cans_count) from public.deposits d), 0),
    coalesce((select sum(coalesce(g.spent_amount, g.target_amount)) from public.goals g where g.achieved_at is not null), 0);
$$;
