"use client";

import { useActionState, useState, useTransition } from "react";
import { Map } from "@/components/Map";
import { adminUpdateCitizenLocation } from "@/actions/admin";
import { adminCreatePickup, type ActionState } from "@/actions/pickups";
import type { Profile } from "@/lib/types";
import type { DayAvailability } from "@/lib/availability";
import { DatePicker } from "@/components/DatePicker";

export function CitizensPanel({
  citizens,
  home,
  availability,
}: {
  citizens: (Profile & { pending: number; done: number })[];
  home: { lat: number; lng: number };
  availability: DayAvailability[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, start] = useTransition();
  const [state, action, pending] = useActionState<ActionState, FormData>(adminCreatePickup, {});
  const [date, setDate] = useState<string | null>(null);

  const filtered = citizens.filter((c) => {
    const s = `${c.full_name ?? ""} ${c.email} ${c.address ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });
  const located = citizens.filter((c) => c.lat != null && c.lng != null);
  const sel = citizens.find((c) => c.id === selected) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="input" />
        <ul className="card max-h-[520px] divide-y divide-gray-100 overflow-auto !p-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelected(c.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected === c.id ? "bg-brand-50" : ""}`}
              >
                <p className="font-medium">
                  {c.full_name ?? <span className="text-gray-400">(sans nom)</span>}
                  {c.lat == null && c.address && <span className="ml-2 text-xs text-red-600">⚠ non localisé</span>}
                </p>
                <p className="text-xs text-gray-500">{c.address ?? "Aucune adresse"}</p>
                <p className="text-xs text-gray-400">
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ""} · {c.done} complétée(s), {c.pending} en attente
                </p>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Aucun citoyen.</li>}
        </ul>
      </div>

      <div className="space-y-3 lg:col-span-3">
        <Map
          center={sel?.lat != null && sel?.lng != null ? [sel.lat, sel.lng] : [home.lat, home.lng]}
          zoom={sel ? 16 : 14}
          home={home}
          fitToMarkers={!sel}
          className="h-[360px] w-full"
          onClick={sel ? (lat, lng) => start(async () => { await adminUpdateCitizenLocation(sel.id, lat, lng); }) : undefined}
          markers={located.map((c) => ({
            id: c.id,
            lat: c.lat as number,
            lng: c.lng as number,
            color: c.id === selected ? "#f59e0b" : "#db2777",
            draggable: c.id === selected,
            onDragEnd: c.id === selected ? (lat, lng) => start(async () => { await adminUpdateCitizenLocation(c.id, lat, lng); }) : undefined,
            popup: (
              <div className="text-sm">
                <p className="font-semibold">{c.full_name ?? c.email}</p>
                <p>{c.address}</p>
              </div>
            ),
          }))}
        />
        {sel ? (
          <div className="card space-y-3">
            <div>
              <p className="font-bold">{sel.full_name ?? sel.email}</p>
              <p className="text-sm text-gray-600">{sel.address ?? "Aucune adresse"}</p>
              <p className="text-xs text-gray-500">
                {busy ? "Enregistrement de la position…" : "Cliquez sur la carte ou glissez le point orange pour corriger sa position."}
              </p>
            </div>
            <form action={action} className="space-y-2 border-t border-gray-100 pt-3">
              <p className="text-sm font-semibold">Ajouter une collecte pour ce citoyen</p>
              <input type="hidden" name="user_id" value={sel.id} />
              <input type="hidden" name="date" value={date ?? ""} />
              <DatePicker availability={availability} value={date} onChange={setDate} />
              <input name="note" className="input" placeholder="Note (ex. : demande par téléphone)" />
              {state.error && <p className="alert-error">{state.error}</p>}
              {state.ok && <p className="alert-success">{state.message}</p>}
              <button type="submit" disabled={pending || !date} className="btn-primary">
                {pending ? "…" : "Ajouter la collecte"}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sélectionnez un citoyen pour corriger sa position ou lui ajouter une collecte.</p>
        )}
      </div>
    </div>
  );
}
