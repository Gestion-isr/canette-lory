"use client";

import { useMemo, useState } from "react";
import { Map } from "@/components/Map";
import { googleMapsLinks, haversineKm, optimizeRoute } from "@/lib/route";
import type { PickupWithProfile } from "@/lib/types";

type Props = {
  pickups: PickupWithProfile[];
  home: { lat: number; lng: number; address: string | null };
};

export function RoutePlanner({ pickups, home }: Props) {
  const [roundTrip, setRoundTrip] = useState(true);
  const [optimized, setOptimized] = useState(true);

  const located = pickups.filter((p) => p.profiles?.lat != null && p.profiles?.lng != null);
  const missing = pickups.filter((p) => p.profiles?.lat == null || p.profiles?.lng == null);

  const stops = useMemo(
    () => located.map((p) => ({ id: p.id, lat: p.profiles.lat as number, lng: p.profiles.lng as number, pickup: p })),
    [located],
  );

  const { ordered, distanceKm } = useMemo(() => {
    if (!optimized) {
      let d = 0;
      const pts = [home, ...stops, ...(roundTrip ? [home] : [])];
      for (let i = 0; i < pts.length - 1; i++) d += haversineKm(pts[i], pts[i + 1]);
      return { ordered: stops, distanceKm: d };
    }
    return optimizeRoute(home, stops, roundTrip);
  }, [stops, home, roundTrip, optimized]);

  const line: [number, number][] = [[home.lat, home.lng], ...ordered.map((s) => [s.lat, s.lng] as [number, number])];
  if (roundTrip && ordered.length > 0) line.push([home.lat, home.lng]);

  const links = googleMapsLinks(home, ordered, 9);

  const copyList = async () => {
    const text = ordered
      .map((s, i) => `${i + 1}. ${s.pickup.profiles.full_name ?? s.pickup.profiles.email} — ${s.pickup.profiles.address ?? ""}${s.pickup.note ? ` (${s.pickup.note})` : ""}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    alert("Liste copiée !");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Map
          center={[home.lat, home.lng]}
          zoom={14}
          home={home}
          fitToMarkers
          routeLine={line}
          className="h-[420px] w-full sm:h-[520px]"
          markers={ordered.map((s, i) => ({
            id: s.id,
            lat: s.lat,
            lng: s.lng,
            number: i + 1,
            popup: (
              <div className="text-sm">
                <p className="font-semibold">
                  {i + 1}. {s.pickup.profiles.full_name ?? s.pickup.profiles.email}
                </p>
                <p>{s.pickup.profiles.address}</p>
                {s.pickup.estimated_bags && <p>{s.pickup.estimated_bags} sac(s)</p>}
                {s.pickup.note && <p className="italic">« {s.pickup.note} »</p>}
              </div>
            ),
          }))}
        />
        <p className="mt-2 text-xs text-gray-500">
          Distance estimée (à vol d&apos;oiseau) : <strong>{distanceKm.toFixed(1)} km</strong> · Départ 🏠 {home.address ?? "point de départ (à définir dans Paramètres)"}
        </p>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <div className="card space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={optimized} onChange={(e) => setOptimized(e.target.checked)} className="accent-brand-600" />
              Trajet optimisé
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="accent-brand-600" />
              Retour à la maison
            </label>
          </div>
          {ordered.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((l, i) => (
                <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                  🧭 Google Maps{links.length > 1 ? ` (${i + 1}/${links.length})` : ""}
                </a>
              ))}
              <button type="button" onClick={copyList} className="btn-secondary btn-sm">
                📋 Copier la liste
              </button>
            </div>
          )}
          {links.length > 1 && (
            <p className="text-xs text-gray-500">Google Maps limite le nombre d&apos;arrêts par itinéraire : le trajet est découpé en {links.length} segments.</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-2 font-bold">Ordre de passage ({ordered.length})</h3>
          {ordered.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune collecte géolocalisée pour cette date.</p>
          ) : (
            <ol className="space-y-2">
              {ordered.map((s, i) => (
                <li key={s.id} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="font-medium">{s.pickup.profiles.full_name ?? s.pickup.profiles.email}</p>
                    <p className="text-gray-600">{s.pickup.profiles.address}</p>
                    <p className="text-xs text-gray-500">
                      {s.pickup.estimated_bags ? `${s.pickup.estimated_bags} sac(s)` : ""}
                      {s.pickup.profiles.phone ? ` · 📞 ${s.pickup.profiles.phone}` : ""}
                    </p>
                    {s.pickup.note && <p className="text-xs italic text-gray-500">« {s.pickup.note} »</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {missing.length > 0 && (
            <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-200">
              <p className="font-semibold">Sans position sur la carte :</p>
              <ul className="mt-1 list-inside list-disc">
                {missing.map((p) => (
                  <li key={p.id}>
                    {p.profiles?.full_name ?? p.profiles?.email} — {p.profiles?.address ?? "aucune adresse"}
                  </li>
                ))}
              </ul>
              <p className="mt-1">Corrige leur position dans la page Citoyens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
