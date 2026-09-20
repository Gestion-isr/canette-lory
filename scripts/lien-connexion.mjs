/**
 * Génère un lien de connexion pour un courriel, SANS envoyer de courriel
 * (utile quand Supabase bloque à cause de la limite d'envois).
 *
 * Usage :  node scripts/lien-connexion.mjs quelqu.un@exemple.com
 *
 * Le lien est valide 1 heure et utilisable une seule fois.
 * Il utilise la clé secrète de .env.local : à lancer uniquement sur ton ordinateur.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage : node scripts/lien-connexion.mjs courriel@exemple.com");
  process.exit(1);
}

const site = process.env.LIEN_SITE_URL ?? "https://canette-lory.vercel.app";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await sb.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error("Erreur :", error.message);
  process.exit(1);
}

console.log(`\nLien de connexion pour ${email} (valide 1 h, usage unique) :\n`);
console.log(`${site}/auth/callback?token_hash=${data.properties.hashed_token}&type=email\n`);
