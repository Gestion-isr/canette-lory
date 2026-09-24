import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getGoals, getSettings } from "@/lib/data";
import { formatDateLong, formatMoney, formatNumber } from "@/lib/format";
import { GoalList } from "@/components/GoalProgressBar";

export const dynamic = "force-dynamic";

/** Une journée de collecte : les arrêts de la journée regroupés. */
type Journee = { date: string; arrets: number; cans: number };

export default async function HistoriquePage() {
  // Lecture avec la clé service : seules des données agrégées (sans nom ni adresse) sont affichées.
  const admin = createAdminClient();
  const [settings, { goals }, { data: deposits }, { data: pickups }, { data: pastGoals }, { count: citizens }] = await Promise.all([
    getSettings(),
    getGoals(),
    admin.from("deposits").select("amount, cans_count, kind"),
    admin
      .from("pickup_requests")
      .select("requested_date, cans_count")
      .eq("status", "completee")
      .order("requested_date", { ascending: false }),
    admin
      .from("goals")
      .select("title, target_amount, achieved_at, image_url")
      .not("achieved_at", "is", null)
      .order("achieved_at", { ascending: false }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_admin", false),
  ]);

  const totalAmount = (deposits ?? []).reduce((s, d) => s + Number(d.amount), 0);
  const totalDonations = (deposits ?? []).filter((d) => d.kind === "don").reduce((s, d) => s + Number(d.amount), 0);
  const consignes = totalAmount - totalDonations;
  const cansDeposes = (deposits ?? []).reduce((s, d) => s + (d.cans_count ?? 0), 0);

  // Valeur moyenne réellement obtenue par cannette (0,10 $ tant qu'aucun dépôt n'est enregistré)
  const valeurParCannette = cansDeposes > 0 ? consignes / cansDeposes : 0.1;

  // Les arrêts d'une même journée sont regroupés : c'est « une collecte » pour le public.
  const parJour = new Map<string, Journee>();
  for (const p of pickups ?? []) {
    const j = parJour.get(p.requested_date) ?? { date: p.requested_date, arrets: 0, cans: 0 };
    j.arrets++;
    j.cans += p.cans_count ?? 0;
    parJour.set(p.requested_date, j);
  }
  const journees = [...parJour.values()];
  const maxCans = Math.max(1, ...journees.map((j) => j.cans));
  const cansCollectes = journees.reduce((s, j) => s + j.cans, 0);

  const tiles = [
    { icon: "🥫", value: formatNumber(Math.max(cansDeposes, cansCollectes)), label: "cannettes ramassées" },
    { icon: "💰", value: formatMoney(consignes), label: "en consignes" },
    { icon: "💛", value: formatMoney(totalDonations), label: "en dons" },
    { icon: "✅", value: formatNumber(pickups?.length ?? 0), label: "collectes complétées" },
    { icon: "🏘️", value: formatNumber(citizens ?? 0), label: "foyers participants" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">Historique</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Le chemin parcouru</h1>
        <p className="mt-2 text-gray-600">Merci à tous ceux qui participent — voici ce que chaque journée de collecte a donné.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="card !p-4 text-center">
            <p className="text-2xl">{t.icon}</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{t.value}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>

      {goals.length > 0 && settings.show_goal_to_citizens && <GoalList goals={goals} />}

      <section className="card">
        <h2 className="mb-1 text-lg font-bold">📅 Chaque collecte</h2>
        <p className="mb-4 text-xs text-gray-500">
          Montants estimés à partir du nombre de cannettes et de la valeur moyenne obtenue au retour des contenants.
        </p>
        {journees.length === 0 ? (
          <p className="text-sm text-gray-500">L&apos;aventure commence à peine — revenez bientôt !</p>
        ) : (
          <ul className="space-y-3">
            {journees.map((j) => (
              <li key={j.date}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="font-semibold capitalize">{formatDateLong(j.date)}</span>
                  <span className="text-gray-600">
                    {j.arrets} arrêt{j.arrets > 1 ? "s" : ""}
                    {j.cans > 0 && (
                      <>
                        {" · "}
                        {formatNumber(j.cans)} cannettes
                        <span className="font-semibold text-brand-700"> · ≈ {formatMoney(j.cans * valeurParCannette)}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((j.cans / maxCans) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(pastGoals ?? []).length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-lg font-bold">🏆 Objectifs atteints</h2>
          <ul className="divide-y divide-gray-100">
            {(pastGoals ?? []).map((g) => (
              <li key={`${g.title}-${g.achieved_at}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-3 font-medium">
                  {g.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image_url} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-black/10" />
                  )}
                  🎉 {g.title}
                </span>
                <span className="text-gray-500">{formatMoney(Number(g.target_amount))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-sm text-gray-500">
        <Link href="/fonctionnement" className="text-brand-700 hover:underline">
          ← Comment ça marche
        </Link>
      </p>
    </div>
  );
}
