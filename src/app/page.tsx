import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getGoals, getSettings } from "@/lib/data";
import { LoginForm } from "@/components/LoginForm";
import { GoalList } from "@/components/GoalProgressBar";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string; erreur?: string }>;
}) {
  const profile = await getCurrentProfile().catch(() => null);
  if (profile) redirect(profile.is_admin ? "/admin" : "/mon-compte");

  const { suite, erreur } = await searchParams;
  const [settings, goalsData] = await Promise.all([getSettings().catch(() => null), getGoals().catch(() => null)]);
  const goals = goalsData?.goals ?? [];
  const childName = settings?.child_name ?? "Lory";

  return (
    <div className="mx-auto grid max-w-4xl gap-8 py-6 md:grid-cols-2 md:items-center">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">Saint-Charles-de-Drummond</p>
        <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
          {childName} ramasse vos cannettes vides, directement chez vous.
        </h1>
        <p className="mt-4 text-gray-600">
          Créez votre compte, entrez votre adresse et choisissez une date. {childName} passe chercher vos
          sacs et les consignes servent à financer son objectif.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-gray-700">
          <li>✅ Gratuit et sans engagement</li>
          <li>📅 Choisissez la journée qui vous convient</li>
          <li>🔁 Possibilité de collecte récurrente</li>
          <li>♻️ Un geste simple pour l&apos;environnement et pour un projet jeunesse</li>
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/a-propos" className="font-semibold text-brand-700 hover:underline">
            En savoir plus sur le projet
          </Link>
          <span className="mx-2 text-gray-300">·</span>
          <Link href="/historique" className="font-semibold text-brand-700 hover:underline">
            Historique des collectes
          </Link>
        </p>
        {goals.length > 0 && settings?.show_goal_to_citizens && (
          <div className="mt-6">
            <GoalList goals={goals} />
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">Connexion / Inscription</h2>
        <p className="mt-1 text-sm text-gray-500">Déjà inscrit ? Connectez-vous. Sinon, créez votre compte en 30 secondes.</p>
        {erreur === "lien" && (
          <p className="alert-error mt-3">Ce lien est invalide ou expiré. Demandez-en un nouveau ci-dessous.</p>
        )}
        <div className="mt-4">
          <LoginForm suite={suite} />
        </div>
      </div>
    </div>
  );
}
