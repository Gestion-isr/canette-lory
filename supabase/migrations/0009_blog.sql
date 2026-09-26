-- ============================================================
-- Blog : petits articles publiés par Lory (texte + photos)
-- ============================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  images text[] not null default '{}',
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (published, published_at desc);

alter table public.posts enable row level security;

-- Tout le monde peut lire les articles publiés ; seuls les admins écrivent.
create policy "posts read published" on public.posts
  for select using (published or public.is_admin());
create policy "posts admin write" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Espace de stockage public pour les photos du blog
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;
