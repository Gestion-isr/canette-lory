"use client";

import { useEffect, useMemo, useState } from "react";
import { Map } from "@/components/Map";
import { googleMapsLinks, haversineKm, optimizeRoute } from "@/lib/route";
import type { PickupWithProfile } from "@/lib/types";

type Props = {
  pickups: PickupWithProfile[];
  home: { lat: number; lng: number; address: string | null };
};

type RoadRoute = { order: number[]; geometry: [number, number][]; distanceKm: number; durationMin: number };

export function RoutePlanner({ pickups, home }: Props) {
  const [roundTrip, setRoundTrip] = useState(true);
  const [optimized, setOptimized] = useState(true);
  const [road, setRoad] = useState<RoadRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadFailed, setRoadFailed] = useState(false);

  const located = pickups.filter((p) => p.profiles?.lat != null && p.profiles?.lng != null);
  const missing = pickups.filter((p) => p.profiles?.lat == null || p.profiles?.lng == null);

  const stops = useMemo(
    () => located.map((p) => ({ id: p.id, lat: p.profiles.lat as number, lng: p.profiles.lng as number, pickup: p })),
    [located],
  );

  // Ordre de secours (vol d'oiseau), affiché tant que le calcul routier n'a pas répondu
  const fallback = useMemo(() => {
    if (!optimized) {
      let d = 0;
      const pts = [home, ...stops, ...(roundTrip ? [home] : [])];
      for (let i = 0; i < pts.length - 1; i++) d += haversineKm(pts[i], pts[i + 1]);
      return { ordered: stops, distanceKm: d };
    }
    return optimizeRoute(home, stops, roundTrip);
  }, [stops, home, roundTrip, optimized]);

  // Trajet par les vraies rues (OSRM), calculé côté serveur
  const key = `${optimized}|${roundTrip}|${stops.map((s) => s.id).join(",")}`;
  useEffect(() => {
    if (stops.length === 0) {
      setRoad(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setRoadFailed(false);
    fetch("/api/trajet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        home: { lat: home.lat, lng: home.lng },
        stops: stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        roundTrip,
        optimize: optimized,
      }),
    })
      .then((r) => r.json())
      .then((data: { route: RoadRoute | null }) => {
        if (cancelled) return;
        setRoad(data.route);
        setRoadFailed(!data.route);
      })
      .catch(() => {
        if (!cancelled) setRoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, home.lat, home.lng]);

  const ordered = road ? road.order.map((i) => stops[i]).filter(Boolean) : fallback.ordered;
  const distanceKm = road?.distanceKm ?? fallback.distanceKm;

  const straightLine: [number, number][] = [[home.lat, home.lng], ...ordered.map((s) => [s.lat, s.lng] as [number, number])];
  if (roundTrip && ordered.length > 0) straightLine.push([home.lat, home.lng]);
  const line = road?.geometry ?? straightLine;

  const links = googleMapsLinks(home, ordered, 9);

  const copyList = async () => {
    const text = ordered
      .map((s, i) => `${i + 1}. ${s.pickup.profiles.full_name ?? s.pickup.profiles.email} — ${s.pickup.profiles.address ?? ""}${s.pickup.profiles.pickup_note ? ` [${s.pickup.profiles.pickup_note}]` : ""}${s.pickup.note ? ` (${s.pickup.note})` : ""}`)
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
          solidLine={!!road}
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
                {s.pickup.profiles.pickup_note && <p className="text-brand-800">📌 {s.pickup.profiles.pickup_note}</p>}
                {s.pickup.note && <p className="italic">« {s.pickup.note} »</p>}
              </div>
            ),
          }))}
        />
        <p className="mt-2 text-xs text-gray-500">
          {loading ? (
            "Calcul du trajet par les rues…"
          ) : road ? (
            <>
              Trajet par les rues : <strong>{distanceKm.toFixed(1)} km</strong> · environ {Math.round(road.durationMin)} min en auto
            </>
          ) : (
            <>
              Distance estimée (à vol d&apos;oiseau) : <strong>{distanceKm.toFixed(1)} km</strong>
            </>
          )}
          {" · Départ 🏠 "}
          {home.address ?? "point de départ (à définir dans Paramètres)"}
        </p>
        {roadFailed && !loading && stops.length > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            ⚠️ Le service de calcul d&apos;itinéraire n&apos;a pas répondu : affichage à vol d&apos;oiseau. Réessaie dans un instant.
          </p>
        )}
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
                    {s.pickup.profiles.pickup_note && <p className="text-xs text-brand-800">📌 {s.pickup.profiles.pickup_note}</p>}
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
