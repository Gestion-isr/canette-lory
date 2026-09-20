"use client";

import { useActionState, useEffect, useRef } from "react";
import { addDeposit } from "@/actions/admin";
import type { ActionState } from "@/actions/pickups";

export function DepositForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addDeposit, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="amount">
            Montant reçu ($)
          </label>
          <input id="amount" name="amount" type="number" step="0.01" min="0" inputMode="decimal" required className="input" placeholder="12,50" />
        </div>
        <div>
          <label className="label" htmlFor="cans_count">
            Nb de cannettes
          </label>
          <input id="cans_count" name="cans_count" type="number" min="0" inputMode="numeric" className="input" placeholder="125" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="deposited_at">
            Date
          </label>
          <input id="deposited_at" name="deposited_at" type="date" defaultValue={today} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="dnote">
            Note
          </label>
          <input id="dnote" name="note" className="input" placeholder="Dépanneur du coin" />
        </div>
      </div>
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.ok && <p className="alert-success">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Ajout…" : "💰 Ajouter le dépôt"}
      </button>
    </form>
  );
}
