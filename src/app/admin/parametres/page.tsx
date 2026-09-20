import { getBlockedDates, getSettings } from "@/lib/data";
import { toISODate } from "@/lib/availability";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const [settings, blocked] = await Promise.all([getSettings(), getBlockedDates()]);
  const today = toISODate(new Date());
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <SettingsForm settings={settings} blocked={blocked.filter((b) => b.date >= today)} />
    </div>
  );
}
