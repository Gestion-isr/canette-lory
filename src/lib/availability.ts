import { addDays, format, parseISO, getDay, startOfDay } from "date-fns";
import type { Settings } from "@/lib/types";

export type AvailabilityInput = {
  settings: Pick<Settings, "season" | "summer_days" | "winter_days" | "min_notice_days" | "max_per_day" | "horizon_days">;
  blockedDates: string[]; // YYYY-MM-DD
  countsByDate: Record<string, number>; // YYYY-MM-DD -> nb de demandes en attente
  today?: Date;
};

export type DayAvailability = {
  date: string; // YYYY-MM-DD
  available: boolean;
  reason?: "passe" | "preavis" | "jour_ferme" | "bloque" | "complet";
  remaining?: number;
};

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function activeDays(settings: AvailabilityInput["settings"]): number[] {
  return settings.season === "ete" ? settings.summer_days : settings.winter_days;
}

/** Calcule la disponibilité de chaque jour dans l'horizon configuré. */
export function computeAvailability(input: AvailabilityInput): DayAvailability[] {
  const { settings, blockedDates, countsByDate } = input;
  const today = startOfDay(input.today ?? new Date());
  const firstAllowed = addDays(today, settings.min_notice_days);
  const days = activeDays(settings);
  const blocked = new Set(blockedDates);
  const out: DayAvailability[] = [];

  for (let i = 0; i <= settings.horizon_days; i++) {
    const d = addDays(today, i);
    const iso = toISODate(d);
    const count = countsByDate[iso] ?? 0;
    const remaining = Math.max(0, settings.max_per_day - count);

    let reason: DayAvailability["reason"];
    if (d < firstAllowed) reason = "preavis";
    else if (!days.includes(getDay(d))) reason = "jour_ferme";
    else if (blocked.has(iso)) reason = "bloque";
    else if (remaining <= 0) reason = "complet";

    out.push({ date: iso, available: !reason, reason, remaining });
  }
  return out;
}

export function isDateAvailable(iso: string, input: AvailabilityInput): boolean {
  const list = computeAvailability(input);
  return list.some((d) => d.date === iso && d.available);
}

/** Prochaine date disponible à partir d'une date donnée (utilisé pour la récurrence). */
export function nextAvailableFrom(fromIso: string, input: AvailabilityInput): string | null {
  const from = parseISO(fromIso);
  const list = computeAvailability({ ...input, today: from, settings: { ...input.settings, min_notice_days: 0 } });
  return list.find((d) => d.available)?.date ?? null;
}
