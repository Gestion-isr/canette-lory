/**
 * Calcul d'itinéraire par les vraies rues via OSRM (projet OpenStreetMap, gratuit, sans clé).
 * Le service « trip » résout aussi l'ordre optimal des arrêts (problème du voyageur de commerce).
 * En cas d'échec (service indisponible), l'appelant retombe sur le calcul à vol d'oiseau.
 */
const OSRM = "https://router.project-osrm.org";
const TIMEOUT_MS = 12000;

export type Point = { lat: number; lng: number };

export type RoadRoute = {
  /** Index des arrêts (hors maison) dans l'ordre de passage */
  order: number[];
  /** Tracé à suivre, en [lat, lng] */
  geometry: [number, number][];
  distanceKm: number;
  durationMin: number;
};

function coords(points: Point[]): string {
  return points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
}

async function call(url: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "collecte-cannettes/1.0" } });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return data.code === "Ok" ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Geo = { coordinates: [number, number][] };
const toLatLng = (g: Geo): [number, number][] => g.coordinates.map(([lng, lat]) => [lat, lng]);

/** Ordre optimal + tracé routier, en partant de `home` (index 0). */
export async function roadTrip(home: Point, stops: Point[], roundTrip: boolean): Promise<RoadRoute | null> {
  if (stops.length === 0) return null;
  const url =
    `${OSRM}/trip/v1/driving/${coords([home, ...stops])}` +
    `?source=first&roundtrip=${roundTrip}&geometries=geojson&overview=full`;
  const data = await call(url);
  if (!data) return null;

  const trips = data.trips as { distance: number; duration: number; geometry: Geo }[] | undefined;
  const waypoints = data.waypoints as { waypoint_index: number }[] | undefined;
  if (!trips?.[0] || !waypoints) return null;

  // waypoint_index donne la position de chaque point dans le trajet ; l'index 0 est la maison.
  const order = waypoints
    .map((w, i) => ({ stopIndex: i - 1, pos: w.waypoint_index }))
    .filter((w) => w.stopIndex >= 0)
    .sort((a, b) => a.pos - b.pos)
    .map((w) => w.stopIndex);

  return {
    order,
    geometry: toLatLng(trips[0].geometry),
    distanceKm: trips[0].distance / 1000,
    durationMin: trips[0].duration / 60,
  };
}

/** Tracé routier en respectant l'ordre fourni (sans optimisation). */
export async function roadRoute(home: Point, stops: Point[], roundTrip: boolean): Promise<RoadRoute | null> {
  if (stops.length === 0) return null;
  const points = [home, ...stops, ...(roundTrip ? [home] : [])];
  const data = await call(`${OSRM}/route/v1/driving/${coords(points)}?geometries=geojson&overview=full`);
  if (!data) return null;
  const routes = data.routes as { distance: number; duration: number; geometry: Geo }[] | undefined;
  if (!routes?.[0]) return null;
  return {
    order: stops.map((_, i) => i),
    geometry: toLatLng(routes[0].geometry),
    distanceKm: routes[0].distance / 1000,
    durationMin: routes[0].duration / 60,
  };
}
