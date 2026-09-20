"use client";

import { useActionState, useState } from "react";
import { signInWithEmail, signInWithPassword, signUpWithPassword, type AuthState } from "@/actions/auth";

type Tab = "connexion" | "inscription" | "lien";

export function LoginForm({ suite }: { suite?: string }) {
  const [tab, setTab] = useState<Tab>("connexion");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(signInWithPassword, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signUpWithPassword, {});
  const [linkState, linkAction, linkPending] = useActionState<AuthState, FormData>(signInWithEmail, {});

  if (signupState.ok) {
    return (
      <div className="alert-success">
        <p className="font-semibold">📬 Presque fini ! Confirme ton courriel</p>
        <p className="mt-1">
          Un courriel de confirmation a été envoyé à <strong>{signupState.email}</strong>. Clique sur le lien pour activer ton compte
          (pense à vérifier les pourriels). Ensuite, tu pourras te connecter avec ton mot de passe.
        </p>
      </div>
    );
  }

  if (linkState.ok) {
    return (
      <div className="alert-success">
        <p className="font-semibold">📬 Lien envoyé à {linkState.email}</p>
        <p className="mt-1">Ouvre le courriel et clique sur le lien pour te connecter. Pense à vérifier les pourriels.</p>
      </div>
    );
  }

  const tabClass = (t: Tab) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      tab === t ? "bg-white text-brand-800 shadow-sm" : "text-gray-500 hover:text-gray-800"
    }`;

  return (
    <div className="space-y-4">
      {tab !== "lien" && (
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          <button type="button" onClick={() => setTab("connexion")} className={tabClass("connexion")}>
            Connexion
          </button>
          <button type="button" onClick={() => setTab("inscription")} className={tabClass("inscription")}>
            Créer un compte
          </button>
        </div>
      )}

      {tab === "connexion" && (
        <form action={loginAction} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="label">
              Courriel
            </label>
            <input id="login-email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" className="input" />
          </div>
          <div>
            <label htmlFor="login-password" className="label">
              Mot de passe
            </label>
            <input id="login-password" name="password" type="password" required autoComplete="current-password" className="input" />
          </div>
          {loginState.error && <p className="alert-error">{loginState.error}</p>}
          <button type="submit" disabled={loginPending} className="btn-primary w-full">
            {loginPending ? "Connexion…" : "Me connecter"}
          </button>
          <button type="button" onClick={() => setTab("lien")} className="block w-full text-center text-xs text-gray-500 hover:text-brand-700">
            Mot de passe oublié ? Recevoir un lien de connexion par courriel
          </button>
        </form>
      )}

      {tab === "inscription" && (
        <form action={signupAction} className="space-y-3">
          <div>
            <label htmlFor="signup-email" className="label">
              Courriel
            </label>
            <input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" className="input" />
          </div>
          <div>
            <label htmlFor="signup-password" className="label">
              Mot de passe <span className="font-normal text-gray-400">(8 caractères min.)</span>
            </label>
            <input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
          <div>
            <label htmlFor="signup-confirm" className="label">
              Confirmer le mot de passe
            </label>
            <input id="signup-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
          {signupState.error && <p className="alert-error">{signupState.error}</p>}
          <button type="submit" disabled={signupPending} className="btn-primary w-full">
            {signupPending ? "Création…" : "Créer mon compte"}
          </button>
          <p className="text-center text-xs text-gray-500">Tu recevras un courriel pour confirmer ton adresse.</p>
        </form>
      )}

      {tab === "lien" && (
        <form action={linkAction} className="space-y-3">
          <p className="text-sm text-gray-600">
            Entre ton courriel : tu recevras un lien qui te connecte directement, sans mot de passe. Tu pourras ensuite définir un nouveau mot de
            passe dans <em>Mon compte</em>.
          </p>
          {suite && <input type="hidden" name="suite" value={suite} />}
          <div>
            <label htmlFor="link-email" className="label">
              Courriel
            </label>
            <input id="link-email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" className="input" />
          </div>
          {linkState.error && <p className="alert-error">{linkState.error}</p>}
          <button type="submit" disabled={linkPending} className="btn-primary w-full">
            {linkPending ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
          <button type="button" onClick={() => setTab("connexion")} className="block w-full text-center text-xs text-gray-500 hover:text-brand-700">
            ← Retour à la connexion
          </button>
        </form>
      )}
    </div>
  );
}
