"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { ok?: boolean; error?: string; email?: string; mode?: "lien" | "inscription" };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de courriels envoyés récemment. Réessaie dans une heure.";
  if (m.includes("invalid login credentials")) return "Courriel ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Ton courriel n'est pas encore confirmé. Ouvre le courriel de confirmation (vérifie les pourriels).";
  if (m.includes("already registered") || m.includes("already been registered")) return "Un compte existe déjà avec ce courriel. Utilise l'onglet Connexion.";
  if (m.includes("password") && m.includes("least")) return "Le mot de passe doit contenir au moins 8 caractères.";
  return "Une erreur est survenue. Réessaie dans quelques instants.";
}

async function redirectAfterLogin(userId: string): Promise<never> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
  redirect(data?.is_admin ? "/admin" : "/mon-compte");
}

/** Connexion avec courriel + mot de passe. */
export async function signInWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL_RE.test(email)) return { error: "Adresse courriel invalide." };
  if (!password) return { error: "Entre ton mot de passe." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: friendlyError(error?.message ?? "") };
  return redirectAfterLogin(data.user.id);
}

/** Inscription avec courriel + mot de passe (un courriel de confirmation est envoyé). */
export async function signUpWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!EMAIL_RE.test(email)) return { error: "Adresse courriel invalide." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les deux mots de passe ne sont pas identiques." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });
  if (error) return { error: friendlyError(error.message) };

  // Supabase renvoie un user sans identité quand le courriel existe déjà (pour ne pas le révéler)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "Un compte existe déjà avec ce courriel. Utilise l'onglet Connexion." };
  }
  // Si la confirmation par courriel est désactivée, la session est déjà ouverte
  if (data.session && data.user) return redirectAfterLogin(data.user.id);

  return { ok: true, email, mode: "inscription" };
}

/** Lien magique par courriel (mot de passe oublié / connexion sans mot de passe). */
export async function signInWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const suite = String(formData.get("suite") ?? "");
  if (!EMAIL_RE.test(email)) return { error: "Adresse courriel invalide." };

  const supabase = await createClient();
  const next = suite.startsWith("/") ? suite : "/mon-compte";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: friendlyError(error.message) };
  return { ok: true, email, mode: "lien" };
}

/** Changement de mot de passe (utilisateur connecté). */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les deux mots de passe ne sont pas identiques." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyError(error.message) };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
