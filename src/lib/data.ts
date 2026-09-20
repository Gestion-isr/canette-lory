import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { computeAvailability, toISODate, type DayAvailability } from "@/lib/availability";
import type { GoalProgress, Settings } from "@/lib/types";

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error("Paramètres introuvables. As-tu exécuté la migration SQL ?");
  return data as Settings;
}

export async function getBlockedDates(): Promise<{ date: string; reason: string | null }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("blocked_dates").select("*").order("date");
  return data ?? [];
}

export async function getAvailability(settings?: Settings): Promise<DayAvailability[]> {
  const supabase = await createClient();
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

export async function getGoalProgress(): Promise<GoalProgress | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_goal_progress");
  const row = (data as GoalProgress[] | null)?.[0];
  if (!row) return null;
  return {
    ...row,
    target_amount: Number(row.target_amount),
    raised_amount: Number(row.raised_amount),
    total_amount: Number(row.total_amount),
    total_cans: Number(row.total_cans),
  };
}
