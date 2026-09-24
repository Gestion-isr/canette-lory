import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { getAvailability, getSettings } from "@/lib/data";
import { ProfileForm } from "@/components/ProfileForm";
import { PickupRequestForm } from "@/components/PickupRequestForm";
import { CitizenPickupList } from "@/components/CitizenPickupList";
import { PasswordForm } from "@/components/PasswordForm";
import type { PickupRequest, Recurrence } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MonComptePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  const supabase = await createClient();
  const settings = await getSettings();
  const [availability, { data: pickups }, { data: recurrences }] = await Promise.all([
    getAvailability(settings),
    supabase.from("pickup_requests").select("*").eq("user_id", profile.id).order("requested_date", { ascending: false }),
    supabase.from("recurrences").select("*").eq("user_id", profile.id).eq("active", true),
  ]);

  const hasAddress = !!profile.address && profile.lat != null && profile.lng != null;
  const activeRec = (recurrences ?? []) as Recurrence[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-sm text-gray-500">{profile.email}</p>
        <div className="mt-2">
          <PasswordForm />
        </div>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">🏠 Mon adresse</h2>
        <ProfileForm profile={profile} />
      </section>

      <section className="card">
        <h2 className="mb-1 text-lg font-bold">📅 Demander une collecte</h2>
        <p className="mb-3 text-sm text-gray-500">
          {settings.season === "ete"
            ? "Période estivale : collectes possibles tous les jours indiqués en vert."
            : "Période hivernale : collectes la fin de semaine seulement."}
        </p>
        <PickupRequestForm
          availability={availability}
          hasAddress={hasAddress}
          hasActiveRecurrence={activeRec.length > 0}
          pickupNote={profile.pickup_note}
        />
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">🗓️ Mes collectes</h2>
        <CitizenPickupList pickups={(pickups ?? []) as PickupRequest[]} recurrences={activeRec} />
      </section>
    </div>
  );
}
