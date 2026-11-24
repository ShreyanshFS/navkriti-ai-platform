import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, buyers, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

// GET /api/reviews?artisanId=
export async function GET(req: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const artisanId = searchParams.get("artisanId");
  const rows = artisanId
    ? await db.select().from(reviews).where(eq(reviews.artisanId, artisanId)).orderBy(desc(reviews.createdAt))
    : await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  return NextResponse.json(rows);
}

// POST /api/reviews — a buyer rates the artisan; artisan averages are recomputed
export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => null);
  const artisanId = String(body?.artisanId ?? "");
  const rating = Math.min(5, Math.max(1, Math.round(Number(body?.rating) || 0)));
  const text = String(body?.body ?? "").trim();
  const buyerId = body?.buyerId ? String(body.buyerId) : null;

  if (!artisanId || !rating) return NextResponse.json({ error: "Pick a star rating." }, { status: 400 });
  if (text.length < 4) return NextResponse.json({ error: "Add a line about the work." }, { status: 400 });

  let buyerName = "A Navkriti customer";
  if (buyerId) {
    const [buyer] = await db.select().from(buyers).where(eq(buyers.id, buyerId));
    if (buyer) buyerName = buyer.name;
  }

  const [review] = await db
    .insert(reviews)
    .values({ artisanId, buyerName, rating, body: text.slice(0, 800) })
    .returning();

  const all = await db.select().from(reviews).where(eq(reviews.artisanId, artisanId));
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  await db
    .update(artisans)
    .set({ rating: Math.round(avg * 10) / 10, reviewCount: all.length })
    .where(eq(artisans.id, artisanId));

  return NextResponse.json({ review, rating: avg, reviewCount: all.length }, { status: 201 });
}
