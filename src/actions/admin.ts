"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, getCurrentProfile } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import type { ActionState } from "@/actions/pickups";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) throw new Error("Accès refusé.");
  return profile;
}

function revalidateAll() {
  for (const p of ["/", "/mon-compte", "/admin", "/admin/collectes", "/admin/carte", "/admin/parametres", "/admin/citoyens"])
    revalidatePath(p);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------- Paramètres ----------------
export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const child_name = String(formData.get("child_name") ?? "").trim().slice(0, 60) || "Ma fille";
  const season = formData.get("season") === "hiver" ? "hiver" : "ete";
  const summer_days = formData.getAll("summer_days").map(Number).filter((n) => n >= 0 && n <= 6);
  const winter_days = formData.getAll("winter_days").map(Number).filter((n) => n >= 0 && n <= 6);
  const min_notice_days = Math.max(0, Math.min(14, parseInt(String(formData.get("min_notice_days") ?? "1"), 10) || 0));
  const max_per_day = Math.max(1, Math.min(100, parseInt(String(formData.get("max_per_day") ?? "10"), 10) || 10));
  const horizon_days = Math.max(7, Math.min(180, parseInt(String(formData.get("horizon_days") ?? "60"), 10) || 60));
  const show_goal_to_citizens = formData.get("show_goal_to_citizens") === "on";
  const home_address = String(formData.get("home_address") ?? "").trim().slice(0, 200) || null;

  const { data: current } = await admin.from("settings").select("home_address, home_lat, home_lng").eq("id", 1).single();
  let home_lat = current?.home_lat ?? 45.915;
  let home_lng = current?.home_lng ?? -72.465;
  if (home_address && home_address !== current?.home_address) {
    const results = await geocodeAddress(home_address);
    if (results.length === 0) return { error: "Adresse de départ introuvable." };
    home_lat = results[0].lat;
    home_lng = results[0].lng;
  }

  const { error } = await admin
    .from("settings")
    .update({
      child_name,
      season,
      summer_days,
      winter_days,
      min_notice_days,
      max_per_day,
      horizon_days,
      show_goal_to_citizens,
      home_address,
      home_lat,
      home_lng,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: "Impossible d'enregistrer les paramètres." };
  revalidateAll();
  return { ok: true, message: "Paramètres enregistrés." };
}

// ---------------- Dates bloquées ----------------
export async function addBlockedDate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 100) || null;
  if (!ISO_DATE.test(date)) return { error: "Date invalide." };
  const admin = createAdminClient();
  const { error } = await admin.from("blocked_dates").upsert({ date, reason });
  if (error) return { error: "Impossible de bloquer cette date." };
  revalidateAll();
  return { ok: true };
}

export async function removeBlockedDate(date: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("blocked_dates").delete().eq("date", date);
  revalidateAll();
  return { ok: true };
}

// ---------------- Dépôts ----------------
export async function addDeposit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const amount = parseFloat(String(formData.get("amount") ?? "").replace(",", "."));
  const cansRaw = String(formData.get("cans_count") ?? "").trim();
  const cans_count = cansRaw ? Math.max(0, parseInt(cansRaw, 10) || 0) : null;
  const deposited_at = String(formData.get("deposited_at") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;
  if (!Number.isFinite(amount) || amount < 0) return { error: "Montant invalide." };
  if (!ISO_DATE.test(deposited_at)) return { error: "Date invalide." };
  const admin = createAdminClient();
  const { error } = await admin.from("deposits").insert({ amount, cans_count, deposited_at, note });
  if (error) return { error: "Impossible d'ajouter le dépôt." };
  revalidateAll();
  return { ok: true, message: "Dépôt ajouté !" };
}

export async function deleteDeposit(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("deposits").delete().eq("id", id);
  revalidateAll();
  return { ok: true };
}

// ---------------- Objectif ----------------
export async function setGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const target_amount = parseFloat(String(formData.get("target_amount") ?? "").replace(",", "."));
  const started_at = String(formData.get("started_at") ?? "");
  if (!title) return { error: "Donne un nom à l'objectif." };
  if (!Number.isFinite(target_amount) || target_amount <= 0) return { error: "Montant cible invalide." };
  if (!ISO_DATE.test(started_at)) return { error: "Date de départ invalide." };

  const admin = createAdminClient();
  // Un seul objectif actif à la fois
  await admin.from("goals").update({ active: false }).eq("active", true);
  const { error } = await admin.from("goals").insert({ title, target_amount, started_at, active: true });
  if (error) return { error: "Impossible de créer l'objectif." };
  revalidateAll();
  return { ok: true, message: "Nouvel objectif défini !" };
}

/** Recule la date de départ de l'objectif au premier dépôt, pour inclure les dépôts antérieurs. */
export async function includeAllDepositsInGoal(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: first } = await admin.from("deposits").select("deposited_at").order("deposited_at").limit(1).maybeSingle();
  if (!first) return { error: "Aucun dépôt." };
  await admin.from("goals").update({ started_at: first.deposited_at }).eq("id", id);
  revalidateAll();
  return { ok: true };
}

export async function markGoalAchieved(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("goals").update({ active: false, achieved_at: new Date().toISOString() }).eq("id", id);
  revalidateAll();
  return { ok: true };
}

// ---------------- Citoyens ----------------
export async function adminUpdateCitizenLocation(userId: string, lat: number, lng: number): Promise<ActionState> {
  await requireAdmin();
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { error: "Coordonnées invalides." };
  const admin = createAdminClient();
  await admin.from("profiles").update({ lat, lng }).eq("id", userId);
  revalidateAll();
  return { ok: true };
}
