"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import type { ActionState } from "@/actions/pickups";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Non connecté." };

  const full_name = String(formData.get("full_name") ?? "").trim().slice(0, 100) || null;
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30) || null;
  const address = String(formData.get("address") ?? "").trim().slice(0, 200) || null;
  const latRaw = String(formData.get("lat") ?? "");
  const lngRaw = String(formData.get("lng") ?? "");

  let lat = latRaw ? parseFloat(latRaw) : null;
  let lng = lngRaw ? parseFloat(lngRaw) : null;

  // Géocode seulement si aucune coordonnée valide n'accompagne l'adresse
  // (le client efface lat/lng dès que l'adresse est modifiée à la main)
  if (address && (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng))) {
    const results = await geocodeAddress(address);
    if (results.length === 0)
      return { error: "Adresse introuvable. Vérifie l'orthographe (ex. : 123 rue Saint-Pierre) ou place le point sur la carte." };
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
    .update({ full_name, phone, address, lat, lng, updated_at: new Date().toISOString() })
    .eq("id", profile.id);
  if (error) return { error: "Impossible d'enregistrer le profil." };

  revalidatePath("/mon-compte");
  revalidatePath("/admin/citoyens");
  return { ok: true, message: "Profil enregistré." };
}

export async function updateLocation(lat: number, lng: number): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Non connecté." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { error: "Coordonnées invalides." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ lat, lng }).eq("id", profile.id);
  if (error) return { error: "Impossible d'enregistrer la position." };
  revalidatePath("/mon-compte");
  return { ok: true };
}
