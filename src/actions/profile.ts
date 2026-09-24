"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import type { ActionState } from "@/actions/pickups";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Non connecté." };

  const full_name = String(formData.get("full_name") ?? "").trim().slice(0, 100) || null;
  const pickup_note = String(formData.get("pickup_note") ?? "").trim().slice(0, 300) || null;
  const address = String(formData.get("address") ?? "").trim().slice(0, 200) || null;
  const latRaw = String(formData.get("lat") ?? "");
  const lngRaw = String(formData.get("lng") ?? "");

  let lat: number | null = latRaw ? parseFloat(latRaw) : null;
  let lng: number | null = lngRaw ? parseFloat(lngRaw) : null;
  if (lat != null && !Number.isFinite(lat)) lat = null;
  if (lng != null && !Number.isFinite(lng)) lng = null;

  // Filet de sécurité : si l'adresse a été tapée sans choisir de suggestion, on géocode côté serveur.
  if (address && (lat == null || lng == null)) {
    const results = await geocodeAddress(address);
    if (results.length === 0)
      return { error: "Adresse introuvable. Choisissez une suggestion dans la liste, ou placez le point sur la carte." };
    lat = results[0].lat;
    lng = results[0].lng;
  }
  if (!address) {
    lat = null;
    lng = null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, pickup_note, address, lat, lng, updated_at: new Date().toISOString() })
    .eq("id", profile.id);
  if (error)
    return {
      error: error.message.includes("pickup_note")
        ? "La colonne pickup_note manque : exécute supabase/migrations/0006_note_collecte.sql dans Supabase."
        : "Impossible d'enregistrer le profil.",
    };

  revalidatePath("/mon-compte");
  revalidatePath("/admin/citoyens");
  revalidatePath("/admin/carte");
  return { ok: true, message: "Profil enregistré." };
}
