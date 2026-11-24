import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, buyers, conversations, designs, messages, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

// GET /api/orders?buyerId= | ?artisanId= — orders with delivery details
export async function GET(req: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId");
  const artisanId = searchParams.get("artisanId");

  const rows = await db
    .select({ order: orders, design: designs, artisan: artisans, buyer: buyers })
    .from(orders)
    .innerJoin(designs, eq(orders.designId, designs.id))
    .innerJoin(artisans, eq(orders.artisanId, artisans.id))
    .innerJoin(buyers, eq(orders.buyerId, buyers.id))
    .orderBy(desc(orders.createdAt));

  const filtered = rows.filter((r) => (buyerId ? r.order.buyerId === buyerId : artisanId ? r.order.artisanId === artisanId : true));
  return NextResponse.json(filtered.map((r) => ({ ...r.order, design: r.design, artisan: r.artisan, buyer: r.buyer })));
}

// POST /api/orders — buyer locks the deal (amount + delivery address)
export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => null);
  const conversationId = String(body?.conversationId ?? "");
  const amount = Math.max(0, Math.round(Number(body?.amount) || 0));
  const address = String(body?.address ?? "").trim();
  const city = String(body?.city ?? "").trim();
  const pincode = String(body?.pincode ?? "").trim();
  const etaDays = Math.max(1, Math.round(Number(body?.etaDays) || 14));

  if (!conversationId || !amount) return NextResponse.json({ error: "A locked deal needs an agreed amount." }, { status: 400 });
  if (!address || !city || !/^\d{5,6}$/.test(pincode)) {
    return NextResponse.json({ error: "Add the full delivery address, city and a valid 6-digit pincode." }, { status: 400 });
  }

  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.status === "locked") return NextResponse.json({ error: "This deal is already locked." }, { status: 400 });

  const [order] = await db
    .insert(orders)
    .values({
      conversationId,
      designId: conversation.designId,
      buyerId: conversation.buyerId,
      artisanId: conversation.artisanId,
      amount,
      address,
      city,
      pincode,
      etaDays,
      note: String(body?.note ?? "").slice(0, 600),
      status: "locked",
    })
    .returning();

  await db.update(conversations).set({ status: "locked", lastAt: new Date() }).where(eq(conversations.id, conversationId));
  await db.update(designs).set({ status: "locked" }).where(eq(designs.id, conversation.designId));

  const [artisan] = await db.select().from(artisans).where(eq(artisans.id, conversation.artisanId));
  await db.insert(messages).values({
    conversationId,
    senderRole: "system",
    senderName: "Navkriti",
    kind: "system",
    body: `Deal locked at ₹${amount.toLocaleString("en-IN")} · delivery in ${etaDays} days to ${city} ${pincode}. ${artisan ? `${artisan.name} has been notified.` : ""}`,
  });

  return NextResponse.json({ order }, { status: 201 });
}

// PATCH /api/orders — artisan moves an order along (in_progress | shipped | delivered)
export async function PATCH(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  const status = String(body?.status ?? "");
  if (!id || !["locked", "in_progress", "shipped", "delivered"].includes(status)) {
    return NextResponse.json({ error: "Unknown order status" }, { status: 400 });
  }
  const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (status !== "locked") {
    await db.insert(messages).values({
      conversationId: order.conversationId,
      senderRole: "system",
      senderName: "Navkriti",
      kind: "system",
      body: `Order marked ${status.replace("_", " ")} by the artisan.`,
    });
  }
  return NextResponse.json({ order });
}
