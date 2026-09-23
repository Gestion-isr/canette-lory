import { Resend } from "resend";
import { formatDateLong } from "@/lib/format";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? "Collecte de cannettes <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function layout(title: string, body: string) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
    <h1 style="font-size:20px;color:#be185d;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:32px;font-size:13px;color:#6b7280">
      <a href="${SITE}/mon-compte" style="color:#be185d">Gérer mes collectes</a> · Collecte de cannettes – Saint-Charles-de-Drummond
    </p>
  </div>`;
}

async function send(to: string, subject: string, html: string) {
  const resend = client();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY manquante, courriel non envoyé :", subject, "->", to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error("[email] échec d'envoi", e);
  }
}

export async function sendRequestConfirmation(opts: {
  to: string;
  name: string | null;
  date: string;
  childName: string;
}) {
  const d = formatDateLong(opts.date);
  await send(
    opts.to,
    `Collecte confirmée pour le ${d}`,
    layout(
      "Demande de collecte reçue !",
      `<p>Bonjour ${opts.name ?? ""},</p>
       <p>${opts.childName} passera chercher vos cannettes le <strong>${d}</strong>.</p>
       <p>Merci de laisser vos sacs bien visibles près de l'entrée. Vous pouvez annuler ou modifier votre demande à tout moment depuis votre compte.</p>
       <p>Merci de votre soutien 💚</p>`,
    ),
  );
}

export async function sendCompletionThanks(opts: {
  to: string;
  name: string | null;
  date: string;
  cans: number | null;
  childName: string;
}) {
  const d = formatDateLong(opts.date);
  await send(
    opts.to,
    `Merci ! Collecte du ${d} complétée`,
    layout(
      "Collecte complétée 🎉",
      `<p>Bonjour ${opts.name ?? ""},</p>
       <p>${opts.childName} est passée le <strong>${d}</strong>${opts.cans ? ` et a ramassé environ <strong>${opts.cans} cannettes</strong>` : ""}.</p>
       <p>Un immense merci pour votre contribution !</p>`,
    ),
  );
}

export async function sendReminder(opts: { to: string; name: string | null; date: string; childName: string }) {
  const d = formatDateLong(opts.date);
  await send(
    opts.to,
    `Rappel : collecte de cannettes demain (${d})`,
    layout(
      "Petit rappel 🥫",
      `<p>Bonjour ${opts.name ?? ""},</p>
       <p>${opts.childName} passera chercher vos cannettes <strong>demain, ${d}</strong>.</p>
       <p>Pensez à laisser vos sacs bien visibles près de l'entrée. Merci !</p>`,
    ),
  );
}
