-- Texte modifiable de la page « À propos » (Paramètres > À propos)
alter table public.settings add column if not exists about_text text;
