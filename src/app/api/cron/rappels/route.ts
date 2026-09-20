import { NextResponse, type NextRequest } from "next/server";
import { addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/availability";
import { sendReminder } from "@/lib/email";

/**
 * Envoie un rappel la veille aux citoyens qui ont une collecte demain.
 * Appelé par Vercel Cron (voir vercel.json) une fois par jour.
 * Protégé par l'en-tête Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const tomorrow = toISODate(addDays(new Date(), 1));

  const [{ data: settings }, { data: pickups }] = await Promise.all([
    admin.from("settings").select("child_name").eq("id", 1).single(),
    admin
      .from("pickup_requests")
      .select("id, requested_date, profiles(email, full_name)")
      .eq("status", "en_attente")
      .eq("requested_date", tomorrow)
      .is("reminder_sent_at", null),
  ]);

  let sent = 0;
  for (const p of pickups ?? []) {
    const prof = p.profiles as unknown as { email: string; full_name: string | null } | null;
    if (!prof) continue;
    await sendReminder({ to: prof.email, name: prof.full_name, date: p.requested_date, childName: settings?.child_name ?? "Lory" });
    await admin.from("pickup_requests").update({ reminder_sent_at: new Date().toISOString() }).eq("id", p.id);
    sent++;
  }

  return NextResponse.json({ ok: true, date: tomorrow, sent });
}
