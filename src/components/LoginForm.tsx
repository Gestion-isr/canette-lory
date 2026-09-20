"use client";

import { useActionState } from "react";
import { signInWithEmail, type AuthState } from "@/actions/auth";

export function LoginForm({ suite }: { suite?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signInWithEmail, {});

  if (state.ok) {
    return (
      <div className="alert-success">
        <p className="font-semibold">📬 Lien envoyé à {state.email}</p>
        <p className="mt-1">
          Ouvrez le courriel et cliquez sur le lien pour vous connecter. Pensez à vérifier vos pourriels.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <div>
        <label htmlFor="email" className="label">
          Courriel
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" className="input" />
      </div>
      {state.error && <p className="alert-error">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Envoi…" : "Recevoir mon lien de connexion"}
      </button>
    </form>
  );
}
