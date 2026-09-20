# 🥫 Collecte de cannettes – Saint-Charles-de-Drummond

Application web pour organiser la collecte de cannettes à domicile.

- **Citoyens** : compte en 1 clic (lien magique par courriel), adresse géolocalisée, demande de collecte pour une date disponible, récurrence optionnelle, historique.
- **Admin** : tableau de bord (argent, cannettes, objectif + barre de progression), liste des collectes, carte interactive avec **trajet optimisé** exportable vers Google Maps, gestion des citoyens, paramètres de disponibilité (été / hiver, jours, préavis, max par jour, dates bloquées).
- **Courriels** (Resend) : confirmation de demande, rappel la veille (cron), remerciement après collecte.

Stack : Next.js 15 · Supabase (auth + Postgres) · Leaflet / OpenStreetMap · Resend · Vercel.

---

## 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (région `ca-central-1` ou `us-east-1`).
2. **SQL Editor** → colle et exécute tout le contenu de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Ajoute vos deux courriels admin (toi + ta fille) :
   ```sql
   insert into public.admin_emails (email) values ('toi@exemple.com'), ('ta-fille@exemple.com');
   ```
   > Si un compte existe déjà avant cette étape : `update public.profiles set is_admin = true where email = 'toi@exemple.com';`
4. **Authentication → URL Configuration**
   - *Site URL* : `http://localhost:3000` (puis l'URL Vercel une fois déployé)
   - *Redirect URLs* : ajoute `http://localhost:3000/auth/callback` et `https://TON-SITE.vercel.app/auth/callback`
5. **Authentication → Email Templates** – pour que le lien fonctionne même s'il est ouvert sur un autre appareil que celui qui l'a demandé, remplace le lien dans **Magic Link** *et* **Confirm signup** par :
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Me connecter</a>
   ```
   (Tu peux rédiger le reste du courriel en français à ton goût.)
6. **Authentication → SMTP Settings** (important !) – le serveur courriel par défaut de Supabase est limité à ~2 courriels/heure. Active *Custom SMTP* avec Resend :
   - Host : `smtp.resend.com` · Port : `465` · User : `resend` · Password : ta clé API Resend
   - Sender email : une adresse sur un domaine vérifié chez Resend (ex. `cannettes@ton-domaine.com`)
7. **Project Settings → API** : note l'URL du projet, la clé `anon` et la clé `service_role`.

## 2. Resend

1. Vérifie ton domaine dans Resend (ou utilise `onboarding@resend.dev` pour tester, mais ça n'envoie qu'à ton propre courriel).
2. Crée une clé API.

## 3. Variables d'environnement

Copie `.env.example` → `.env.local` et remplis :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
EMAIL_FROM="Collecte de cannettes <cannettes@ton-domaine.com>"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CRON_SECRET=une-longue-chaine-aleatoire
```

## 4. Lancer en local

```bash
npm install
npm run dev
```

Ouvre <http://localhost:3000>, entre ton courriel, clique le lien reçu → tu arrives sur `/admin`.

## 5. Déployer sur Vercel

1. Pousse le projet sur GitHub, importe-le dans Vercel.
2. Ajoute les mêmes variables d'environnement (avec `NEXT_PUBLIC_SITE_URL=https://TON-SITE.vercel.app`).
3. Le cron des rappels (`vercel.json`) s'active automatiquement : chaque jour à 22 h UTC (18 h heure du Québec), un courriel de rappel est envoyé aux citoyens qui ont une collecte le lendemain. Vercel envoie automatiquement l'en-tête `Authorization: Bearer $CRON_SECRET`.
4. Mets à jour *Site URL* et *Redirect URLs* dans Supabase avec l'URL Vercel.

Le site est en `noindex` (robots.txt + en-tête) : il n'apparaîtra pas dans Google, seuls ceux qui ont le lien y accèdent.

## 6. Premiers pas dans l'admin

- **Paramètres** : entre l'adresse de la maison (point de départ des trajets), choisis la saison, les jours de collecte, le préavis et le prénom affiché.
- **Tableau de bord** : l'objectif « Trottinette électrique – 350 $ » est déjà créé. Après chaque passage au dépanneur, ajoute un dépôt (montant + nombre de cannettes).
- **Carte & trajet** : choisis une date, le trajet optimal s'affiche ; bouton *Google Maps* pour la navigation, *Copier la liste* pour l'ordre de passage.
- **Collectes** : bouton *Compléter* (avec nb de cannettes approximatif) → le citoyen reçoit un merci par courriel et, si récurrence, la prochaine collecte est planifiée automatiquement.

## Structure

```
src/
  app/                 pages (App Router)
    page.tsx           accueil + connexion
    mon-compte/        espace citoyen
    admin/             tableau de bord, collectes, carte, citoyens, paramètres
    api/geocode        géocodage d'adresse (Nominatim)
    api/cron/rappels   rappels la veille
    auth/callback      retour du lien magique
  actions/             server actions (auth, profil, collectes, admin)
  components/          UI (carte Leaflet, calendrier, formulaires…)
  lib/                 disponibilité, optimisation de trajet, courriels, formatage
supabase/migrations/   schéma SQL + RLS
```
