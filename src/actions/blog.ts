"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, getCurrentProfile } from "@/lib/supabase/server";
import type { ActionState } from "@/actions/pickups";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) throw new Error("Accès refusé.");
  return profile;
}

function revalidateBlog() {
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  revalidatePath("/");
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGES = 6;

/** Téléverse les photos d'un article dans le bucket public « blog ». */
async function uploadImages(files: FormDataEntryValue[]): Promise<{ urls: string[]; error?: string }> {
  const admin = createAdminClient();
  const urls: string[] = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { urls, error: "Format d'image non pris en charge (JPG, PNG ou WebP)." };
    if (file.size > 6 * 1024 * 1024) return { urls, error: "Une image dépasse 6 Mo." };
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await admin.storage.from("blog").upload(path, file, { contentType: file.type });
    if (error) {
      return {
        urls,
        error: /bucket/i.test(error.message)
          ? "Le bucket « blog » manque : exécute supabase/migrations/0009_blog.sql dans Supabase."
          : "Impossible de téléverser une photo.",
      };
    }
    urls.push(admin.storage.from("blog").getPublicUrl(path).data.publicUrl);
  }
  return { urls };
}

export async function savePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 150);
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  const dateRaw = String(formData.get("published_at") ?? "");
  const published = formData.get("published") !== "off";
  const existantes = String(formData.get("existing_images") ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  if (!title) return { error: "Donne un titre à l'article." };

  const admin = createAdminClient();
  const { urls, error: upErr } = await uploadImages(formData.getAll("images"));
  if (upErr) return { error: upErr };

  const images = [...existantes, ...urls].slice(0, MAX_IMAGES);
  const published_at = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? new Date(`${dateRaw}T12:00:00`).toISOString() : new Date().toISOString();
  const valeurs = { title, body, images, published, published_at, updated_at: new Date().toISOString() };

  const { error } = id ? await admin.from("posts").update(valeurs).eq("id", id) : await admin.from("posts").insert(valeurs);
  if (error)
    return {
      error: /posts/.test(error.message)
        ? "La table « posts » manque : exécute supabase/migrations/0009_blog.sql dans Supabase."
        : "Impossible d'enregistrer l'article.",
    };

  revalidateBlog();
  return { ok: true, message: id ? "Article mis à jour !" : "Article publié !" };
}

export async function deletePost(id: string): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("posts").delete().eq("id", id);
  revalidateBlog();
  return { ok: true };
}

export async function togglePostPublished(id: string, published: boolean): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("posts").update({ published, updated_at: new Date().toISOString() }).eq("id", id);
  revalidateBlog();
  return { ok: true };
}
