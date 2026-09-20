import { createAdminClient } from "@/lib/supabase/server";
import { getAvailability, getSettings } from "@/lib/data";
import { CitizensPanel } from "@/components/admin/CitizensPanel";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CitoyensPage() {
  const admin = createAdminClient();
  const settings = await getSettings();
  const [availability, { data: profiles }, { data: requests }] = await Promise.all([
    getAvailability(settings),
    admin.from("profiles").select("*").eq("is_admin", false).order("full_name"),
    admin.from("pickup_requests").select("user_id, status"),
  ]);

  const counts = new Map<string, { pending: number; done: number }>();
  for (const r of requests ?? []) {
    const c = counts.get(r.user_id) ?? { pending: 0, done: 0 };
    if (r.status === "en_attente") c.pending++;
    if (r.status === "completee") c.done++;
    counts.set(r.user_id, c);
  }

  const citizens = ((profiles ?? []) as Profile[]).map((p) => ({ ...p, ...(counts.get(p.id) ?? { pending: 0, done: 0 }) }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Citoyens</h1>
        <p className="text-sm text-gray-500">{citizens.length} inscrit(s)</p>
      </div>
      <CitizensPanel citizens={citizens} home={{ lat: settings.home_lat, lng: settings.home_lng }} availability={availability} />
    </div>
  );
}
