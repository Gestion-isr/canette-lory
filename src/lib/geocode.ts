/**
 * Géocodage via Nominatim (OpenStreetMap), gratuit, sans clé.
 * Limité à ~1 requête/seconde : on l'appelle seulement quand l'utilisateur enregistre son adresse.
 */
export type GeocodeResult = { label: string; lat: number; lng: number };

// Boîte englobante approximative de Drummondville (lng min, lat max, lng max, lat min)
const DRUMMONDVILLE_VIEWBOX = "-72.60,45.98,-72.35,45.82";

export async function geocodeAddress(address: string): Promise<GeocodeResult[]> {
  const q = /drummond/i.test(address) ? address : `${address}, Drummondville, QC`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "ca");
  url.searchParams.set("viewbox", DRUMMONDVILLE_VIEWBOX);
  url.searchParams.set("bounded", "0");
  url.searchParams.set("accept-language", "fr");

  const res = await fetch(url, {
    headers: { "User-Agent": "collecte-cannettes-drummondville/1.0 (usage familial)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }));
}
