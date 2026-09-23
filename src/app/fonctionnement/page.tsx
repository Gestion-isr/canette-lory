import Link from "next/link";
import { getSettings } from "@/lib/data";
import { getCurrentProfile } from "@/lib/supabase/server";
import { ContainerGuide } from "@/components/ContainerGuide";
import { WEEKDAY_LABELS } from "@/lib/types";
import { activeDays } from "@/lib/availability";

export const dynamic = "force-dynamic";

/** Liste lisible des jours de collecte : « les samedis et dimanches », « tous les jours »… */
function joursTexte(days: number[]): string {
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d));
  if (ordered.length === 0) return "aucune journée pour le moment";
  if (ordered.length === 7) return "tous les jours de la semaine";
  const noms = ordered.map((d) => WEEKDAY_LABELS[d].toLowerCase() + "s");
  if (noms.length === 1) return `les ${noms[0]}`;
  return `les ${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

export default async function FonctionnementPage() {
  const [settings, profile] = await Promise.all([getSettings(), getCurrentProfile().catch(() => null)]);
  const name = settings.child_name;
  const jours = joursTexte(activeDays(settings));

  const etapes = [
    { n: "1", t: "Créez votre compte", d: "Courriel et mot de passe. Ça prend 30 secondes." },
    { n: "2", t: "Entrez votre adresse", d: "Elle apparaît sur la carte de collecte, et vous pouvez ajouter une note (ex. : sac du côté droit)." },
    { n: "3", t: "Choisissez une date", d: `Un calendrier montre les journées disponibles. ${name} passe chercher vos sacs cette journée-là.` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">Fonctionnement</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Comment ça marche</h1>
        <p className="mt-2 text-gray-600">
          Un service gratuit, sans engagement : vous demandez une collecte quand ça vous convient, {name} passe la chercher à votre porte.
        </p>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">📋 En trois étapes</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {etapes.map((s) => (
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

      <section className="card border-l-4 border-l-brand-600">
        <h2 className="mb-2 text-lg font-bold">🛡️ Sécurité avant tout</h2>
        <ul className="space-y-1.5 text-gray-700">
          <li>• {name} n&apos;entrera dans <strong>aucune maison</strong> : les sacs sont laissés à l&apos;extérieur, près de l&apos;entrée.</li>
          <li>• Un <strong>adulte est présent</strong> lors de chaque passage.</li>
          <li>• Tout geste ou comportement déplacé sera <strong>rapporté aux autorités</strong>.</li>
        </ul>
      </section>

      <div>
        <h2 className="mb-1 text-lg font-bold">🥫 Quoi mettre dans le sac</h2>
        <p className="mb-3 text-sm text-gray-500">
          Au Québec, la consigne s&apos;applique aux contenants de boisson de 100 ml à 2 L en aluminium et en plastique, ainsi qu&apos;aux
          bouteilles de verre de bière et de boisson gazeuse.
        </p>
        <ContainerGuide />
        <p className="mt-3 text-xs text-gray-500">
          Un doute sur un contenant ? Cherchez le logo de la consigne imprimé dessus, ou consultez{" "}
          <a
            href="https://consignaction.ca/consigne/quoi-consigner/contenants-vises-non-vises/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline"
          >
            la liste officielle de Consignaction
          </a>
          . Dans le doute, mettez-le dans le sac : {name} fera le tri.
        </p>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">💡 Bon à savoir</h2>
        <dl className="space-y-3 text-sm">
          {[
            { q: "Quand les collectes ont-elles lieu ?", r: `Présentement ${jours}. Le calendrier affiche seulement les journées disponibles.` },
            { q: "Combien ça coûte ?", r: "Rien. Le service est entièrement gratuit." },
            { q: "Où laisser mes sacs ?", r: "À l'extérieur, bien visibles près de l'entrée, le matin de la collecte. Ajoutez une note à votre profil si l'emplacement est particulier." },
            { q: "Dois-je rincer les contenants ?", r: "Un rinçage rapide est apprécié, mais ce n'est pas obligatoire. Fermez simplement le sac." },
            { q: "Puis-je avoir une collecte régulière ?", r: "Oui. Au moment de la demande, choisissez une répétition (chaque semaine, aux 2 semaines, etc.). La prochaine date est planifiée automatiquement." },
            { q: "Et si je dois annuler ?", r: "Allez dans « Mon compte » et annulez la collecte. C'est possible à tout moment, sans explication." },
          ].map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-gray-900">{f.q}</dt>
              <dd className="text-gray-600">{f.r}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card bg-sun-400/15 ring-sun-500/40">
        <h2 className="mb-1 text-lg font-bold">💛 Les dons sont acceptés</h2>
        <p className="text-gray-700">
          Que ce soit 25 ¢ ou 1 $, chaque dollar fait une différence ! Vous pouvez glisser votre don dans le sac de cannettes le jour de la
          collecte.
        </p>
      </section>

      <p className="text-center text-sm text-gray-500">
        <Link href="/a-propos" className="text-brand-700 hover:underline">
          Faire connaissance avec {name} →
        </Link>
      </p>
    </div>
  );
}
