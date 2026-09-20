"use server";

import { revalidatePath } from "next/cache";
import { addWeeks, parseISO } from "date-fns";
import { createClient, createAdminClient, getCurrentProfile } from "@/lib/supabase/server";
import { getAvailability, getSettings } from "@/lib/data";
import { computeAvailability, toISODate } from "@/lib/availability";
import { sendCompletionThanks, sendRequestConfirmation } from "@/lib/email";
import type { Settings } from "@/lib/types";

export type ActionState = { ok?: boolean; error?: string; message?: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateAll() {
  revalidatePath("/mon-compte");
  revalidatePath("/admin");
  revalidatePath("/admin/collectes");
  revalidatePath("/admin/carte");
  revalidatePath("/admin/citoyens");
}

// ---------------------------------------------------------------
// Citoyen
// ---------------------------------------------------------------
export async function createPickup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Tu dois être connecté." };
  if (!profile.address || profile.lat == null || profile.lng == null)
    return { error: "Enregistre d'abord ton adresse pour demander une collecte." };

  const date = String(formData.get("date") ?? "");
  const bagsRaw = String(formData.get("estimated_bags") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const recurrenceWeeks = parseInt(String(formData.get("recurrence_weeks") ?? "0"), 10) || 0;

  if (!ISO_DATE.test(date)) return { error: "Choisis une date." };
  const estimated_bags = bagsRaw ? Math.max(1, Math.min(50, parseInt(bagsRaw, 10) || 1)) : null;

  const settings = await getSettings();
  const availability = await getAvailability(settings);
  if (!availability.some((d) => d.date === date && d.available)) return { error: "Cette date n'est plus disponible." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("pickup_requests")
    .select("id")
    .eq("user_id", profile.id)
    .eq("requested_date", date)
    .eq("status", "en_attente")
    .maybeSingle();
  if (existing) return { error: "Tu as déjà une collecte demandée pour cette date." };

  let recurrence_id: string | null = null;
  if (recurrenceWeeks >= 1 && recurrenceWeeks <= 8) {
    const { data: rec, error: recErr } = await supabase
      .from("recurrences")
      .insert({ user_id: profile.id, interval_weeks: recurrenceWeeks })
      .select("id")
      .single();
    if (recErr) return { error: "Impossible de créer la récurrence." };
    recurrence_id = rec.id;
  }

  const { error } = await supabase
    .from("pickup_requests")
    .insert({ user_id: profile.id, requested_date: date, estimated_bags, note, recurrence_id });
  if (error) return { error: "Impossible d'enregistrer la demande." };

  await sendRequestConfirmation({ to: profile.email, name: profile.full_name, date, childName: settings.child_name });
  revalidateAll();
  return { ok: true, message: "Demande enregistrée ! Un courriel de confirmation t'a été envoyé." };
}

export async function cancelPickup(id: string): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Non connecté." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("pickup_requests")
    .update({ status: "annulee" })
    .eq("id", id)
    .eq("user_id", profile.id)
    .eq("status", "en_attente");
  if (error) return { error: "Annulation impossible." };
  revalidateAll();
  return { ok: true };
}

export async function stopRecurrence(id: string): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Non connecté." };
  const supabase = await createClient();
  const q = supabase.from("recurrences").update({ active: false }).eq("id", id);
  const { error } = profile.is_admin ? await q : await q.eq("user_id", profile.id);
  if (error) return { error: "Impossible d'arrêter la récurrence." };
  revalidateAll();
  return { ok: true };
}

// ---------------------------------------------------------------
// Admin
// ---------------------------------------------------------------
async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) throw new Error("Accès refusé.");
  return profile;
}

/** Crée la prochaine occurrence d'une récurrence après une collecte complétée ou annulée. */
async function scheduleNextOccurrence(pickup: { recurrence_id: string | null; requested_date: string; user_id: string }, settings: Settings) {
  if (!pickup.recurrence_id) return;
  const admin = createAdminClient();
  const { data: rec } = await admin.from("recurrences").select("*").eq("id", pickup.recurrence_id).single();
  if (!rec || !rec.active) return;

  const { data: pending } = await admin
    .from("pickup_requests")
    .select("id")
    .eq("recurrence_id", rec.id)
    .eq("status", "en_attente")
    .limit(1);
  if (pending && pending.length > 0) return;

  const target = addWeeks(parseISO(pickup.requested_date), rec.interval_weeks);
  const from = target < new Date() ? new Date() : target;
  const { data: blocked } = await admin.from("blocked_dates").select("date").gte("date", toISODate(from));
  const list = computeAvailability({
    settings: { ...settings, min_notice_days: 0 },
    blockedDates: (blocked ?? []).map((b) => b.date),
    countsByDate: {},
    today: from,
  });
  const next = list.find((d) => d.available)?.date;
  if (!next) return;
  await admin.from("pickup_requests").insert({ user_id: pickup.user_id, requested_date: next, recurrence_id: rec.id });
}

export async function completePickup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cansRaw = String(formData.get("cans_count") ?? "").trim();
  const cans_count = cansRaw ? Math.max(0, parseInt(cansRaw, 10) || 0) : null;

  const admin = createAdminClient();
  const { data: pickup } = await admin
    .from("pickup_requests")
    .select("*, profiles(email, full_name)")
    .eq("id", id)
    .single();
  if (!pickup) return { error: "Collecte introuvable." };

  const { error } = await admin
    .from("pickup_requests")
    .update({ status: "completee", cans_count, completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Mise à jour impossible." };

  const settings = await getSettings();
  await scheduleNextOccurrence(pickup, settings);
  const prof = pickup.profiles as { email: string; full_name: string | null } | null;
  if (prof) {
    await sendCompletionThanks({
      to: prof.email,
      name: prof.full_name,
      date: pickup.requested_date,
      cans: cans_count,
      childName: settings.child_name,
    });
  }
  revalidateAll();
  return { ok: true, message: "Collecte complétée." };
}

export async function adminCancelPickup(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: pickup } = await admin.from("pickup_requests").select("*").eq("id", id).single();
  if (!pickup) return { error: "Introuvable." };
  await admin.from("pickup_requests").update({ status: "annulee" }).eq("id", id);
  await scheduleNextOccurrence(pickup, await getSettings());
  revalidateAll();
  return { ok: true };
}

export async function adminReopenPickup(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("pickup_requests")
    .update({ status: "en_attente", cans_count: null, completed_at: null })
    .eq("id", id);
  revalidateAll();
  return { ok: true };
}

export async function adminDeletePickup(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("pickup_requests").delete().eq("id", id);
  revalidateAll();
  return { ok: true };
}

/** Permet à l'admin d'ajouter une collecte pour un citoyen (ex. demande par téléphone). */
export async function adminCreatePickup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const user_id = String(formData.get("user_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!user_id || !ISO_DATE.test(date)) return { error: "Citoyen et date requis." };
  const admin = createAdminClient();
  const { error } = await admin.from("pickup_requests").insert({ user_id, requested_date: date, note });
  if (error) return { error: "Impossible d'ajouter la collecte." };
  revalidateAll();
  return { ok: true, message: "Collecte ajoutée." };
}
