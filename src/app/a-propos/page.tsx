import Link from "next/link";
import { getGoalProgress, getSettings } from "@/lib/data";
import { getCurrentProfile } from "@/lib/supabase/server";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { SimpleText } from "@/components/SimpleText";
import { defaultAboutText } from "@/lib/about";

export const dynamic = "force-dynamic";

export default async function AProposPage() {
  const [settings, goal, profile] = await Promise.all([getSettings(), getGoalProgress(), getCurrentProfile().catch(() => null)]);
  const text = settings.about_text?.trim() || defaultAboutText(settings.child_name);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">À propos</p>
        <h1 className="text-3xl font-extrabold text-gray-900">La collecte de cannettes de {settings.child_name}</h1>
      </div>

      <section className="card border-l-4 border-l-brand-600">
        <h2 className="mb-2 text-lg font-bold">🛡️ Sécurité avant tout</h2>
        <ul className="space-y-1.5 text-gray-700">
          <li>• {settings.child_name} n&apos;entrera dans <strong>aucune maison</strong> : les sacs sont laissés à l&apos;extérieur, près de l&apos;entrée.</li>
          <li>• Un <strong>adulte est présent</strong> lors de chaque passage.</li>
          <li>• Tout geste ou comportement déplacé sera <strong>rapporté aux autorités</strong>.</li>
        </ul>
      </section>

      <section className="card">
        <SimpleText text={text} />
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">Comment ça marche</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Créez votre compte", d: "Courriel et mot de passe, 30 secondes." },
            { n: "2", t: "Entrez votre adresse", d: "Elle apparaît sur la carte de collecte." },
            { n: "3", t: "Choisissez une date", d: `${settings.child_name} passe chercher vos sacs.` },
          ].map((s) => (
            <li key={s.n} className="rounded-xl bg-brand-50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{s.n}</span>
              <p className="mt-2 font-semibold">{s.t}</p>
              <p className="text-sm text-gray-600">{s.d}</p>
            </li>
          ))}
        </ol>
        {!profile && (
          <Link href="/" className="btn-primary mt-4 w-full sm:w-auto">
            Créer mon compte
          </Link>
        )}
      </section>

      {goal && settings.show_goal_to_citizens && <GoalProgressBar goal={goal} />}

      <section className="card bg-sun-400/15 ring-sun-500/40">
        <h2 className="mb-1 text-lg font-bold">💛 Les dons sont acceptés</h2>
        <p className="text-gray-700">
          Que ce soit 25 ¢ ou 1 $, chaque dollar fait une différence ! Vous pouvez glisser votre don dans le sac de cannettes le jour de la
          collecte.
        </p>
      </section>

      <p className="text-center text-sm text-gray-500">
        <Link href="/historique" className="text-brand-700 hover:underline">
          Voir l&apos;historique des collectes →
        </Link>
      </p>
    </div>
  );
}
