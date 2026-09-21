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
  for (const p of ["/", "/a-propos", "/historique", "/mon-compte", "/admin", "/admin/collectes", "/admin/carte", "/admin/parametres", "/admin/citoyens"])
    revalidatePath(p);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------- Paramètres ----------------
export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();

  const child_name = String(formData.get("child_name") ?? "").trim().slice(0, 60) || "Lory";
  const season = formData.get("season") === "hiver" ? "hiver" : "ete";
  const summer_days = formData.getAll("summer_days").map(Number).filter((n) => n >= 0 && n <= 6);
  const winter_days = formData.getAll("winter_days").map(Number).filter((n) => n >= 0 && n <= 6);
  const min_notice_days = Math.max(0, Math.min(14, parseInt(String(formData.get("min_notice_days") ?? "1"), 10) || 0));
  const max_per_day = Math.max(1, Math.min(100, parseInt(String(formData.get("max_per_day") ?? "10"), 10) || 10));
  const horizon_days = Math.max(7, Math.min(180, parseInt(String(formData.get("horizon_days") ?? "60"), 10) || 60));
  const show_goal_to_citizens = formData.get("show_goal_to_citizens") === "on";
  const home_address = String(formData.get("home_address") ?? "").trim().slice(0, 200) || null;
  const about_text = String(formData.get("about_text") ?? "").trim().slice(0, 5000) || null;

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
      about_text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message.includes("about_text") ? "La colonne about_text manque : exécute supabase/migrations/0002_a_propos.sql dans Supabase." : "Impossible d'enregistrer les paramètres." };
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
  const kind = formData.get("kind") === "don" ? "don" : "cannettes";
  if (!Number.isFinite(amount) || amount < 0) return { error: "Montant invalide." };
  if (!ISO_DATE.test(deposited_at)) return { error: "Date invalide." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("deposits")
    .insert({ amount, cans_count: kind === "don" ? null : cans_count, deposited_at, note, kind });
  if (error)
    return {
      error: error.message.includes("kind")
        ? "La colonne kind manque : exécute supabase/migrations/0003_dons.sql dans Supabase."
        : "Impossible d'ajouter le dépôt.",
    };
  revalidateAll();
  return { ok: true, message: kind === "don" ? "Don ajouté, merci !" : "Dépôt ajouté !" };
}

export async function deleteDeposit(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("deposits").delete().eq("id", id);
  revalidateAll();
  return { ok: true };
}

// ---------------- Objectif ----------------
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Téléverse une photo dans le bucket public « objectifs » et renvoie son URL, ou null si aucun fichier. */
async function uploadGoalImage(file: FormDataEntryValue | null): Promise<{ url: string | null; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return { url: null };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { url: null, error: "Format d'image non pris en charge (JPG, PNG ou WebP)." };
  if (file.size > 6 * 1024 * 1024) return { url: null, error: "Image trop lourde (max 6 Mo)." };
  const admin = createAdminClient();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage.from("objectifs").upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    return {
      url: null,
      error: /bucket/i.test(error.message)
        ? "Le bucket « objectifs » manque : exécute supabase/migrations/0004_photo_objectif.sql dans Supabase."
        : "Impossible de téléverser la photo.",
    };
  }
  return { url: admin.storage.from("objectifs").getPublicUrl(path).data.publicUrl };
}

export async function setGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const target_amount = parseFloat(String(formData.get("target_amount") ?? "").replace(",", "."));
  const started_at = String(formData.get("started_at") ?? "");
  if (!title) return { error: "Donne un nom à l'objectif." };
  if (!Number.isFinite(target_amount) || target_amount <= 0) return { error: "Montant cible invalide." };
  if (!ISO_DATE.test(started_at)) return { error: "Date de départ invalide." };

  const img = await uploadGoalImage(formData.get("image"));
  if (img.error) return { error: img.error };

  const admin = createAdminClient();
  // Un seul objectif actif à la fois
  await admin.from("goals").update({ active: false }).eq("active", true);
  const { error } = await admin.from("goals").insert({ title, target_amount, started_at, active: true, image_url: img.url });
  if (error)
    return {
      error: error.message.includes("image_url")
        ? "La colonne image_url manque : exécute supabase/migrations/0004_photo_objectif.sql dans Supabase."
        : "Impossible de créer l'objectif.",
    };
  revalidateAll();
  return { ok: true, message: "Nouvel objectif défini !" };
}

/** Change (ou retire) la photo de l'objectif actif. */
export async function updateGoalImage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Objectif introuvable." };
  const remove = formData.get("remove") === "1";
  const admin = createAdminClient();

  let url: string | null = null;
  if (!remove) {
    const img = await uploadGoalImage(formData.get("image"));
    if (img.error) return { error: img.error };
    if (!img.url) return { error: "Choisis une photo." };
    url = img.url;
  }
  const { error } = await admin.from("goals").update({ image_url: url }).eq("id", id);
  if (error) return { error: "Impossible d'enregistrer la photo." };
  revalidateAll();
  return { ok: true, message: remove ? "Photo retirée." : "Photo enregistrée !" };
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
