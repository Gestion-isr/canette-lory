import Link from "next/link";
import { addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";
import { getGoals, getSettings } from "@/lib/data";
import { toISODate } from "@/lib/availability";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";
import { DepositForm } from "@/components/admin/DepositForm";
import { DepositList } from "@/components/admin/DepositList";
import { GoalManager } from "@/components/admin/GoalManager";
import type { Deposit, PickupWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const today = toISODate(new Date());
  const weekEnd = toISODate(addDays(new Date(), 7));

  const [settings, { goals, funds, surplus }, { data: deposits }, { count: pendingCount }, { count: doneCount }, { data: upcoming }, { count: citizens }] =
    await Promise.all([
      getSettings(),
      getGoals(),
      admin.from("deposits").select("*").order("deposited_at", { ascending: false }).limit(10),
      admin.from("pickup_requests").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
      admin.from("pickup_requests").select("*", { count: "exact", head: true }).eq("status", "completee"),
      admin
        .from("pickup_requests")
        .select("*, profiles(full_name, email, phone, address, lat, lng, pickup_note)")
        .eq("status", "en_attente")
        .gte("requested_date", today)
        .lte("requested_date", weekEnd)
        .order("requested_date"),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_admin", false),
    ]);

  const totalAmount = funds.total_amount;
  const totalDonations = funds.total_donations;
  const totalPersonal = funds.total_personal;
  const totalCans = funds.total_cans;

  const tiles = [
    { label: "Argent récolté (total)", value: formatMoney(totalAmount), icon: "💰" },
    { label: "Consignes", value: formatMoney(totalAmount - totalDonations - totalPersonal), icon: "🥫", sub: `${formatNumber(totalCans)} cannettes` },
    { label: "Dons", value: formatMoney(totalDonations), icon: "💛" },
    { label: "Argent personnel", value: formatMoney(totalPersonal), icon: "🐷" },
    { label: "Collectes en attente", value: formatNumber(pendingCount ?? 0), icon: "📋" },
    { label: "Collectes complétées", value: formatNumber(doneCount ?? 0), icon: "✅" },
    { label: "Citoyens inscrits", value: formatNumber(citizens ?? 0), icon: "🏘️" },
  ];

  const byDate = new Map<string, PickupWithProfile[]>();
  for (const p of (upcoming ?? []) as PickupWithProfile[]) {
    byDate.set(p.requested_date, [...(byDate.get(p.requested_date) ?? []), p]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <span className="badge bg-brand-100 text-brand-800">{settings.season === "ete" ? "☀️ Mode été" : "❄️ Mode hiver"}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="card !p-4">
            <p className="text-xl">{t.icon}</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{t.value}</p>
            <p className="text-xs text-gray-500">
              {t.label}
              {"sub" in t && t.sub ? <span className="block text-gray-400">{t.sub}</span> : null}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <GoalManager goals={goals} funds={funds} surplus={surplus} />
        </section>

        <section className="card">
          <h2 className="mb-3 text-lg font-bold">💰 Ajouter de l'argent à la cagnotte</h2>
          <DepositForm today={today} />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">🚲 Prochains 7 jours</h2>
            <Link href="/admin/carte" className="btn-secondary btn-sm">
              Voir la carte
            </Link>
          </div>
          {byDate.size === 0 ? (
            <p className="text-sm text-gray-500">Aucune collecte planifiée cette semaine.</p>
          ) : (
            <div className="space-y-3">
              {[...byDate.entries()].map(([date, list]) => (
                <div key={date}>
                  <Link href={`/admin/carte?date=${date}`} className="text-sm font-semibold capitalize text-brand-700 hover:underline">
                    {formatDateShort(date)} · {list.length} arrêt{list.length > 1 ? "s" : ""}
                  </Link>
                  <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
                    {list.map((p) => (
                      <li key={p.id}>
                        {p.profiles?.full_name ?? p.profiles?.email} — {p.profiles?.address ?? "adresse manquante"}
                        {p.estimated_bags ? ` (${p.estimated_bags} sac${p.estimated_bags > 1 ? "s" : ""})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 text-lg font-bold">📒 Derniers dépôts</h2>
          <DepositList deposits={(deposits ?? []) as Deposit[]} />
        </section>
      </div>
    </div>
  );
}
