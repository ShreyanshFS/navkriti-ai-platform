"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Handshake,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  Send,
  Sparkles,
  Truck,
} from "lucide-react";
import type { ArtisanT, BuyerT, ConversationT, DesignT, MessageT, OrderT, SessionUser } from "@/lib/types";
import { Avatar, Badge, Btn, Empty, Modal, Spinner } from "@/components/ui";
import { DesignArtwork } from "@/components/design-artwork";
import { ArtistModal } from "./discover";
import { inr, timeAgo } from "@/lib/format";

interface ThreadPayload {
  conversation: { conversation: { id: string; status: string }; design: DesignT; artisan: ArtisanT; buyer: BuyerT };
  messages: MessageT[];
  order: OrderT | null;
}

export function Inbox({
  buyer,
  initialConversationId,
  onConsumedInitial,
  onLocked,
}: {
  buyer: SessionUser;
  initialConversationId?: string | null;
  onConsumedInitial?: () => void;
  onLocked: () => void;
}) {
  const [threads, setThreads] = useState<ConversationT[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [thread, setThread] = useState<ThreadPayload | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [inspectArtistId, setInspectArtistId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialConversationId) {
      setActiveId(initialConversationId);
      onConsumedInitial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  async function loadThreads() {
    const rows: ConversationT[] = await fetch(`/api/conversations?buyerId=${buyer.id}`).then((r) => r.json());
    setThreads(rows);
    setLoading(false);
    if (!activeId && rows.length > 0) setActiveId(rows[0].id);
  }

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer.id]);

  async function loadThread(id: string) {
    setLoadingThread(true);
    try {
      const data = await fetch(`/api/conversations/${id}`).then((r) => r.json());
      setThread(data);
    } finally {
      setLoadingThread(false);
    }
  }

  useEffect(() => {
    if (activeId) loadThread(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  async function send(text?: string) {
    const body = (text ?? draft).trim();
    if (!body || !activeId) return;
    setSending(true);
    try {
      await fetch(`/api/conversations/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderRole: "buyer", kind: "text", body }),
      });
      setDraft("");
      await Promise.all([loadThread(activeId), loadThreads()]);
    } finally {
      setSending(false);
    }
  }

  const latestQuote = useMemo(() => {
    const q = (thread?.messages ?? []).filter((m) => m.kind === "quote");
    return q.length ? q[q.length - 1] : null;
  }, [thread]);

  const active = threads.find((t) => t.id === activeId) ?? null;
  const detail = thread?.conversation;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-terracotta">
            <MessageSquare className="size-3.5" /> Your conversations
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Chats with makers</h1>
          <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-ink-soft">
            Agree the material, motif and price here. When you are happy, lock the deal — that becomes
            the order with delivery details for the artisan.
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner label="Opening your inbox…" />
      ) : threads.length === 0 ? (
        <div className="mt-6">
          <Empty icon={<MessageSquare className="size-5" />} title="No conversations yet" body="Design something in the AI studio and send it to an artisan — your chat starts there." />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
          {/* list */}
          <div className={`space-y-2 ${activeId ? "hidden lg:block" : ""}`}>
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`w-full rounded-xl border-[1.5px] p-3 text-left transition-all ${
                  activeId === t.id ? "border-terracotta bg-cream shadow-sm" : "border-ink/12 bg-cream/60 hover:border-ink/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={t.artisan.name} src={t.artisan.avatar} size={36} color={t.artisan.category === "paintings" ? "#2B3A8F" : "#C1502E"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{t.artisan.name}</p>
                    <p className="truncate text-[10.5px] text-ink-faint">{t.artisan.craft}</p>
                  </div>
                  {t.status === "locked" ? <Lock className="size-3.5 text-leaf" /> : <span className="size-2 rounded-full bg-terracotta" />}
                </div>
                <p className="mt-2 line-clamp-1 text-[11.5px] text-ink-soft">{t.last ? `${t.last.senderRole === "buyer" ? "You: " : t.last.kind === "quote" ? "Quote · " : ""}${t.last.body}` : "New conversation"}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="truncate text-[10.5px] font-medium text-ink">{t.design.title}</p>
                  <span className="ml-2 shrink-0 text-[9.5px] text-ink-faint">{timeAgo(t.lastAt)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* thread */}
          <div className="min-h-[520px] rounded-2xl border-[1.5px] border-ink/12 bg-cream">
            {!active ? (
              <div className="grid h-full place-items-center p-8 text-center text-[13px] text-ink-faint">Pick a conversation to begin.</div>
            ) : (
              <div className="flex h-full flex-col">
                {/* header */}
                <div className="flex items-center gap-3 border-b border-ink/10 p-4">
                  <button onClick={() => setActiveId(null)} className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink-soft lg:hidden" aria-label="Back">
                    <ArrowLeft className="size-4" />
                  </button>
                  <Avatar name={active.artisan.name} src={active.artisan.avatar} size={38} color={active.artisan.category === "paintings" ? "#2B3A8F" : "#C1502E"} />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => setInspectArtistId(active.artisan.id)}
                      className="truncate text-left text-[13.5px] font-semibold text-ink underline-offset-4 hover:text-terracotta hover:underline"
                      title="Click to see previous designs & reviews"
                    >
                      {active.artisan.name}
                    </button>
                    <p className="truncate text-[11px] text-ink-faint">
                      {active.artisan.craft} · <MapPin className="inline size-2.5" /> {active.artisan.city}
                    </p>
                  </div>
                  {active.status === "locked" ? (
                    <Badge tone="leaf"><Lock className="size-3" /> Deal locked</Badge>
                  ) : (
                    <Badge tone="marigold">Negotiating</Badge>
                  )}
                </div>

                {/* design summary */}
                <div className="flex items-center gap-3 border-b border-ink/10 bg-paper/60 p-3">
                  <div className="w-14 overflow-hidden rounded-lg border border-ink/10">
                    <DesignArtwork spec={active.design.spec} className="h-16 w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[14px] font-semibold text-ink">{active.design.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px] text-ink-faint">
                      <span className="flex items-center gap-0.5"><IndianRupee className="size-2.5" /> {active.design.budget.toLocaleString("en-IN")}</span>
                      <span className="flex items-center gap-0.5"><CalendarDays className="size-2.5" /> {active.design.timelineDays} days</span>
                      <span>{active.design.craft}</span>
                    </p>
                    {active.design.spec.zones && active.design.spec.zones.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {active.design.spec.zones.slice(0, 3).map((z, idx) => (
                          <span key={idx} className="rounded bg-sand px-1.5 py-0.5 text-[9.5px] font-semibold text-ink-soft">
                            {z.zone}: {z.technique}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {active.order && <Badge tone="leaf">Order placed</Badge>}
                </div>

                {/* messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 380 }}>
                  {loadingThread && <div className="py-6"><Spinner /></div>}
                  {(thread?.messages ?? []).map((m) => {
                    const mine = m.senderRole === "buyer";
                    if (m.kind === "system") {
                      return (
                        <p key={m.id} className="mx-auto flex max-w-sm items-center justify-center gap-1.5 rounded-full bg-leaf/10 px-3 py-1.5 text-center text-[10.5px] font-semibold text-leaf">
                          <Check className="size-3" /> {m.body}
                        </p>
                      );
                    }
                    if (m.kind === "quote") {
                      return (
                        <div key={m.id} className="rounded-xl border-[1.5px] border-indigo/30 bg-indigo/[0.06] p-3">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo">
                            <Sparkles className="size-3" /> Quotation from the artisan
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2">
                            <p className="font-display text-2xl font-semibold text-ink">{inr(m.amount ?? 0)}</p>
                            <p className="text-[11.5px] font-medium text-ink-soft">Delivery in {m.etaDays ?? active.design.timelineDays} days</p>
                          </div>
                          {m.body && <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{m.body}</p>}
                          {active.status !== "locked" && (
                            <Btn size="sm" className="mt-2.5 w-full" onClick={() => setLockOpen(true)}>
                              <Handshake className="size-3.5" /> Accept & lock this deal
                            </Btn>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${mine ? "rounded-br-md bg-terracotta text-cream" : "rounded-bl-md bg-sand text-ink"}`}>
                          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{m.body}</p>
                          <p className={`mt-1 text-right text-[9px] ${mine ? "text-cream/60" : "text-ink-faint"}`}>{timeAgo(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* composer */}
                {active.status === "locked" ? (
                  <div className="border-t border-ink/10 p-4">
                    <p className="flex items-center justify-center gap-1.5 rounded-xl bg-leaf/10 px-3 py-2.5 text-[12px] font-semibold text-leaf">
                      <Lock className="size-3.5" /> Deal locked — the artisan is making your piece. Track it in Orders.
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-ink/10 p-3">
                    <div className="flex flex-wrap gap-1.5 pb-2">
                      {["Could you share a photo of similar work?", "Can we do it slightly cheaper?", "Is the timeline possible?"].map((q) => (
                        <button key={q} onClick={() => send(q)} className="rounded-full border border-ink/15 px-2.5 py-1 text-[10px] text-ink-soft hover:border-terracotta hover:text-terracotta">
                          {q}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-end gap-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        rows={2}
                        placeholder="Message the artisan about material, colour, price…"
                        className="field resize-none !py-2 text-[12.5px]"
                      />
                      <Btn onClick={() => send()} loading={sending} disabled={!draft.trim()} className="!px-4 !py-2.5">
                        <Send className="size-4" />
                      </Btn>
                    </div>
                    {latestQuote && (
                      <button onClick={() => setLockOpen(true)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink py-2 text-[11.5px] font-semibold text-cream hover:bg-ink/85">
                        <Handshake className="size-3.5" /> Lock the deal at {inr(latestQuote.amount ?? 0)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* lock deal modal */}
      {detail && (
        <LockDealModal
          open={lockOpen}
          onClose={() => setLockOpen(false)}
          buyer={buyer}
          conversationId={activeId ?? ""}
          design={detail.design}
          suggestedAmount={latestQuote?.amount ?? detail.design.budget}
          suggestedDays={latestQuote?.etaDays ?? detail.design.timelineDays}
          onLocked={async () => {
            setLockOpen(false);
            if (activeId) await loadThread(activeId);
            await loadThreads();
            onLocked();
          }}
        />
      )}

      <ArtistModal
        id={inspectArtistId}
        buyer={buyer}
        onClose={() => setInspectArtistId(null)}
      />
    </div>
  );
}

export function LockDealModal({
  open,
  onClose,
  buyer,
  conversationId,
  design,
  suggestedAmount,
  suggestedDays,
  onLocked,
}: {
  open: boolean;
  onClose: () => void;
  buyer: SessionUser;
  conversationId: string;
  design: DesignT;
  suggestedAmount: number;
  suggestedDays: number;
  onLocked: () => Promise<void> | void;
}) {
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [days, setDays] = useState(String(suggestedDays));
  const [address, setAddress] = useState("B-14, Malviya Nagar");
  const [city, setCity] = useState(buyer.city);
  const [pincode, setPincode] = useState("302017");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(String(suggestedAmount));
    setDays(String(suggestedDays));
  }, [suggestedAmount, suggestedDays, open]);

  async function lock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, amount: Number(amount) || 0, address, city, pincode, etaDays: Number(days) || 14, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not lock the deal");
      await onLocked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not lock the deal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Lock the deal" subtitle={`${design.title} · agree the amount and share delivery details`}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-sand/60 p-2.5">
          <div className="w-12 overflow-hidden rounded-lg border border-ink/10">
            <DesignArtwork spec={design.spec} className="h-14 w-full" />
          </div>
          <p className="text-[12px] leading-snug text-ink-soft">{design.materials.join(" · ")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Agreed amount (₹)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="field font-semibold" inputMode="numeric" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Delivery in (days)</span>
            <input value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} className="field font-semibold" inputMode="numeric" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Delivery address</span>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="field resize-none" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Pincode</span>
            <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="field" inputMode="numeric" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Note for the artisan (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. gift wrap, call before delivery" className="field" />
        </label>
        {error && <p className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-3.5 py-2.5 text-[12px] font-medium text-terracotta-deep">{error}</p>}
        <Btn size="lg" className="w-full" onClick={lock} loading={busy}>
          <Handshake className="size-4" /> Confirm & lock {inr(Number(amount) || 0)}
        </Btn>
        <p className="text-center text-[10.5px] text-ink-faint">Payment is released to the artisan only after you approve the finished piece.</p>
      </div>
    </Modal>
  );
}

export function OrderStatusStrip({ status }: { status: OrderT["status"] }) {
  const steps: { key: OrderT["status"]; label: string; icon: typeof Lock }[] = [
    { key: "locked", label: "Locked", icon: Lock },
    { key: "in_progress", label: "In progress", icon: Sparkles },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: Package },
  ];
  const index = steps.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-1">
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-bold uppercase tracking-wide ${i <= index ? "bg-leaf/15 text-leaf" : "bg-ink/5 text-ink-faint"}`}>
            <s.icon className="size-2.5" /> {s.label}
          </span>
          {i < steps.length - 1 && <span className={`h-px flex-1 ${i < index ? "bg-leaf/50" : "bg-ink/10"}`} />}
        </div>
      ))}
    </div>
  );
}

export function LoadingRow() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ink-faint">
      <Loader2 className="size-3.5 animate-spin" /> Loading…
    </div>
  );
}
