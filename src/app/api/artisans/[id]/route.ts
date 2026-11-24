import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, designs, orders, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/artisans/[id] — full profile: portfolio, reviews, works delivered
export async function GET(_req: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const [artisan] = await db.select().from(artisans).where(eq(artisans.id, id));
  if (!artisan) return NextResponse.json({ error: "Artisan not found" }, { status: 404 });

  const [reviewRows, designRows, orderRows] = await Promise.all([
    db.select().from(reviews).where(eq(reviews.artisanId, id)).orderBy(desc(reviews.createdAt)),
    db.select().from(designs).where(eq(designs.artisanId, id)),
    db.select().from(orders).where(eq(orders.artisanId, id)),
  ]);

  return NextResponse.json({
    artisan,
    reviews: reviewRows,
    works: designRows.filter((d) => d.status === "locked").length,
    orders: orderRows.length,
    earnings: orderRows.reduce((s, o) => s + o.amount, 0),
  });
}

// PATCH /api/artisans/[id] — artisan updates availability / profile basics
export async function PATCH(req: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const patch: Record<string, unknown> = {};
  if (typeof body?.acceptingOrders === "boolean") patch.acceptingOrders = body.acceptingOrders;
  if (body?.startingPrice != null) patch.startingPrice = Math.max(100, Math.round(Number(body.startingPrice) || 100));
  if (typeof body?.tagline === "string") patch.tagline = body.tagline.slice(0, 160);
  if (typeof body?.bio === "string") patch.bio = body.bio.slice(0, 1200);
  if (body?.city) patch.city = String(body.city).slice(0, 80);
  if (Array.isArray(body?.portfolio)) patch.portfolio = body.portfolio.map((x: unknown) => String(x)).slice(0, 12);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const [row] = await db.update(artisans).set(patch).where(eq(artisans.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Artisan not found" }, { status: 404 });
  return NextResponse.json({ artisan: row });
}
