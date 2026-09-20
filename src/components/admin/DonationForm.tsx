"use client";

import { useActionState, useEffect, useRef } from "react";
import { addDeposit } from "@/actions/admin";
import type { ActionState } from "@/actions/pickups";

export function DonationForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addDeposit, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="kind" value="don" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="don-amount">
            Montant du don ($)
          </label>
          <input id="don-amount" name="amount" type="number" step="0.01" min="0" inputMode="decimal" required className="input" placeholder="2,00" />
        </div>
        <div>
          <label className="label" htmlFor="don-date">
            Date
          </label>
          <input id="don-date" name="deposited_at" type="date" defaultValue={today} required className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="don-note">
          Note <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <input id="don-note" name="note" className="input" placeholder="Ex. : voisin de la rue Saint-Pierre" />
      </div>
      {state.error && <p className="alert-error">{state.error}</p>}
      {state.ok && <p className="alert-success">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn w-full bg-sun-500 text-white hover:bg-amber-600">
        {pending ? "Ajout…" : "💛 Ajouter le don"}
      </button>
    </form>
  );
}
