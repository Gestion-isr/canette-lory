import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { toISODate } from "@/lib/availability";
import { formatDateLong, formatDateShort } from "@/lib/format";
import { RoutePlanner } from "@/components/admin/RoutePlanner";
import type { PickupWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CartePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const admin = createAdminClient();
  const settings = await getSettings();
  const today = toISODate(new Date());

  // Dates ayant des collectes en attente (aujourd'hui et après)
  const { data: dateRows } = await admin
    .from("pickup_requests")
    .select("requested_date")
    .eq("status", "en_attente")
    .gte("requested_date", today)
    .order("requested_date");
  const dates = [...new Set((dateRows ?? []).map((r) => r.requested_date as string))];

  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : dates[0];

  const { data } = date
    ? await admin
        .from("pickup_requests")
        .select("*, profiles(full_name, email, phone, address, lat, lng)")
        .eq("status", "en_attente")
        .eq("requested_date", date)
    : { data: [] };

  const pickups = (data ?? []) as PickupWithProfile[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Carte & trajet</h1>
        {date && <p className="text-sm capitalize text-gray-500">{formatDateLong(date)}</p>}
      </div>

      {dates.length === 0 && !dateParam ? (
        <p className="card text-sm text-gray-500">Aucune collecte en attente. La carte s&apos;affichera dès qu&apos;un citoyen fera une demande.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <Link
                key={d}
                href={`/admin/carte?date=${d}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                  date === d ? "bg-brand-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {formatDateShort(d)}
              </Link>
            ))}
            {dateParam && !dates.includes(dateParam) && (
              <span className="rounded-full bg-gray-200 px-3 py-1.5 text-sm capitalize text-gray-700">{formatDateShort(dateParam)}</span>
            )}
          </div>
          <RoutePlanner pickups={pickups} home={{ lat: settings.home_lat, lng: settings.home_lng, address: settings.home_address }} />
        </>
      )}
    </div>
  );
}
