"use client";

import { useTransition } from "react";
import { cancelPickup, stopRecurrence } from "@/actions/pickups";
import { formatDateLong } from "@/lib/format";
import { STATUS_LABELS, type PickupRequest, type Recurrence } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export function CitizenPickupList({ pickups, recurrences }: { pickups: PickupRequest[]; recurrences: Recurrence[] }) {
  const [pending, start] = useTransition();
  const upcoming = pickups.filter((p) => p.status === "en_attente");
  const past = pickups.filter((p) => p.status !== "en_attente");
  const active = recurrences.filter((r) => r.active);

  return (
    <div className="space-y-5">
      {active.length > 0 && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm ring-1 ring-brand-200">
          {active.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3">
              <span>
                🔁 Collecte récurrente : toutes les {r.interval_weeks === 1 ? "semaines" : `${r.interval_weeks} semaines`}
              </span>
              <button
                disabled={pending}
                onClick={() => {
                  if (confirm("Arrêter la récurrence ? Les collectes déjà planifiées restent.")) start(async () => { await stopRecurrence(r.id); });
                }}
                className="btn-secondary btn-sm"
              >
                Arrêter
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-2 font-semibold">À venir</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune collecte planifiée.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium capitalize">{formatDateLong(p.requested_date)}</p>
                  <p className="text-xs text-gray-500">
                    {p.estimated_bags ? `${p.estimated_bags} sac(s)` : ""}
                    {p.recurrence_id ? " · récurrente" : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <button
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Annuler cette collecte ?")) start(async () => { await cancelPickup(p.id); });
                  }}
                  className="btn-danger btn-sm"
                >
                  Annuler
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">Historique</h3>
          <ul className="divide-y divide-gray-100">
            {past.slice(0, 20).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="capitalize">{formatDateLong(p.requested_date)}</span>
                <span className="flex items-center gap-2 text-gray-500">
                  {p.status === "completee" && p.cans_count != null && <span>{p.cans_count} cannettes</span>}
                  <StatusBadge status={p.status} label={STATUS_LABELS[p.status]} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
