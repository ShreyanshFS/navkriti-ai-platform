import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, buyers, conversations, designs, messages, orders } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/conversations/[id] — thread + design + parties + order
export async function GET(_req: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const rows = await db
    .select({ conversation: conversations, design: designs, artisan: artisans, buyer: buyers })
    .from(conversations)
    .innerJoin(designs, eq(conversations.designId, designs.id))
    .innerJoin(artisans, eq(conversations.artisanId, artisans.id))
    .innerJoin(buyers, eq(conversations.buyerId, buyers.id))
    .where(eq(conversations.id, id));
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const [thread, orderRows] = await Promise.all([
    db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt),
    db.select().from(orders).where(eq(orders.conversationId, id)).orderBy(desc(orders.createdAt)),
  ]);

  return NextResponse.json({
    conversation: row,
    messages: thread,
    order: orderRows[0] ?? null,
  });
}

// POST /api/conversations/[id] — send a message or a structured quote
export async function POST(req: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const senderRole = body?.senderRole === "artisan" ? "artisan" : "buyer";
  const kind = body?.kind === "quote" ? "quote" : "text";

  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  if (conversation.status === "locked") return NextResponse.json({ error: "This deal is already locked." }, { status: 400 });

  const text = String(body?.body ?? "").trim();
  const amount = kind === "quote" ? Math.max(0, Math.round(Number(body?.amount) || 0)) : null;
  const etaDays = kind === "quote" ? Math.max(1, Math.round(Number(body?.etaDays) || 14)) : null;
  if (kind === "text" && !text) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  if (kind === "quote" && (!amount || amount <= 0)) return NextResponse.json({ error: "Add a price to your quote." }, { status: 400 });

  const senderName = senderRole === "buyer" ? conversation.buyerId : conversation.artisanId;
  const party = senderRole === "buyer"
    ? (await db.select().from(buyers).where(eq(buyers.id, senderName)))[0]
    : (await db.select().from(artisans).where(eq(artisans.id, senderName)))[0];

  const [message] = await db
    .insert(messages)
    .values({
      conversationId: id,
      senderRole,
      senderName: party?.name ?? (senderRole === "buyer" ? "Buyer" : "Artisan"),
      body: text || (kind === "quote" ? "Sharing my quotation for this piece." : ""),
      kind,
      amount,
      etaDays,
    })
    .returning();

  await db.update(conversations).set({ lastAt: new Date() }).where(eq(conversations.id, id));

  return NextResponse.json({ message }, { status: 201 });
}

// PATCH /api/conversations/[id] — reserved for read/typing state in production
export async function PATCH(req: Request, { params }: Params) {
  await ensureSeeded();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (body?.status !== "open" && body?.status !== "locked") {
    return NextResponse.json({ error: "status must be open or locked" }, { status: 400 });
  }
  const [row] = await db.update(conversations).set({ status: body.status }).where(eq(conversations.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  return NextResponse.json({ conversation: row });
}

export const dynamic = "force-dynamic";
void and;
