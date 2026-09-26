import Link from "next/link";
import { getGoals, getSettings } from "@/lib/data";
import { GoalList } from "@/components/GoalProgressBar";
import { SimpleText } from "@/components/SimpleText";
import { defaultAboutText } from "@/lib/about";

export const dynamic = "force-dynamic";

export default async function AProposPage() {
  const [settings, { goals, funds }] = await Promise.all([getSettings(), getGoals()]);
  const text = settings.about_text?.trim() || defaultAboutText(settings.child_name);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">À propos</p>
        <h1 className="text-3xl font-extrabold text-gray-900">La collecte de cannettes de {settings.child_name}</h1>
      </div>

      <section className="card">
        <SimpleText text={text} />
      </section>

      {goals.length > 0 && settings.show_goal_to_citizens && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">🎯 Mes objectifs</h2>
          <GoalList goals={goals} funds={funds} />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
        <Link href="/fonctionnement" className="text-brand-700 hover:underline">
          Comment ça marche →
        </Link>
        <Link href="/historique" className="text-brand-700 hover:underline">
          Historique des collectes →
        </Link>
      </div>
    </div>
  );
}
