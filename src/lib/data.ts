import { addDays } from "date-fns";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { computeAvailability, toISODate, type DayAvailability } from "@/lib/availability";
import { allocateFunds } from "@/lib/goals";
import type { Funds, Goal, GoalProgress, Settings } from "@/lib/types";

/**
 * Les paramètres contiennent l'adresse de la maison : la table n'est donc lisible
 * que par les admins (RLS). On la lit ici côté serveur avec la clé service, et les
 * pages publiques n'en affichent que le prénom, la saison et les jours de collecte.
 */
export async function getSettings(): Promise<Settings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error("Paramètres introuvables. As-tu exécuté la migration SQL ?");
  return data as Settings;
}

export async function getBlockedDates(): Promise<{ date: string; reason: string | null }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("blocked_dates").select("*").order("date");
  return data ?? [];
}

export async function getAvailability(settings?: Settings): Promise<DayAvailability[]> {
  const supabase = createAdminClient();
  const s = settings ?? (await getSettings());
  const today = new Date();
  const from = toISODate(today);
  const to = toISODate(addDays(today, s.horizon_days));
  const [{ data: blocked }, { data: counts }] = await Promise.all([
    supabase.from("blocked_dates").select("date").gte("date", from).lte("date", to),
    supabase.rpc("get_pickup_counts", { from_date: from, to_date: to }),
  ]);
  const countsByDate: Record<string, number> = {};
  for (const c of (counts ?? []) as { requested_date: string; cnt: number }[]) countsByDate[c.requested_date] = Number(c.cnt);
  return computeAvailability({
    settings: s,
    blockedDates: (blocked ?? []).map((b: { date: string }) => b.date),
    countsByDate,
    today,
  });
}

export async function getFunds(): Promise<Funds> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_funds_summary");
  const row = (data as Partial<Funds>[] | null)?.[0] ?? {};
  const total_amount = Number(row.total_amount ?? 0);
  const spent_amount = Number(row.spent_amount ?? 0);
  return {
    total_amount,
    total_donations: Number(row.total_donations ?? 0),
    total_cans: Number(row.total_cans ?? 0),
    spent_amount,
    available: Math.max(0, total_amount - spent_amount),
  };
}

/** Objectifs actifs avec leur progression (cascade), plus le résumé de la cagnotte. */
export async function getGoals(): Promise<{ goals: GoalProgress[]; funds: Funds; surplus: number }> {
  const supabase = await createClient();
  const [funds, { data }] = await Promise.all([
    getFunds(),
    supabase.from("goals").select("*").eq("active", true).order("position").order("created_at"),
  ]);
  const goals = ((data ?? []) as Goal[]).map((g) => ({ ...g, target_amount: Number(g.target_amount) }));
  const { goals: allocated, surplus } = allocateFunds(goals, funds.available);
  return { goals: allocated, funds, surplus };
}
