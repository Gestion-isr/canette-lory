import { getBlockedDates, getSettings } from "@/lib/data";
import { getCurrentProfile } from "@/lib/supabase/server";
import { PasswordForm } from "@/components/PasswordForm";
import { toISODate } from "@/lib/availability";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const [settings, blocked, profile] = await Promise.all([getSettings(), getBlockedDates(), getCurrentProfile()]);
  const today = toISODate(new Date());
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <SettingsForm settings={settings} blocked={blocked.filter((b) => b.date >= today)} />

      <section className="card">
        <h2 className="text-lg font-bold">🔐 Mon compte</h2>
        <p className="mb-3 text-sm text-gray-500">Connecté en tant que {profile?.email}</p>
        <PasswordForm />
      </section>
    </div>
  );
}
