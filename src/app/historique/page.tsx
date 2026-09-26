import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/availability";
import { getFunds } from "@/lib/data";
import { FundsDonut } from "@/components/FundsDonut";

import { formatDateLong, formatMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Une journée de l'historique : les arrêts chez les citoyens de cette date,
 * et/ou les cannettes rapportées au comptoir ce jour-là (montant réel encaissé).
 */
type Journee = { date: string; arrets: number; cans: number; cansDepot: number; montantDepot: number };

export default async function HistoriquePage() {
  // Lecture avec la clé service : seules des données agrégées (sans nom ni adresse) sont affichées.
  const admin = createAdminClient();
  const [funds, { data: deposits }, { data: pickups }, { data: pastGoals }, { count: citizens }] = await Promise.all([
    getFunds(),
    admin.from("deposits").select("amount, cans_count, kind, deposited_at"),
    admin
      .from("pickup_requests")
      .select("requested_date, cans_count, status")
      .neq("status", "annulee")
      .lte("requested_date", toISODate(new Date()))
      .order("requested_date", { ascending: false }),
    admin
      .from("goals")
      .select("title, target_amount, achieved_at, image_url")
      .not("achieved_at", "is", null)
      .order("achieved_at", { ascending: false }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_admin", false),
  ]);

  const totalDonations = funds.total_donations;
  const totalPersonal = funds.total_personal;
  const consignes = funds.total_amount - totalDonations - totalPersonal;
  const cansDeposes = (deposits ?? []).reduce((s, d) => s + (d.cans_count ?? 0), 0);

  // Valeur moyenne réellement obtenue par cannette (0,10 $ tant qu'aucun dépôt n'est enregistré)
  const valeurParCannette = cansDeposes > 0 ? consignes / cansDeposes : 0.1;

  // Les arrêts d'une même journée sont regroupés : c'est « une collecte » pour le public.
  const parJour = new Map<string, Journee>();
  const jour = (date: string) => {
    const j = parJour.get(date) ?? { date, arrets: 0, cans: 0, cansDepot: 0, montantDepot: 0 };
    parJour.set(date, j);
    return j;
  };
  for (const p of pickups ?? []) {
    const j = jour(p.requested_date);
    j.arrets++;
    j.cans += p.cans_count ?? 0;
  }
  // Les journées où des cannettes ont été rapportées comptent aussi dans l'historique,
  // même si elles ne venaient pas d'un citoyen (ex. les cannettes de la maison).
  for (const d of deposits ?? []) {
    if (d.kind !== "cannettes") continue;
    const j = jour(d.deposited_at);
    j.cansDepot += d.cans_count ?? 0;
    j.montantDepot += Number(d.amount);
  }
  const journees = [...parJour.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  const maxCans = Math.max(1, ...journees.map((j) => Math.max(j.cans, j.cansDepot)));
  const cansCollectes = journees.reduce((s, j) => s + j.cans, 0);

  const tiles = [
    { icon: "🥫", value: formatNumber(Math.max(cansDeposes, cansCollectes)), label: "cannettes ramassées" },
    { icon: "💰", value: formatMoney(consignes), label: "en consignes" },
    { icon: "💛", value: formatMoney(totalDonations), label: "en dons" },
    { icon: "🐷", value: formatMoney(totalPersonal), label: "argent personnel" },
    { icon: "✅", value: formatNumber((pickups ?? []).filter((p) => p.status === "completee").length), label: "collectes complétées" },
    { icon: "🏘️", value: formatNumber(citizens ?? 0), label: "foyers participants" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">Historique</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Le chemin parcouru</h1>
        <p className="mt-2 text-gray-600">Merci à tous ceux qui participent — voici ce que chaque journée de collecte a donné.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="card !p-4 text-center">
            <p className="text-2xl">{t.icon}</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{t.value}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </div>
        ))}
      </div>

      {funds.total_amount > 0 && (
        <section className="card">
          <h2 className="mb-3 text-lg font-bold">D&apos;où vient l&apos;argent</h2>
          <FundsDonut funds={funds} />
        </section>
      )}

      <section className="card">
        <h2 className="mb-1 text-lg font-bold">📅 Chaque collecte</h2>
        <p className="mb-4 text-xs text-gray-500">
          Les montants des journées déjà rapportées au comptoir sont exacts ; les autres sont estimés (≈) à partir du nombre de cannettes.
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
                    {j.arrets > 0 && (
                      <>
                        {j.arrets} arrêt{j.arrets > 1 ? "s" : ""}
                        {" · "}
                      </>
                    )}
                    {j.montantDepot > 0 ? (
                      <>
                        {j.cansDepot > 0 && <>{formatNumber(j.cansDepot)} cannettes · </>}
                        <span className="font-semibold text-brand-700">{formatMoney(j.montantDepot)}</span>
                      </>
                    ) : j.cans > 0 ? (
                      <>
                        {formatNumber(j.cans)} cannettes
                        <span className="font-semibold text-brand-700"> · ≈ {formatMoney(j.cans * valeurParCannette)}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">comptage à venir</span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round((Math.max(j.cans, j.cansDepot) / maxCans) * 100)}%` }}
                  />
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
