"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  Eye,
  IndianRupee,
  Layers,
  Loader2,
  MapPin,
  Palette,
  RefreshCw,
  Scissors,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { ArtisanT, DraftT, SessionUser } from "@/lib/types";
import { formatDistance, type Layout, type Motif, type ZoneSpec } from "@/lib/studio";
import { Avatar, Badge, Btn, Modal, Stars } from "@/components/ui";
import { DesignArtwork } from "@/components/design-artwork";
import { ArtistModal } from "./discover";

const EXAMPLES = [
  "I want a kurti with chikankari design on the yoke and the area around the hand with a rust block pattern design, cotton mulmul, around ₹3,400",
  "Indigo ajrakh dupatta with madder red geometric border on both ends, natural dyes, for a wedding, 2 weeks",
  "Custom maroon Banarasi silk blouse with gold zari brocade on the sleeves and keyhole back, ₹2,800",
  "Madhubani tree-of-life painting for our living room wall, earthy ochre and deep green, 3×2 feet, ₹7,500",
  "Set of 8 terracotta kantha cushion covers with contrast running stitch border for our café, ₹6,000",
];

const MOTIFS: { key: Motif; label: string }[] = [
  { key: "floral", label: "Chikankari Floral" },
  { key: "geometric", label: "Block Geometric" },
  { key: "paisley", label: "Zari Paisley" },
  { key: "lattice", label: "Ajrakh Lattice" },
  { key: "tree", label: "Folk Tree" },
];

const LAYOUTS: { key: Layout; label: string }[] = [
  { key: "kurti", label: "Kurti / Garment" },
  { key: "panel", label: "Saree / Dupatta" },
  { key: "swatch", label: "Fabric Swatch" },
  { key: "framed", label: "Framed Art" },
];

