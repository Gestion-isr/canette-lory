-- Note permanente du citoyen pour ses collectes
-- (ex. « Sac près de la porte, du côté droit »)
alter table public.profiles add column if not exists pickup_note text;
