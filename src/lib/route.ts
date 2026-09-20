export type Stop = { id: string; lat: number; lng: number };

/** Distance à vol d'oiseau en km (haversine). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function tourLength(order: number[], dist: number[][], roundTrip: boolean): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i++) total += dist[order[i]][order[i + 1]];
  if (roundTrip && order.length > 1) total += dist[order[order.length - 1]][order[0]];
  return total;
}

/**
 * Optimise l'ordre des arrêts en partant de `home` (plus proche voisin + amélioration 2-opt).
 * Retourne les arrêts dans l'ordre optimal et la distance totale estimée (km, à vol d'oiseau).
 */
export function optimizeRoute<T extends Stop>(
  home: { lat: number; lng: number },
  stops: T[],
  roundTrip = true,
): { ordered: T[]; distanceKm: number } {
  if (stops.length === 0) return { ordered: [], distanceKm: 0 };

  const points = [home, ...stops];
  const n = points.length;
  const dist: number[][] = points.map((p) => points.map((q) => haversineKm(p, q)));

  // Plus proche voisin
  const visited = new Array(n).fill(false);
  const order = [0];
  visited[0] = true;
  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1];
    let best = -1;
    let bestD = Infinity;
    for (let j = 1; j < n; j++) {
      if (!visited[j] && dist[last][j] < bestD) {
        bestD = dist[last][j];
        best = j;
      }
    }
    order.push(best);
    visited[best] = true;
  }

  // 2-opt (l'index 0 = maison, reste fixe)
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 200) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const candidate = order.slice(0, i).concat(order.slice(i, k + 1).reverse(), order.slice(k + 1));
        if (tourLength(candidate, dist, roundTrip) + 1e-9 < tourLength(order, dist, roundTrip)) {
          order.splice(0, order.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  const ordered = order.slice(1).map((idx) => stops[idx - 1]);
  return { ordered, distanceKm: tourLength(order, dist, roundTrip) };
}

/** Lien Google Maps avec tous les arrêts dans l'ordre (max ~10 arrêts par lien sur mobile). */
export function googleMapsLink(home: { lat: number; lng: number }, stops: Stop[], roundTrip = true): string {
  const pts = [home, ...stops, ...(roundTrip ? [home] : [])];
  const path = pts.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}

/** Découpe en plusieurs liens si trop d'arrêts pour un seul lien Google Maps. */
export function googleMapsLinks(home: { lat: number; lng: number }, stops: Stop[], chunk = 9): string[] {
  if (stops.length === 0) return [];
  const links: string[] = [];
  let start = home;
  for (let i = 0; i < stops.length; i += chunk) {
    const part = stops.slice(i, i + chunk);
    const isLast = i + chunk >= stops.length;
    const pts = [start, ...part, ...(isLast ? [home] : [])];
    links.push(`https://www.google.com/maps/dir/${pts.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("/")}`);
    start = part[part.length - 1];
  }
  return links;
}
