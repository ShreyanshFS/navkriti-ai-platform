import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, buyers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import { coordsFor } from "@/lib/studio";
import type { SessionUser } from "@/lib/types";

// GET /api/auth — demo accounts for the login portal (Cognito user pool in production)
export async function GET() {
  await ensureSeeded();
  const [b, a] = await Promise.all([
    db.select().from(buyers),
    db.select().from(artisans),
  ]);
  return NextResponse.json({
    buyers: b.map((x) => ({ id: x.id, name: x.name, city: x.city, avatar: x.avatar, phone: x.phone })),
    artisans: a.map((x) => ({ id: x.id, name: x.name, craft: x.craft, city: x.city, avatar: x.avatar, category: x.category, rating: x.rating })),
  });
}

// POST /api/auth — { action: "login" | "register" }
export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  if (body.action === "login") {
    const { role, id } = body;
    if (role === "buyer") {
      const rows = await db.select().from(buyers).where(eq(buyers.id, String(id)));
      if (!rows[0]) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      const user: SessionUser = { id: rows[0].id, role: "buyer", name: rows[0].name, city: rows[0].city, avatar: rows[0].avatar, lat: rows[0].lat, lng: rows[0].lng };
      return NextResponse.json({ user });
    }
    if (role === "artisan") {
      const rows = await db.select().from(artisans).where(eq(artisans.id, String(id)));
      if (!rows[0]) return NextResponse.json({ error: "Account not found" }, { status: 404 });
      const user: SessionUser = { id: rows[0].id, role: "artisan", name: rows[0].name, city: rows[0].city, avatar: rows[0].avatar, craft: rows[0].craft };
      return NextResponse.json({ user });
    }
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }

  if (body.action === "register") {
    const name = String(body.name ?? "").trim();
    const city = String(body.city ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (!name || !city || !phone) return NextResponse.json({ error: "Name, city and phone are required." }, { status: 400 });
    const { lat, lng, state } = coordsFor(city);

    if (body.role === "artisan") {
      const craft = String(body.craft ?? "").trim();
      const category = body.category === "paintings" ? "paintings" : "textiles";
      if (!craft) return NextResponse.json({ error: "Tell us your craft." }, { status: 400 });
      const cover = category === "paintings" ? "/images/concepts/madhubani.jpg" : "/images/concepts/ajrakh-indigo.jpg";
      const [row] = await db
        .insert(artisans)
        .values({
          name, phone, craft, category, city, lat, lng, state,
          tagline: String(body.tagline ?? `Handmade ${craft.toLowerCase()}, made to order.`),
          bio: String(body.bio ?? `${name} is a ${craft.toLowerCase()} artisan based in ${city}, now taking custom commissions through Navkriti.`),
          years: Math.max(1, Math.round(Number(body.years) || 3)),
          startingPrice: Math.max(200, Math.round(Number(body.startingPrice) || 800)),
          avatar: "", cover,
          portfolio: [cover],
          techniques: [craft],
          languages: ["Hindi", "English"],
          verified: false,
          acceptingOrders: true,
          rating: 0,
          reviewCount: 0,
        })
        .returning();
      const user: SessionUser = { id: row.id, role: "artisan", name: row.name, city: row.city, avatar: null, craft: row.craft };
      return NextResponse.json({ user }, { status: 201 });
    }

    const [row] = await db
      .insert(buyers)
      .values({ name, phone, city, lat, lng, avatar: "" })
      .returning();
    const user: SessionUser = { id: row.id, role: "buyer", name: row.name, city: row.city, avatar: null, lat: row.lat, lng: row.lng };
    return NextResponse.json({ user }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