export function Studio({
  buyer,
  artisans,
  preselected,
  onSent,
  onBrowse,
}: {
  buyer: SessionUser;
  artisans: ArtisanT[];
  preselected: string | null;
  onSent: (conversationId: string) => void;
  onBrowse: () => void;
}) {
  const [prompt, setPrompt] = useState(EXAMPLES[0]);
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [category, setCategory] = useState<"all" | "textiles" | "paintings">("all");
  const [draft, setDraft] = useState<DraftT | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(preselected);
  const [inspectArtistId, setInspectArtistId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"blueprint" | "split">("split");

  useEffect(() => {
    if (preselected) setChosenId(preselected);
  }, [preselected]);

  // Auto-generate initial flagship custom kurti concept on first mount so the studio feels alive immediately
  useEffect(() => {
    generateFromPrompt(EXAMPLES[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosenArtisan = useMemo(
    () => artisans.find((a) => a.id === chosenId) ?? null,
    [artisans, chosenId],
  );

  const candidates = useMemo(() => {
    return [...artisans]
      .map((a) => {
        const match = draft
          ? [a.craft, ...a.techniques]
              .join(" ")
              .toLowerCase()
              .includes(draft.craft.toLowerCase().split(" ")[0])
            ? 0
            : 1
          : 0;
        return { artisan: a, match };
      })
      .sort((x, y) => x.match - y.match || (x.artisan.distanceKm ?? 99999) - (y.artisan.distanceKm ?? 99999));
  }, [artisans, draft]);

  async function generateFromPrompt(textToUse?: string) {
    const activePrompt = (textToUse ?? prompt).trim();
    setError(null);
    if (activePrompt.length < 8) {
      setError("Explain what you want in a sentence — mention the item, craft, sleeve/neck details or colours.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/designs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          category: category === "all" ? null : category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate");
      const d = data.draft as DraftT;
      const next: DraftT = {
        ...d,
        budget: budget ? Number(budget) || d.budget : d.budget,
        timelineDays: days ? Number(days) || d.timelineDays : d.timelineDays,
        zones: d.zones ?? d.spec.zones ?? [],
        spec: { ...d.spec },
      };
      setDraft(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate");
    } finally {
      setGenerating(false);
    }
  }

  function regenerateVariation() {
    if (!draft) return;
    setDraft({
      ...draft,
      spec: { ...draft.spec, seed: Math.floor(Math.random() * 99999) },
    });
  }

  function updateZone(idx: number, patch: Partial<ZoneSpec>) {
    if (!draft) return;
    const current = draft.zones ?? draft.spec.zones ?? [];
    const updated = current.map((z, i) => (i === idx ? { ...z, ...patch } : z));
    setDraft({
      ...draft,
      zones: updated,
      spec: { ...draft.spec, zones: updated },
    });
  }

  async function sendToArtisan(artisanId: string) {
    if (!draft) return;
    setSending(artisanId);
    setError(null);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: buyer.id,
          artisanId,
          draft: {
            ...draft,
            prompt: prompt || draft.prompt,
            spec: { ...draft.spec, zones: draft.zones ?? draft.spec.zones },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send");
      setSendOpen(false);
      onSent(data.conversation.id as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send");
    } finally {
      setSending(null);
    }
  }

  const zones = draft?.zones ?? draft?.spec.zones ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-terracotta">
            <Wand2 className="size-3.5" /> Amazon Bedrock · AI Custom Design Studio
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Explain your custom design. See it come to life.
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
            Describe where you want each craft — like{" "}
            <strong className="font-semibold text-ink">
              “a kurti with chikankari on the yoke and block pattern around the hands”
            </strong>
            . AI maps every garment zone, renders the visual concept, and sends it straight to your chosen artisan.
          </p>
        </div>
        <Badge tone="indigo">
          <Sparkles className="size-3" /> Live AI Blueprint + Craft Render
        </Badge>
      </div>

      {/* Selected Artist Strip (or quick selector) */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[1.5px] border-ink/12 bg-cream px-4 py-3">
        {chosenArtisan ? (
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={chosenArtisan.name} src={chosenArtisan.avatar} size={40} color="#C1502E" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-leaf">Selected Artist</span>
                <button
                  onClick={() => setInspectArtistId(chosenArtisan.id)}
                  className="font-display text-[15px] font-semibold text-ink underline-offset-4 hover:text-terracotta hover:underline"
                >
                  {chosenArtisan.name}
                </button>
                <Stars value={chosenArtisan.rating} count={chosenArtisan.reviewCount} size={11} />
              </div>
              <p className="text-[11.5px] text-ink-faint">
                {chosenArtisan.craft} · {chosenArtisan.city}
                {chosenArtisan.distanceKm != null ? ` · ${formatDistance(chosenArtisan.distanceKm)} away` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-terracotta/12 text-terracotta">
              <Scissors className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">Designing for any nearby artisan</p>
              <p className="text-[11px] text-ink-faint">Pick a specific tailor or artisan now, or choose after generating your concept.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {chosenArtisan && (
            <button
              onClick={() => setInspectArtistId(chosenArtisan.id)}
              className="flex items-center gap-1 rounded-full border border-ink/15 bg-paper px-3 py-1.5 text-[11.5px] font-semibold text-ink hover:border-terracotta"
            >
              <Eye className="size-3.5 text-terracotta" /> View {chosenArtisan.name.split(" ")[0]}&apos;s Past Work
            </button>
          )}
          <select
            value={chosenId ?? ""}
            onChange={(e) => setChosenId(e.target.value || null)}
            className="field !w-auto !py-1.5 !text-[12px] font-semibold"
          >
            <option value="">Choose artist when sending…</option>
            {artisans.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.craft} ({a.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* ── LEFT COLUMN: PLAIN-LANGUAGE EXPLANATION & CONTROLS ── */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border-[1.5px] border-ink/12 bg-cream p-5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                1. Explain your custom design in plain words
              </label>
              <span className="text-[10.5px] font-semibold text-terracotta">Hindi or English</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="e.g. I want a kurti with chikankari design on the yoke and the area around the hand with a rust block pattern design…"
              className="field mt-2 resize-none text-[13.5px] leading-relaxed"
            />

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
              Try a custom idea (click to load & render):
            </p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {EXAMPLES.map((ex, idx) => (
                <button
                  key={ex}
                  onClick={() => {
                    setPrompt(ex);
                    generateFromPrompt(ex);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left text-[11.5px] leading-snug transition-all ${
                    prompt === ex
                      ? "border-terracotta bg-terracotta/10 font-semibold text-ink"
                      : "border-ink/12 bg-paper text-ink-soft hover:border-terracotta/60 hover:text-ink"
                  }`}
                >
                  <span className="mr-1.5 inline-block rounded bg-ink/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-ink">
                    #{idx + 1}
                  </span>
                  {ex}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {(
                [
                  ["all", "Auto-detect"],
                  ["textiles", "Tailoring & Textiles"],
                  ["paintings", "Paintings & Art"],
                ] as const
              ).map(([c, label]) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-lg border-[1.5px] px-2 py-2 text-[11px] font-semibold transition-all ${
                    category === c ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink-soft hover:border-ink/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
                  Target Budget (₹)
                </span>
                <input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
                  placeholder="AI estimates if blank"
                  inputMode="numeric"
                  className="field !py-2 !text-[12.5px]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
                  Timeline (days)
                </span>
                <input
                  value={days}
                  onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
                  placeholder="AI estimates if blank"
                  inputMode="numeric"
                  className="field !py-2 !text-[12.5px]"
                />
              </label>
            </div>

            {error && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-terracotta/40 bg-terracotta/10 px-3.5 py-2.5 text-[12px] font-medium text-terracotta-deep">
                <CircleAlert className="mt-0.5 size-3.5 shrink-0" /> {error}
              </p>
            )}

            <Btn size="lg" onClick={() => generateFromPrompt()} loading={generating} className="mt-4 w-full">
              {generating ? "Generating custom visual & zones…" : "Generate Custom Design with AI"}
              {!generating && <Sparkles className="size-4" />}
            </Btn>
          </div>
        </div>

        {/* ── RIGHT COLUMN: GENERATED VISUAL CONCEPT + CUSTOM ZONE MAP ── */}
        <div className="lg:col-span-7">
          {!draft ? (
            <div className="flex h-full min-h-[460px] flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-ink/20 bg-cream/50 p-8 text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-terracotta/10 text-terracotta">
                {generating ? <Loader2 className="size-7 animate-spin" /> : <Wand2 className="size-7" />}
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-ink">
                {generating ? "Mapping yoke, sleeves & motifs…" : "Your AI design concept will appear here"}
              </p>
              <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-ink-faint">
                Explain your idea on the left and hit Generate to see the custom silhouette, craft zones and price estimate.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border-[1.5px] border-ink/12 bg-cream">
              {/* Top concept bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-paper/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="terracotta">{draft.craft}</Badge>
                  <Badge tone="neutral">{draft.itemType}</Badge>
                  <Badge tone="leaf">{draft.confidence}% AI match</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewMode(viewMode === "split" ? "blueprint" : "split")}
                    className="rounded-full border border-ink/15 bg-cream px-2.5 py-1 text-[10.5px] font-semibold text-ink-soft hover:border-ink"
                  >
                    {viewMode === "split" ? "Focus Blueprint" : "Show Craft Texture"}
                  </button>
                  <button
                    onClick={regenerateVariation}
                    className="flex items-center gap-1 rounded-full border border-ink/15 bg-cream px-2.5 py-1 text-[10.5px] font-semibold text-ink-soft hover:border-terracotta hover:text-terracotta"
                  >
                    <RefreshCw className="size-3" /> New variation
                  </button>
                </div>
              </div>

              {/* Visual stage: Blueprint SVG + Craft Reference Photo */}
              <div className={`grid border-b border-ink/10 ${viewMode === "split" ? "sm:grid-cols-[1.25fr_0.75fr]" : "grid-cols-1"}`}>
                <div className="relative bg-paper/40 p-3">
                  <DesignArtwork spec={draft.spec} className="mx-auto max-h-[370px] w-full rounded-xl border border-ink/10" />
                  <span className="absolute left-5 top-5 flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-marigold backdrop-blur">
                    <Sparkles className="size-2.5" /> AI Custom Zone Blueprint
                  </span>
                </div>

                {viewMode === "split" && (
                  <div className="flex flex-col justify-between border-t border-ink/10 bg-paper/30 p-4 sm:border-l sm:border-t-0">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
                        Craft Surface & Motif Reference
                      </p>
                      <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl border border-ink/12">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draft.spec.photoUrl ?? "/images/concepts/kantha-terracotta.jpg"}
                          alt={draft.craft}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[9.5px] font-semibold text-cream">
                          Authentic {draft.craft} texture
                        </span>
                      </div>

                      {/* Interactive silhouette & motif switcher */}
                      <div className="mt-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">
                          <Palette className="size-3" /> Customize Silhouette
                        </p>
                        <div className="mt-1.5 grid grid-cols-2 gap-1">
                          {LAYOUTS.map((l) => (
                            <button
                              key={l.key}
                              onClick={() => setDraft({ ...draft, spec: { ...draft.spec, layout: l.key } })}
                              className={`rounded-lg border px-2 py-1 text-[10.5px] font-semibold transition-all ${
                                draft.spec.layout === l.key
                                  ? "border-ink bg-ink text-cream"
                                  : "border-ink/15 bg-cream text-ink-soft hover:border-ink/40"
                              }`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">Primary Motif</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {MOTIFS.map((m) => (
                            <button
                              key={m.key}
                              onClick={() => setDraft({ ...draft, spec: { ...draft.spec, motif: m.key } })}
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                                draft.spec.motif === m.key
                                  ? "border-terracotta bg-terracotta text-cream"
                                  : "border-ink/15 bg-cream text-ink-soft"
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Color Palette */}
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-faint">Extracted Dye Palette</p>
                      <div className="mt-1.5 flex gap-1.5">
                        {draft.colors.map((c) => (
                          <div key={c.name} className="flex-1">
                            <div className="h-6 rounded-md border border-ink/15" style={{ backgroundColor: c.hex }} />
                            <p className="mt-0.5 truncate text-center text-[9px] font-medium text-ink-faint">{c.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Details + Editable Zone-by-Zone Breakdown */}
              <div className="p-5">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full border-b border-dashed border-ink/20 bg-transparent pb-1.5 font-display text-2xl font-semibold text-ink outline-none focus:border-terracotta"
                />

                {/* Custom Zone Breakdown */}
                {zones.length > 0 && (
                  <div className="mt-4">
                    <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
                      <Layers className="size-3.5" /> Custom Placement Breakdown (Editable per Zone)
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {zones.map((z, idx) => (
                        <div key={idx} className="rounded-xl border border-ink/12 bg-paper/80 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo">
                              {z.zone}
                            </span>
                            <span className="rounded-full bg-terracotta/12 px-2 py-0.5 text-[10px] font-bold text-terracotta-deep">
                              {z.technique}
                            </span>
                          </div>
                          <input
                            value={z.detail}
                            onChange={(e) => updateZone(idx, { detail: e.target.value })}
                            className="mt-1.5 w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-[11.5px] text-ink-soft outline-none hover:border-ink/15 focus:border-terracotta focus:bg-cream"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials + Budget + Timeline */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-faint mr-1">Materials:</span>
                  {draft.materials.map((m) => (
                    <span key={m} className="rounded-full bg-sand px-2.5 py-1 text-[10.5px] font-medium text-ink-soft">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-sand/60 p-3">
                  <label className="block">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                      Estimated Price (₹)
                    </span>
                    <input
                      value={draft.budget}
                      onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                      className="field mt-1 !py-1.5 !text-[13.5px] font-semibold"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                      Estimated Delivery (Days)
                    </span>
                    <input
                      value={draft.timelineDays}
                      onChange={(e) => setDraft({ ...draft, timelineDays: Number(e.target.value.replace(/\D/g, "")) || 1 })}
                      className="field mt-1 !py-1.5 !text-[13.5px] font-semibold"
                      inputMode="numeric"
                    />
                  </label>
                </div>

                {/* Action CTAs: Direct send if artist is chosen, plus choose/change artist */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {chosenArtisan ? (
                    <>
                      <Btn
                        size="lg"
                        className="flex-1"
                        loading={sending === chosenArtisan.id}
                        onClick={() => sendToArtisan(chosenArtisan.id)}
                      >
                        <Send className="size-4" /> Send Directly to {chosenArtisan.name} (“I want this design”)
                      </Btn>
                      <Btn size="lg" variant="outline" onClick={() => setSendOpen(true)}>
                        Other Artists
                      </Btn>
                    </>
                  ) : (
                    <Btn size="lg" className="w-full" onClick={() => setSendOpen(true)}>
                      <Send className="size-4" /> Select a Nearby Artist & Send This Design
                    </Btn>
                  )}
                </div>

                <div className="mt-4 border-t border-ink/10 pt-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-indigo">AI Design Brief Summary</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{draft.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send to Artisan Modal */}
      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        wide
        title="Send your AI design to a nearby artist"
        subtitle="Click any artist's name to see their previous work & reviews, or click Send to start chatting on materials & price."
      >
        <div className="space-y-2.5">
          {candidates.map(({ artisan, match }) => (
            <div
              key={artisan.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-ink/12 bg-cream p-3"
            >
              <Avatar
                name={artisan.name}
                src={artisan.avatar}
                size={42}
                color={artisan.category === "paintings" ? "#2B3A8F" : "#C1502E"}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setInspectArtistId(artisan.id)}
                    className="truncate font-display text-[14.5px] font-semibold text-ink underline-offset-4 hover:text-terracotta hover:underline"
                  >
                    {artisan.name}
                  </button>
                  {match === 0 && (
                    <Badge tone="leaf">
                      <BadgeCheck className="size-3" /> Best Craft Match
                    </Badge>
                  )}
                </div>
                <p className="truncate text-[11.5px] text-ink-faint">
                  {artisan.craft} · <MapPin className="inline size-2.5 text-terracotta" /> {artisan.city}
                  {artisan.distanceKm != null ? ` · ${formatDistance(artisan.distanceKm)} away` : ""}
                </p>
                <Stars value={artisan.rating} count={artisan.reviewCount} size={10} />
              </div>
              <div className="flex items-center gap-2">
                <Btn size="sm" variant="outline" onClick={() => setInspectArtistId(artisan.id)}>
                  Past Work
                </Btn>
                <Btn size="sm" onClick={() => sendToArtisan(artisan.id)} loading={sending === artisan.id}>
                  Send Design <ArrowRight className="size-3.5" />
                </Btn>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setSendOpen(false);
            onBrowse();
          }}
          className="mt-4 w-full text-center text-[12px] font-semibold text-terracotta hover:underline"
        >
          or browse all nearby artisans on the map list
        </button>
      </Modal>

      {/* Artist Portfolio Modal when clicking artist name inside Studio */}
      <ArtistModal
        id={inspectArtistId}
        buyer={buyer}
        onClose={() => setInspectArtistId(null)}
        onStudio={(artisanId) => {
          setChosenId(artisanId);
          setInspectArtistId(null);
        }}
      />

      <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-ink-faint">
        <span className="flex items-center gap-1">
          <IndianRupee className="size-3" /> AI only suggests — the maker confirms the final price in chat.
        </span>
        <span className="flex items-center gap-1">
          <Clock3 className="size-3" /> {draft ? `${draft.timelineDays} days typical craft lead time` : "custom lead time"}
        </span>
      </p>
    </div>
  );
}
