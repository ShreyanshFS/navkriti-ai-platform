import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, buyers, conversations, designs, messages, orders } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import type { ConversationT } from "@/lib/types";

// GET /api/conversations?buyerId= | ?artisanId= — inbox threads with design + last message
export async function GET(req: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId");
  const artisanId = searchParams.get("artisanId");

  const rows = await db
    .select({ conversation: conversations, design: designs, artisan: artisans, buyer: buyers })
    .from(conversations)
    .innerJoin(designs, eq(conversations.designId, designs.id))
    .innerJoin(artisans, eq(conversations.artisanId, artisans.id))
    .innerJoin(buyers, eq(conversations.buyerId, buyers.id))
    .where(buyerId ? eq(conversations.buyerId, buyerId) : artisanId ? eq(conversations.artisanId, artisanId) : undefined)
    .orderBy(desc(conversations.lastAt));

  if (rows.length === 0) return NextResponse.json([]);
  const ids = rows.map((r) => r.conversation.id);

  const [allMessages, allOrders] = await Promise.all([
    db.select().from(messages).where(inArray(messages.conversationId, ids)),
    db.select().from(orders).where(inArray(orders.conversationId, ids)),
  ]);

  const payload: ConversationT[] = rows.map((r) => {
    const thread = allMessages
      .filter((m) => m.conversationId === r.conversation.id)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    const order = allOrders.find((o) => o.conversationId === r.conversation.id) ?? null;
    return {
      id: r.conversation.id,
      designId: r.conversation.designId,
      buyerId: r.conversation.buyerId,
      artisanId: r.conversation.artisanId,
      status: r.conversation.status as "open" | "locked",
      lastAt: r.conversation.lastAt.toISOString(),
      createdAt: r.conversation.createdAt.toISOString(),
      design: { ...r.design, createdAt: r.design.createdAt.toISOString() } as ConversationT["design"],
      artisan: { ...r.artisan, createdAt: r.artisan.createdAt.toISOString() } as ConversationT["artisan"],
      buyer: { ...r.buyer, createdAt: r.buyer.createdAt.toISOString() } as ConversationT["buyer"],
      last: thread.length ? ({ ...thread[thread.length - 1], createdAt: thread[thread.length - 1].createdAt.toISOString() } as ConversationT["last"]) : null,
      order: order ? { ...order, createdAt: order.createdAt.toISOString() } as ConversationT["order"] : null,
    };
  });

  return NextResponse.json(payload);
}
