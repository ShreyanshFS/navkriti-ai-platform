import { NextResponse } from "next/server";
import { generateDraft } from "@/lib/studio";

// POST /api/designs/generate — the AI studio step (Amazon Bedrock in production)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const prompt = String(body?.prompt ?? "").trim();
  if (prompt.length < 8) {
    return NextResponse.json({ error: "Describe your idea in a sentence or two — colours, craft, occasion or budget help." }, { status: 400 });
  }
  const draft = generateDraft({
    prompt,
    craft: body?.craft ? String(body.craft) : null,
    category: body?.category ? String(body.category) : null,
  });
  return NextResponse.json({ draft });
}
