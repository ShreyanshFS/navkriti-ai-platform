import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { distanceKm } from "@/lib/studio";

// GET /api/artisans?lat=&lng=&category=&q= — curated sellers, sorted by distance
export async function GET(req: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const hasGeo = searchParams.has("lat") && searchParams.has("lng") && Number.isFinite(lat) && Number.isFinite(lng);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();

  let rows = await db.select().from(artisans);
  if (category && category !== "all") rows = rows.filter((a) => a.category === category);
  if (q) {
    rows = rows.filter((a) =>
      [a.name, a.craft, a.city, a.state, ...a.techniques].join(" ").toLowerCase().includes(q),
    );
  }

  const withDistance = rows.map((a) => ({
    ...a,
    distanceKm: hasGeo ? distanceKm({ lat, lng }, { lat: a.lat, lng: a.lng }) : null,
  }));

  withDistance.sort((x, y) => {
    if (x.distanceKm != null && y.distanceKm != null && x.distanceKm !== y.distanceKm) return x.distanceKm - y.distanceKm;
    return y.rating - x.rating;
  });

  return NextResponse.json(withDistance);
}
