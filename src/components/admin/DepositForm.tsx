"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addDeposit } from "@/actions/admin";
import type { ActionState } from "@/actions/pickups";
import { DEPOSIT_KINDS, type DepositKind } from "@/lib/types";

const AIDE: Record<DepositKind, string> = {
  cannettes: "Après un passage au dépanneur ou au centre de retour : montant reçu et nombre de cannettes.",
  don: "Argent reçu en don d'un citoyen, en main propre ou dans le sac.",
  personnel: "Argent de Lory (économies, cadeau, argent de poche) ajouté à la cagnotte.",
};

export function DepositForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addDeposit, {});
  const [kind, setKind] = useState<DepositKind>("cannettes");
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="kind" value={kind} />

      <div className="flex flex-wrap gap-1.5">
        {DEPOSIT_KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind(k.key)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition ${
              kind === k.key ? "bg-brand-50 text-brand-800 ring-brand-500" : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {k.icone} {k.court}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">{AIDE[kind]}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="amount">
            Montant ($)
          </label>
          <input id="amount" name="amount" type="number" step="0.01" min="0" inputMode="decimal" required className="input" placeholder="12,50" />
        </div>
        {kind === "cannettes" ? (
          <div>
            <label className="label" htmlFor="cans_count">
              Nb de cannettes
            </label>
            <input id="cans_count" name="cans_count" type="number" min="0" inputMode="numeric" className="input" placeholder="125" />
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="deposited_at_alt">
              Date
            </label>
            <input id="deposited_at_alt" name="deposited_at" type="date" defaultValue={today} required className="input" />
          </div>
        )}
      </div>

      <div className={kind === "cannettes" ? "grid grid-cols-2 gap-3" : ""}>
        {kind === "cannettes" && (
          <div>
            <label className="label" htmlFor="deposited_at">
              Date
            </label>
            <input id="deposited_at" name="deposited_at" type="date" defaultValue={today} required className="input" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="dnote">
            Note <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <input id="dnote" name="note" className="input" placeholder={kind === "cannettes" ? "Dépanneur du coin" : "Ex. : cadeau de grand-maman"} />
        </div>
      </div>

      {state.error && <p className="alert-error">{state.error}</p>}
      {state.ok && <p className="alert-success">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Ajout…" : `Ajouter ${kind === "cannettes" ? "le dépôt" : kind === "don" ? "le don" : "le montant"}`}
      </button>
    </form>
  );
}
