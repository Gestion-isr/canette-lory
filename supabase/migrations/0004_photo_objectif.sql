-- Photo de l'objectif (ex. la trottinette convoitée)
alter table public.goals add column if not exists image_url text;

-- Bucket public pour les photos d'objectifs (téléversement fait côté serveur avec la clé service)
insert into storage.buckets (id, name, public)
values ('objectifs', 'objectifs', true)
on conflict (id) do nothing;
