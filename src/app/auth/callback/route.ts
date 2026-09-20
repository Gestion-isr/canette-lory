import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'arrivée du lien magique.
 * Supporte deux formats :
 *  - ?code=...                   (flux PKCE par défaut, même navigateur)
 *  - ?token_hash=...&type=...    (recommandé : fonctionne d'un appareil à l'autre)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/mon-compte";
  const safeNext = next.startsWith("/") ? next : "/mon-compte";

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }
  if (!ok) return NextResponse.redirect(`${origin}/?erreur=lien`);

  // Les admins atterrissent sur le tableau de bord (sauf destination explicite)
  let destination = safeNext;
  if (safeNext === "/mon-compte") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (profile?.is_admin) destination = "/admin";
    }
  }
  return NextResponse.redirect(`${origin}${destination}`);
}
