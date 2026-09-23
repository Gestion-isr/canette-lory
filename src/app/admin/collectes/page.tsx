import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/availability";
import { formatDateLong } from "@/lib/format";
import { PickupRow } from "@/components/admin/PickupRow";
import type { PickupStatus, PickupWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: { key: string; label: string }[] = [
  { key: "a_venir", label: "À venir" },
  { key: "passees", label: "En retard" },
  { key: "completee", label: "Complétées" },
  { key: "annulee", label: "Annulées" },
  { key: "toutes", label: "Toutes" },
];

export default async function CollectesPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const { filtre = "a_venir" } = await searchParams;
  const admin = createAdminClient();
  const today = toISODate(new Date());

  let query = admin.from("pickup_requests").select("*, profiles(full_name, email, phone, address, lat, lng, pickup_note)");
  if (filtre === "a_venir") query = query.eq("status", "en_attente").gte("requested_date", today).order("requested_date");
  else if (filtre === "passees") query = query.eq("status", "en_attente").lt("requested_date", today).order("requested_date", { ascending: false });
  else if (filtre === "completee" || filtre === "annulee")
    query = query.eq("status", filtre as PickupStatus).order("requested_date", { ascending: false }).limit(200);
  else query = query.order("requested_date", { ascending: false }).limit(300);

  const { data } = await query;
  const pickups = (data ?? []) as PickupWithProfile[];

  const byDate = new Map<string, PickupWithProfile[]>();
  for (const p of pickups) byDate.set(p.requested_date, [...(byDate.get(p.requested_date) ?? []), p]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Collectes</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/collectes?filtre=${f.key}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filtre === f.key ? "bg-brand-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {pickups.length === 0 ? (
        <p className="card text-sm text-gray-500">Rien à afficher.</p>
      ) : (
        <div className="space-y-4">
          {[...byDate.entries()].map(([date, list]) => (
            <section key={date} className="card">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-bold capitalize">
                  {formatDateLong(date)} <span className="ml-1 text-sm font-normal text-gray-500">({list.length})</span>
                </h2>
                {list.some((p) => p.status === "en_attente") && (
                  <Link href={`/admin/carte?date=${date}`} className="btn-secondary btn-sm">
                    🗺️ Trajet
                  </Link>
                )}
              </div>
              <ul className="divide-y divide-gray-100">
                {list.map((p) => (
                  <PickupRow key={p.id} pickup={p} showDate={false} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
