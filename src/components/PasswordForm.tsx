"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePassword, type AuthState } from "@/actions/auth";

export function PasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  if (!open && !state.ok) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary btn-sm">
        🔑 Définir / changer mon mot de passe
      </button>
    );
  }

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="new-password">
            Nouveau mot de passe <span className="font-normal text-gray-400">(8 caractères min.)</span>
          </label>
          <input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="new-confirm">
            Confirmer
          </label>
          <input id="new-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
        </div>
      </div>
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.ok && <p className="alert-success">Mot de passe enregistré. Tu peux maintenant te connecter avec.</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "…" : "Enregistrer"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Fermer
        </button>
      </div>
    </form>
  );
}
