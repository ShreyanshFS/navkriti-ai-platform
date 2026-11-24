"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  Hammer,
  IndianRupee,
  Inbox,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Send,
  Sparkles,
  Star,
  Truck,
  UserRound,
} from "lucide-react";
import { clearSession, useSession } from "@/lib/session";
import type { ArtisanT, ConversationT, MessageT, OrderRow, ReviewT, SessionUser } from "@/lib/types";
import { Avatar, Badge, Btn, Empty, Modal, Spinner, Stars } from "@/components/ui";
import { DesignArtwork } from "@/components/design-artwork";
import { AwsArchitectureModal } from "@/components/aws-modal";
import { Cloud, Layers, Plus } from "lucide-react";
import { inr, timeAgo } from "@/lib/format";

type Tab = "requests" | "chats" | "orders" | "profile";

interface ThreadData {
  conversation: { conversation: { id: string; status: string }; design: ConversationT["design"]; artisan: ArtisanT; buyer: ConversationT["buyer"] };
  messages: MessageT[];
  order: ConversationT["order"];
}

export default function SellerPortal() {
  const router = useRouter();
  const { user, ready } = useSession("artisan");
  const [tab, setTab] = useState<Tab>("requests");
  const [profile, setProfile] = useState<ArtisanT | null>(null);
  const [reviews, setReviews] = useState<ReviewT[]>([]);
  const [conversations, setConversations] = useState<ConversationT[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [quoteFor, setQuoteFor] = useState<ConversationT | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [awsOpen, setAwsOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [addingPhoto, setAddingPhoto] = useState(false);

  async function loadAll(seller: SessionUser) {
    const [p, c, o] = await Promise.all([
      fetch(`/api/artisans/${seller.id}`).then((r) => r.json()),
      fetch(`/api/conversations?artisanId=${seller.id}`).then((r) => r.json()),
      fetch(`/api/orders?artisanId=${seller.id}`).then((r) => r.json()),
    ]);
    setProfile(p.artisan);
    setReviews(p.reviews ?? []);
    setConversations(c);
    setOrders(o);
    setLoading(false);
  }

  useEffect(() => {
    if (user) loadAll(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!activeId) {
      setThread(null);
      return;
    }
    fetch(`/api/conversations/${activeId}`).then((r) => r.json()).then(setThread);
  }, [activeId]);

  async function refreshThread() {
    const [c, o] = await Promise.all([
      fetch(`/api/conversations?artisanId=${user!.id}`).then((r) => r.json()),
      fetch(`/api/orders?artisanId=${user!.id}`).then((r) => r.json()),
    ]);
    setConversations(c);
    setOrders(o);
    if (activeId) fetch(`/api/conversations/${activeId}`).then((r) => r.json()).then(setThread);
  }

  async function sendText() {
    if (!activeId || !text.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/conversations/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderRole: "artisan", kind: "text", body: text }),
      });
      setText("");
      await refreshThread();
    } finally {
      setSending(false);
    }
  }

  async function setOrderStatus(order: OrderRow, status: OrderRow["status"]) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status }),
    });
    await refreshThread();
  }

  async function toggleAvailability() {
    if (!profile) return;
    const res = await fetch(`/api/artisans/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptingOrders: !profile.acceptingOrders }),
    });
    const data = await res.json();
    if (data.artisan) setProfile(data.artisan);
  }

  async function addPortfolioPhoto(urlToUse?: string) {
    const clean = (urlToUse ?? newPhotoUrl).trim();
    if (!profile || !clean) return;
    setAddingPhoto(true);
    try {
      const updated = [clean, ...profile.portfolio].slice(0, 12);
      const res = await fetch(`/api/artisans/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: updated }),
      });
      const data = await res.json();
      if (data.artisan) {
        setProfile(data.artisan);
        setNewPhotoUrl("");
      }
    } finally {
      setAddingPhoto(false);
    }
  }

  const requests = useMemo(() => conversations.filter((c) => c.status === "open"), [conversations]);
  const earnings = useMemo(() => orders.reduce((s, o) => s + o.amount, 0), [orders]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Spinner label="Opening your workshop…" />
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 rotate-[-4deg] place-items-center rounded-[9px] bg-indigo font-hindi text-lg text-cream shadow-[2px_3px_0_0_rgba(29,23,18,0.85)]">न</span>
            <div className="hidden leading-none sm:block">
              <p className="font-display text-lg font-semibold text-ink">Navkriti</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-ink-faint">Artisan desk</p>
            </div>
          </div>

          <nav className="no-scrollbar mx-auto flex items-center gap-1 overflow-x-auto rounded-full border border-ink/10 bg-cream p-1">
            {(
              [
                ["requests", "Requests", Inbox, requests.length],
                ["chats", "Chats", MessageSquare, conversations.length],
                ["orders", "Orders", Package, orders.length],
                ["profile", "My profile", UserRound, 0],
              ] as const
            ).map(([key, label, Icon, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-all sm:px-4 ${
                  tab === key ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand"
                }`}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {count > 0 && (
                  <span className={`grid size-4 place-items-center rounded-full text-[9px] font-bold ${tab === key ? "bg-cream text-ink" : "bg-terracotta text-cream"}`}>{count}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAwsOpen(true)}
              className="hidden items-center gap-1 rounded-full border border-indigo/25 bg-indigo/10 px-3 py-1.5 text-[11px] font-bold text-indigo transition-colors hover:bg-indigo hover:text-cream lg:flex"
            >
              <Cloud className="size-3" /> AWS & Team
            </button>
            <Avatar name={user.name} src={user.avatar} size={32} color="#2B3A8F" />
            <span className="hidden text-[12.5px] font-semibold text-ink sm:block">{user.name.split(" ")[0]}</span>
            <button
              onClick={() => { clearSession(); router.replace("/"); }}
              className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink-soft hover:border-terracotta hover:text-terracotta"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
        {loading || !profile ? (
          <Spinner label="Loading your workshop…" />
        ) : (
          <>
            {/* greeting + stats */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-terracotta">
                  <Hammer className="size-3.5" /> Namaste, {user.name.split(" ")[0]}
                </p>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Your workshop, at a glance.</h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-soft">
                  {profile.craft} · <MapPin className="inline size-3" /> {profile.city}, {profile.state}
                  {profile.verified && <Badge tone="leaf"><BadgeCheck className="size-3" /> Verified</Badge>}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                className={`flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-[12px] font-semibold transition-all ${
                  profile.acceptingOrders ? "border-leaf bg-leaf/12 text-leaf" : "border-ink/20 text-ink-faint"
                }`}
              >
                <span className={`size-2 rounded-full ${profile.acceptingOrders ? "bg-leaf" : "bg-ink/30"}`} />
                {profile.acceptingOrders ? "Accepting orders" : "Not accepting orders"}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Inbox, label: "Open requests", value: String(requests.length) },
                { icon: MessageSquare, label: "Live chats", value: String(conversations.length) },
                { icon: IndianRupee, label: "Order value", value: inr(earnings) },
                { icon: Star, label: "Rating", value: profile.rating > 0 ? `${profile.rating.toFixed(1)} · ${profile.reviewCount}` : "New" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border-[1.5px] border-ink/12 bg-cream p-4">
                  <s.icon className="size-4 text-terracotta" />
                  <p className="mt-2.5 font-display text-xl font-semibold text-ink">{s.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-faint">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── REQUESTS ── */}
            {tab === "requests" && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold text-ink">Custom design requests</h2>
                <p className="mt-1 text-[13px] text-ink-soft">Customers designed these with AI and sent them to you. Review, then quote.</p>
                {requests.length === 0 ? (
                  <div className="mt-4">
                    <Empty icon={<Inbox className="size-5" />} title="No open requests" body="New custom designs will appear here the moment a customer sends one to your studio." />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {requests.map((c) => (
                      <article key={c.id} className="overflow-hidden rounded-2xl border-[1.5px] border-ink/12 bg-cream">
                        <div className="relative aspect-[16/9]">
                          <DesignArtwork spec={c.design.spec} className="h-full w-full" />
                          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-marigold backdrop-blur">
                            <Sparkles className="mr-1 inline size-2.5" /> Customer concept
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="font-display text-[16px] font-semibold leading-tight text-ink">{c.design.title}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-faint">
                            <span>{c.buyer.name}</span>·<span>{c.design.itemType}</span>·
                            <span className="flex items-center gap-0.5"><MapPin className="size-2.5" />{c.buyer.city}</span>
                          </p>
                          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">“{c.design.prompt}”</p>
                          {c.design.spec.zones && c.design.spec.zones.length > 0 && (
                            <div className="mt-2.5 space-y-1 rounded-xl border border-ink/10 bg-paper/75 p-2.5">
                              <p className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-terracotta">
                                <Layers className="size-3" /> Custom Zone Placement
                              </p>
                              {c.design.spec.zones.map((z, idx) => (
                                <p key={idx} className="text-[11px] leading-snug text-ink-soft">
                                  <strong className="font-semibold text-ink">{z.zone}:</strong> {z.technique}
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {c.design.materials.slice(0, 3).map((m) => (
                              <span key={m} className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-ink-soft">{m}</span>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-dashed border-ink/15 pt-2.5">
                            <p className="font-display text-lg font-semibold text-ink">{inr(c.design.budget)}</p>
                            <p className="flex items-center gap-1 text-[11px] text-ink-faint"><CalendarDays className="size-3" /> {c.design.timelineDays} days</p>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Btn size="sm" className="flex-1" onClick={() => setQuoteFor(c)}>
                              <Send className="size-3.5" /> Send quote
                            </Btn>
                            <Btn size="sm" variant="outline" onClick={() => { setActiveId(c.id); setTab("chats"); }}>
                              Chat
                            </Btn>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CHATS ── */}
            {tab === "chats" && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold text-ink">Customer chats</h2>
                <p className="mt-1 text-[13px] text-ink-soft">Discuss material, motif and timing — then send a quotation the customer can lock.</p>
                {conversations.length === 0 ? (
                  <div className="mt-4">
                    <Empty icon={<MessageSquare className="size-5" />} title="No chats yet" body="When a customer sends a design or message, the thread appears here." />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,300px)_1fr]">
                    <div className={`space-y-2 ${activeId ? "hidden lg:block" : ""}`}>
                      {conversations.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveId(c.id)}
                          className={`w-full rounded-xl border-[1.5px] p-3 text-left transition-all ${
                            activeId === c.id ? "border-indigo bg-cream" : "border-ink/12 bg-cream/60 hover:border-ink/30"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar name={c.buyer.name} src={c.buyer.avatar} size={34} color="#2B3A8F" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-ink">{c.buyer.name}</p>
                              <p className="truncate text-[10.5px] text-ink-faint">{c.buyer.city} · {c.design.itemType}</p>
                            </div>
                            {c.status === "locked" && <Badge tone="leaf">Locked</Badge>}
                          </div>
                          <p className="mt-1.5 line-clamp-1 text-[11.5px] text-ink-soft">{c.last?.body ?? "New request"}</p>
                          <p className="mt-1 flex items-center justify-between text-[9.5px] text-ink-faint">
                            <span className="truncate">{c.design.title}</span>
                            <span className="ml-2 shrink-0">{timeAgo(c.lastAt)}</span>
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="min-h-[480px] rounded-2xl border-[1.5px] border-ink/12 bg-cream">
                      {!active || !thread ? (
                        <div className="grid h-full place-items-center p-8 text-center text-[13px] text-ink-faint">Choose a customer to open the thread.</div>
                      ) : (
                        <div className="flex h-full flex-col">
                          <div className="flex items-center gap-3 border-b border-ink/10 p-4">
                            <button onClick={() => setActiveId(null)} className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink-soft lg:hidden" aria-label="Back">
                              <ArrowLeft className="size-4" />
                            </button>
                            <Avatar name={active.buyer.name} src={active.buyer.avatar} size={38} color="#2B3A8F" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] font-semibold text-ink">{active.buyer.name}</p>
                              <p className="flex items-center gap-1 text-[11px] text-ink-faint"><MapPin className="size-2.5" /> {active.buyer.city} · {active.buyer.phone}</p>
                            </div>
                            <Btn size="sm" onClick={() => setQuoteFor(active)} disabled={active.status === "locked"}>
                              <Send className="size-3.5" /> Quote
                            </Btn>
                          </div>

                          <div className="flex items-center gap-3 border-b border-ink/10 bg-paper/60 p-3">
                            <div className="w-12 overflow-hidden rounded-lg border border-ink/10">
                              <DesignArtwork spec={active.design.spec} className="h-14 w-full" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-display text-[14px] font-semibold text-ink">{active.design.title}</p>
                              <p className="text-[10.5px] text-ink-faint">{active.design.materials.join(" · ")} · budget {inr(active.design.budget)} · {active.design.timelineDays} days</p>
                            </div>
                            {active.order && <Badge tone="leaf">Order {active.order.status.replace("_", " ")}</Badge>}
                          </div>

                          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 340 }}>
                            {thread.messages.map((m) => {
                              const mine = m.senderRole === "artisan";
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
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo">Your quotation</p>
                                    <div className="mt-1 flex items-center justify-between">
                                      <p className="font-display text-xl font-semibold text-ink">{inr(m.amount ?? 0)}</p>
                                      <p className="text-[11px] text-ink-soft">{m.etaDays} days</p>
                                    </div>
                                    <p className="mt-1 text-[12px] text-ink-soft">{m.body}</p>
                                  </div>
                                );
                              }
                              return (
                                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${mine ? "rounded-br-md bg-indigo text-cream" : "rounded-bl-md bg-sand text-ink"}`}>
                                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{m.body}</p>
                                    <p className={`mt-1 text-right text-[9px] ${mine ? "text-cream/60" : "text-ink-faint"}`}>{timeAgo(m.createdAt)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {active.status === "locked" ? (
                            <div className="border-t border-ink/10 p-3">
                              <p className="flex items-center justify-center gap-1.5 rounded-xl bg-leaf/10 px-3 py-2.5 text-[11.5px] font-semibold text-leaf">
                                <CheckCircle2 className="size-3.5" /> Deal locked — delivery details are in Orders
                              </p>
                            </div>
                          ) : (
                            <div className="border-t border-ink/10 p-3">
                              <div className="flex items-end gap-2">
                                <textarea
                                  value={text}
                                  onChange={(e) => setText(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                                  rows={2}
                                  placeholder="Reply to the customer…"
                                  className="field resize-none !py-2 text-[12.5px]"
                                />
                                <Btn onClick={sendText} loading={sending} disabled={!text.trim()} className="!px-4 !py-2.5">
                                  <Send className="size-4" />
                                </Btn>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold text-ink">Orders & deliveries</h2>
                <p className="mt-1 text-[13px] text-ink-soft">Locked deals with the delivery address, customer contact and agreed amount.</p>
                {orders.length === 0 ? (
                  <div className="mt-4">
                    <Empty icon={<Package className="size-5" />} title="No locked orders yet" body="Once a customer accepts your quotation, the order and delivery details land here." />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {orders.map((o) => (
                      <article key={o.id} className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-ink/12 bg-cream p-4 sm:flex-row">
                        <div className="w-full overflow-hidden rounded-xl border border-ink/10 sm:w-28">
                          <DesignArtwork spec={o.design.spec} className="h-32 w-full sm:h-28" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display text-lg font-semibold leading-tight text-ink">{o.design.title}</h3>
                              <p className="mt-0.5 text-[11.5px] text-ink-faint">for {o.buyer.name} · locked {timeAgo(o.createdAt)} · {o.etaDays} days</p>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-xl font-semibold text-ink">{inr(o.amount)}</p>
                              <Badge tone={o.status === "delivered" ? "leaf" : "marigold"}>{o.status.replace("_", " ")}</Badge>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl bg-sand/60 p-3">
                              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Deliver to</p>
                              <p className="mt-1 text-[12px] font-semibold text-ink">{o.city} — {o.pincode}</p>
                              <p className="text-[12px] leading-relaxed text-ink-soft">{o.address}</p>
                              {o.note && <p className="mt-1 text-[11px] italic text-ink-faint">“{o.note}”</p>}
                            </div>
                            <div className="rounded-xl bg-sand/60 p-3">
                              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-faint">Customer</p>
                              <p className="mt-1 text-[12px] font-semibold text-ink">{o.buyer.name}</p>
                              <p className="flex items-center gap-1 text-[12px] text-ink-soft"><Phone className="size-3" /> {o.buyer.phone}</p>
                              <p className="mt-1 text-[11px] text-ink-faint">{o.design.materials.join(" · ")}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {o.status === "locked" && (
                              <Btn size="sm" onClick={() => setOrderStatus(o, "in_progress")}>
                                <Hammer className="size-3.5" /> Start work
                              </Btn>
                            )}
                            {o.status === "in_progress" && (
                              <Btn size="sm" onClick={() => setOrderStatus(o, "shipped")}>
                                <Truck className="size-3.5" /> Mark shipped
                              </Btn>
                            )}
                            {o.status === "shipped" && (
                              <Btn size="sm" variant="leaf" onClick={() => setOrderStatus(o, "delivered")}>
                                <CheckCircle2 className="size-3.5" /> Mark delivered
                              </Btn>
                            )}
                            {o.status === "delivered" && (
                              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-leaf"><CheckCircle2 className="size-4" /> Delivered — ask the customer for a review</p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE ── */}
            {tab === "profile" && (
              <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div className="overflow-hidden rounded-2xl border-[1.5px] border-ink/12 bg-cream">
                  <div className="relative h-36">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.cover} alt={profile.craft} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                    <div className="absolute -bottom-6 left-4 flex items-end gap-3">
                      <Avatar name={profile.name} src={profile.avatar} size={62} color="#2B3A8F" className="border-[3px] border-cream" />
                      <div className="pb-7">
                        <p className="font-display text-xl font-semibold text-cream">{profile.name}</p>
                        <p className="text-[11.5px] text-cream/75">{profile.craft}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-9">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={profile.rating} count={profile.reviewCount} />
                      <Badge tone={profile.verified ? "leaf" : "neutral"}>{profile.verified ? "Verified artisan" : "Verification pending"}</Badge>
                      <Badge tone="terracotta">from {inr(profile.startingPrice)}</Badge>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{profile.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {profile.techniques.map((t) => (
                        <span key={t} className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-medium text-ink-soft">{t}</span>
                      ))}
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
                      <Briefcase className="size-3.5" /> {profile.years} years of practice · {orders.length} orders · {inr(earnings)} earned
                    </p>
                    <div className="mt-4">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                        Previous Designs & Products Portfolio (Shown to Buyers)
                      </p>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {profile.portfolio.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} src={src} alt={`Work ${i + 1}`} className="aspect-square w-full rounded-lg border border-ink/10 object-cover" />
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <input
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="Paste image URL of your work (S3 object)…"
                          className="field flex-1 !py-1.5 !text-[12px]"
                        />
                        <Btn size="sm" onClick={() => addPortfolioPhoto()} loading={addingPhoto} disabled={!newPhotoUrl.trim()}>
                          <Plus className="size-3.5" /> Add Photo
                        </Btn>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-ink-faint">Quick add craft sample:</span>
                        {[
                          ["Chikankari / Kantha", "/images/concepts/kantha-terracotta.jpg"],
                          ["Ajrakh Indigo", "/images/concepts/ajrakh-indigo.jpg"],
                          ["Banarasi Zari", "/images/concepts/banarasi-saree.jpg"],
                          ["Madhubani Art", "/images/concepts/madhubani.jpg"],
                        ].map(([label, url]) => (
                          <button
                            key={label}
                            onClick={() => addPortfolioPhoto(url)}
                            className="rounded-full border border-ink/15 bg-paper px-2.5 py-0.5 text-[10px] font-semibold text-ink-soft hover:border-terracotta hover:text-terracotta"
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={toggleAvailability} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink/15 py-2.5 text-[12px] font-semibold text-ink-soft hover:border-ink">
                      {profile.acceptingOrders ? "Pause new orders" : "Start accepting orders"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border-[1.5px] border-ink/12 bg-cream p-5">
                  <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                    <Star className="size-3.5 fill-marigold text-marigold" /> Customer reviews ({reviews.length})
                  </p>
                  <div className="mt-3 max-h-[520px] space-y-2.5 overflow-y-auto pr-1">
                    {reviews.length === 0 && (
                      <p className="rounded-xl border border-dashed border-ink/20 p-4 text-[12px] leading-relaxed text-ink-faint">
                        No reviews yet. Complete your first order and the customer can rate your work here.
                      </p>
                    )}
                    {reviews.map((r) => (
                      <div key={r.id} className="rounded-xl border border-ink/10 bg-paper/60 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.buyerName} size={22} color="#2B3A8F" />
                            <p className="text-[12px] font-semibold text-ink">{r.buyerName}</p>
                          </div>
                          <Stars value={r.rating} size={10} />
                        </div>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{r.body}</p>
                        <p className="mt-1 text-[9.5px] text-ink-faint">{timeAgo(r.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* quote modal */}
      <QuoteModal
        conversation={quoteFor}
        artisanName={user.name}
        onClose={() => setQuoteFor(null)}
        onSent={async (conversationId) => {
          setQuoteFor(null);
          setActiveId(conversationId);
          setTab("chats");
          await refreshThread();
        }}
      />

      <footer className="border-t border-ink/10 px-4 py-6 text-center text-[11px] text-ink-faint">
        <span>Navkriti Artisan Desk · Team Handmind (Pranav Gupta · 2501640100639 & Hansika Ojha · 2501640100395) · </span>
        <button onClick={() => setAwsOpen(true)} className="font-semibold text-indigo underline-offset-4 hover:underline">
          View AWS Architecture & Circular Loop
        </button>
      </footer>

      <AwsArchitectureModal open={awsOpen} onClose={() => setAwsOpen(false)} />
    </div>
  );
}

function QuoteModal({
  conversation,
  artisanName,
  onClose,
  onSent,
}: {
  conversation: ConversationT | null;
  artisanName: string;
  onClose: () => void;
  onSent: (conversationId: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [eta, setEta] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversation) return;
    setAmount(String(conversation.design.budget));
    setEta(String(conversation.design.timelineDays));
    setNote(`I can make this in ${conversation.design.materials[0]?.toLowerCase() ?? "the suggested material"} with hand finishing, exactly to your concept. Shipping to ${conversation.buyer.city} included.`);
    setError(null);
  }, [conversation]);

  async function send() {
    if (!conversation) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderRole: "artisan", kind: "quote", amount: Number(amount) || 0, etaDays: Number(eta) || 14, body: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send quote");
      onSent(conversation.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send quote");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(conversation)}
      onClose={onClose}
      title="Send a quotation"
      subtitle={conversation ? `${conversation.buyer.name} · ${conversation.design.title}` : ""}
    >
      {conversation && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-sand/60 p-2.5">
            <div className="w-12 overflow-hidden rounded-lg border border-ink/10">
              <DesignArtwork spec={conversation.design.spec} className="h-14 w-full" />
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-ink">{conversation.design.itemType} · {conversation.design.craft}</p>
              <p className="text-[11px] text-ink-soft">Customer budget {inr(conversation.design.budget)} · wants in {conversation.design.timelineDays} days</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Your price (₹)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className="field font-semibold" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Delivery (days)</span>
              <input value={eta} onChange={(e) => setEta(e.target.value.replace(/\D/g, ""))} className="field font-semibold" inputMode="numeric" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Message to the customer</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="field resize-none text-[12.5px] leading-relaxed" />
          </label>
          {error && <p className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-3.5 py-2.5 text-[12px] font-medium text-terracotta-deep">{error}</p>}
          <Btn size="lg" className="w-full" onClick={send} loading={busy}>
            <Send className="size-4" /> Send quotation as {artisanName.split(" ")[0]}
          </Btn>
          <p className="text-center text-[10.5px] text-ink-faint">The customer sees this instantly and can accept to lock the deal.</p>
        </div>
      )}
    </Modal>
  );
}
