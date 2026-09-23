"use client";

import { useActionState, useState, useTransition } from "react";
import { adminCancelPickup, adminDeletePickup, adminReopenPickup, completePickup, type ActionState } from "@/actions/pickups";
import { formatDateShort } from "@/lib/format";
import { STATUS_LABELS, type PickupWithProfile } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export function PickupRow({ pickup, showDate = true }: { pickup: PickupWithProfile; showDate?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(completePickup, {});
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const p = pickup.profiles;

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {showDate && <span className="mr-2 capitalize text-brand-700">{formatDateShort(pickup.requested_date)}</span>}
            {p?.full_name ?? p?.email ?? "Inconnu"}
          </p>
          <p className="text-sm text-gray-600">{p?.address ?? <span className="text-red-600">Adresse manquante</span>}</p>
          <p className="text-xs text-gray-500">
            {p?.phone ? `📞 ${p.phone} · ` : ""}
            {p?.email}
            {pickup.estimated_bags ? ` · ${pickup.estimated_bags} sac(s)` : ""}
            {pickup.recurrence_id ? " · 🔁 récurrente" : ""}
          </p>
          {p?.pickup_note && <p className="mt-1 text-xs text-brand-800">📌 {p.pickup_note}</p>}
          {pickup.note && <p className="mt-1 text-xs italic text-gray-500">« {pickup.note} »</p>}
        </div>
        <div className="flex items-center gap-2">
          {pickup.status === "completee" && pickup.cans_count != null && (
            <span className="text-xs text-gray-500">{pickup.cans_count} cannettes</span>
          )}
          <StatusBadge status={pickup.status} label={STATUS_LABELS[pickup.status]} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {pickup.status === "en_attente" && (
          <>
            <button type="button" onClick={() => setOpen((o) => !o)} className="btn-primary btn-sm">
              ✅ Compléter
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm("Annuler cette collecte ?")) start(async () => { await adminCancelPickup(pickup.id); });
              }}
              className="btn-secondary btn-sm"
            >
              Annuler
            </button>
          </>
        )}
        {pickup.status !== "en_attente" && (
          <button type="button" disabled={busy} onClick={() => start(async () => { await adminReopenPickup(pickup.id); })} className="btn-secondary btn-sm">
            Remettre en attente
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm("Supprimer définitivement ?")) start(async () => { await adminDeletePickup(pickup.id); });
          }}
          className="btn-sm text-xs text-gray-400 hover:text-red-600"
        >
          Supprimer
        </button>
      </div>

      {open && pickup.status === "en_attente" && (
        <form action={action} className="mt-2 flex flex-wrap items-end gap-2 rounded-xl bg-gray-50 p-3 ring-1 ring-black/5">
          <input type="hidden" name="id" value={pickup.id} />
          <div>
            <label className="label" htmlFor={`cans-${pickup.id}`}>
              Cannettes ramassées (approx.)
            </label>
            <input id={`cans-${pickup.id}`} name="cans_count" type="number" min="0" inputMode="numeric" className="input w-40" placeholder="ex. 60" />
          </div>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "…" : "Confirmer"}
          </button>
          {state.error && <p className="alert-error w-full">{state.error}</p>}
        </form>
      )}
    </li>
  );
}
