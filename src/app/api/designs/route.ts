import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, buyers, conversations, designs, messages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";
import type { Draft } from "@/lib/studio";

// GET /api/designs?buyerId= | ?artisanId=
export async function GET(req: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId");
  const artisanId = searchParams.get("artisanId");

  const rows = await db
    .select({ design: designs, artisan: artisans, buyer: buyers })
    .from(designs)
    .leftJoin(artisans, eq(designs.artisanId, artisans.id))
    .innerJoin(buyers, eq(designs.buyerId, buyers.id))
    .orderBy(desc(designs.createdAt));

  const filtered = rows.filter((r) =>
    buyerId ? r.design.buyerId === buyerId : artisanId ? r.design.artisanId === artisanId : true,
  );
  return NextResponse.json(filtered.map((r) => ({ ...r.design, artisan: r.artisan, buyer: r.buyer })));
}

// POST /api/designs — send an AI-generated design to a chosen artisan
export async function POST(req: Request) {
  await ensureSeeded();
  const body = await req.json().catch(() => null);
  const buyerId = body?.buyerId ? String(body.buyerId) : "";
  const artisanId = body?.artisanId ? String(body.artisanId) : "";
  const draft = body?.draft as Draft | undefined;
  if (!buyerId || !artisanId || !draft?.title || !draft?.spec) {
    return NextResponse.json({ error: "Pick an artisan and generate a design first." }, { status: 400 });
  }

  const [artisan] = await db.select().from(artisans).where(eq(artisans.id, artisanId));
  const [buyer] = await db.select().from(buyers).where(eq(buyers.id, buyerId));
  if (!artisan || !buyer) return NextResponse.json({ error: "Buyer or artisan not found." }, { status: 404 });

  const [design] = await db
    .insert(designs)
    .values({
      buyerId, artisanId,
      title: String(draft.title).slice(0, 160),
      prompt: String(draft.prompt ?? "").slice(0, 2000),
      craft: String(draft.craft),
      category: String(draft.category),
      itemType: String(draft.itemType),
      materials: draft.materials ?? [],
      colors: draft.colors ?? [],
      budget: Math.max(0, Math.round(Number(draft.budget) || 0)),
      timelineDays: Math.max(3, Math.round(Number(draft.timelineDays) || 14)),
      notes: String(draft.notes ?? ""),
      spec: draft.spec,
      status: "sent",
    })
    .returning();

  const [conversation] = await db
    .insert(conversations)
    .values({ designId: design.id, buyerId, artisanId, status: "open", lastAt: new Date() })
    .returning();

  await db.insert(messages).values({
    conversationId: conversation.id,
    senderRole: "buyer",
    senderName: buyer.name,
    body: `Hi ${artisan.name.split(" ")[0]}! I designed this in the AI studio — ${draft.title}. ${draft.prompt ? `My idea: “${draft.prompt}”` : ""} Budget around ₹${Number(draft.budget).toLocaleString("en-IN")}, needed in ${draft.timelineDays} days. Can you make it?`,
    kind: "text",
  });

  return NextResponse.json({ design, conversation }, { status: 201 });
}
