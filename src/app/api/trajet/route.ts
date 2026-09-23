import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/server";
import { roadRoute, roadTrip, type Point } from "@/lib/osrm";

type Body = { home: Point; stops: Point[]; roundTrip: boolean; optimize: boolean };

const isPoint = (p: unknown): p is Point =>
  typeof p === "object" && p !== null && Number.isFinite((p as Point).lat) && Number.isFinite((p as Point).lng);

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile?.is_admin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await request.json()) as Partial<Body>;
  if (!isPoint(body.home) || !Array.isArray(body.stops) || !body.stops.every(isPoint)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (body.stops.length === 0) return NextResponse.json({ route: null });
  if (body.stops.length > 50) return NextResponse.json({ error: "Trop d'arrêts (max 50)" }, { status: 400 });

  const roundTrip = body.roundTrip !== false;
  const route = body.optimize === false
    ? await roadRoute(body.home, body.stops, roundTrip)
    : await roadTrip(body.home, body.stops, roundTrip);

  return NextResponse.json({ route });
}
