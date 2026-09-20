import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { createAdminClient } from "@/lib/supabase/server";
import { getGoalProgress, getSettings } from "@/lib/data";
import { formatDateLong, formatMoney, formatNumber } from "@/lib/format";
import { GoalProgressBar } from "@/components/GoalProgressBar";

export const dynamic = "force-dynamic";

type MonthRow = { key: string; label: string; amount: number; donations: number; cans: number; pickups: number };

export default async function HistoriquePage() {
  // Lecture côté serveur avec la clé service : seules des données agrégées (sans nom) sont affichées.
  const admin = createAdminClient();
  const [settings, goal, { data: deposits }, { data: pickups }, { data: pastGoals }, { count: citizens }] = await Promise.all([
    getSettings(),
    getGoalProgress(),
    admin.from("deposits").select("amount, cans_count, deposited_at, kind").order("deposited_at"),
    admin.from("pickup_requests").select("requested_date").eq("status", "completee").order("requested_date"),
    admin.from("goals").select("title, target_amount, achieved_at, started_at").not("achieved_at", "is", null).order("achieved_at", { ascending: false }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_admin", false),
  ]);

  const months = new Map<string, MonthRow>();
  const row = (iso: string) => {
    const key = iso.slice(0, 7);
    if (!months.has(key)) {
      months.set(key, { key, label: format(parseISO(`${key}-01`), "MMMM yyyy", { locale: fr }), amount: 0, donations: 0, cans: 0, pickups: 0 });
    }
    return months.get(key)!;
  };
  for (const d of deposits ?? []) {
    const r = row(d.deposited_at);
    r.amount += Number(d.amount);
    if (d.kind === "don") r.donations += Number(d.amount);
    r.cans += d.cans_count ?? 0;
  }
  for (const p of pickups ?? []) row(p.requested_date).pickups++;

  const rows = [...months.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  const totalAmount = (deposits ?? []).reduce((s, d) => s + Number(d.amount), 0);
  const totalDonations = (deposits ?? []).filter((d) => d.kind === "don").reduce((s, d) => s + Number(d.amount), 0);
  const totalCans = (deposits ?? []).reduce((s, d) => s + (d.cans_count ?? 0), 0);
  const maxAmount = Math.max(1, ...rows.map((r) => r.amount));
  const firstDate = deposits?.[0]?.deposited_at ?? pickups?.[0]?.requested_date;

  const tiles = [
    { icon: "🥫", value: formatNumber(totalCans), label: "cannettes ramassées" },
    { icon: "💰", value: formatMoney(totalAmount - totalDonations), label: "en consignes" },
    { icon: "💛", value: formatMoney(totalDonations), label: "en dons" },
    { icon: "✅", value: formatNumber(pickups?.length ?? 0), label: "collectes complétées" },
    { icon: "🏘️", value: formatNumber(citizens ?? 0), label: "foyers participants" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-600">Historique</p>
        <h1 className="text-3xl font-extrabold text-gray-900">Le chemin parcouru</h1>
        {firstDate && <p className="mt-1 text-sm text-gray-500">Depuis le {formatDateLong(firstDate)}</p>}
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

      {goal && settings.show_goal_to_citizens && <GoalProgressBar goal={goal} />}

      {(pastGoals ?? []).length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-lg font-bold">🏆 Objectifs atteints</h2>
          <ul className="divide-y divide-gray-100">
            {(pastGoals ?? []).map((g) => (
              <li key={`${g.title}-${g.achieved_at}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-medium">🎉 {g.title}</span>
                <span className="text-gray-500">
                  {formatMoney(Number(g.target_amount))} · {format(parseISO(g.achieved_at!), "d MMMM yyyy", { locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">📅 Mois par mois</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">L&apos;aventure commence à peine — revenez bientôt !</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold capitalize">{r.label}</span>
                  <span className="text-gray-600">
                    {r.cans > 0 && <>{formatNumber(r.cans)} cannettes · </>}
                    {r.pickups > 0 && <>{r.pickups} collecte{r.pickups > 1 ? "s" : ""} · </>}
                    {r.donations > 0 && <>💛 {formatMoney(r.donations)} · </>}
                    <span className="font-semibold text-brand-700">{formatMoney(r.amount)}</span>
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((r.amount / maxAmount) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-sm text-gray-500">
        <Link href="/a-propos" className="text-brand-700 hover:underline">
          ← En savoir plus sur le projet
        </Link>
      </p>
    </div>
  );
}
