"use client";

import { useActionState, useEffect, useState } from "react";
import { createPickup, type ActionState } from "@/actions/pickups";
import type { DayAvailability } from "@/lib/availability";
import { DatePicker } from "@/components/DatePicker";
import { formatDateLong } from "@/lib/format";

export function PickupRequestForm({
  availability,
  hasAddress,
  hasActiveRecurrence,
  pickupNote,
}: {
  availability: DayAvailability[];
  hasAddress: boolean;
  hasActiveRecurrence: boolean;
  pickupNote?: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPickup, {});
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    if (state.ok) setDate(null);
  }, [state]);

  if (!hasAddress) {
    return (
      <p className="rounded-xl bg-sun-400/20 px-4 py-3 text-sm text-gray-800 ring-1 ring-sun-500/40">
        ☝️ Enregistre d&apos;abord ton adresse ci-dessus pour pouvoir demander une collecte.
      </p>
    );
  }

  const anyAvailable = availability.some((d) => d.available);

  return (
    <form action={action} className="space-y-4">
      <div>
        <p className="label">1. Choisis une date</p>
        {anyAvailable ? (
          <DatePicker availability={availability} value={date} onChange={setDate} />
        ) : (
          <p className="alert-error">Aucune date disponible pour le moment. Reviens bientôt !</p>
        )}
        <input type="hidden" name="date" value={date ?? ""} />
        {date && <p className="mt-2 text-sm text-brand-800">📅 {formatDateLong(date)}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="estimated_bags">
            2. Nombre de sacs (environ)
          </label>
          <select id="estimated_bags" name="estimated_bags" className="input" defaultValue="1">
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} sac{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="recurrence_weeks">
            3. Répéter ?
          </label>
          <select id="recurrence_weeks" name="recurrence_weeks" className="input" defaultValue="0" disabled={hasActiveRecurrence}>
            <option value="0">Une seule fois</option>
            <option value="1">Chaque semaine</option>
            <option value="2">Toutes les 2 semaines</option>
            <option value="3">Toutes les 3 semaines</option>
            <option value="4">Chaque mois (4 sem.)</option>
          </select>
          {hasActiveRecurrence && <p className="mt-1 text-xs text-gray-500">Tu as déjà une récurrence active.</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="note">
          Note pour cette collecte <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <textarea id="note" name="note" rows={2} className="input" placeholder="Ex. : sacs à côté du garage, derrière la clôture…" maxLength={500} />
        {pickupNote && (
          <p className="mt-1 text-xs text-gray-500">
            📌 Votre note permanente sera aussi transmise : « {pickupNote} »
          </p>
        )}
      </div>

      {state.error && <p className="alert-error">{state.error}</p>}
      {state.ok && <p className="alert-success">{state.message}</p>}

      <button type="submit" disabled={pending || !date} className="btn-primary w-full">
        {pending ? "Envoi…" : "Demander la collecte"}
      </button>
    </form>
  );
}
