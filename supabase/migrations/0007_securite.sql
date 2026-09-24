-- ============================================================
-- Durcissement de sécurité
-- ============================================================

-- 1) L'adresse de départ (la maison) ne doit plus être lisible publiquement.
--    Avant : « settings » était lisible par tout le monde avec la clé publique,
--    ce qui exposait home_address, home_lat et home_lng à n'importe quel visiteur.
--    Après : seuls les admins lisent la table ; l'application lit les paramètres
--    côté serveur avec la clé service, et ne renvoie au navigateur que le nécessaire.
drop policy if exists "settings read" on public.settings;

create policy "settings read admin" on public.settings
  for select using (public.is_admin());

-- 2) Un citoyen ne doit pas pouvoir modifier lui-même les champs de suivi
--    de ses collectes (nombre de cannettes, statut de complétion…) via l'API.
--    Sans ça, il pouvait gonfler les chiffres publics de l'historique.
create or replace function public.protect_pickup_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), 'postgres') = 'authenticated' and not public.is_admin() then
    new.user_id := old.user_id;
    new.cans_count := old.cans_count;
    new.completed_at := old.completed_at;
    new.reminder_sent_at := old.reminder_sent_at;
    new.recurrence_id := old.recurrence_id;
    -- Un citoyen ne peut qu'annuler : il ne peut pas marquer « complétée »
    if new.status not in ('en_attente', 'annulee') then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pickups_protect_fields on public.pickup_requests;
create trigger pickups_protect_fields
  before update on public.pickup_requests
  for each row execute function public.protect_pickup_fields();
