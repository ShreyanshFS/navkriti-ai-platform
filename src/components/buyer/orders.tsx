"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Package, Star, Store } from "lucide-react";
import type { OrderRow, SessionUser } from "@/lib/types";
import { Avatar, Badge, Btn, Empty, Modal, Spinner } from "@/components/ui";
import { DesignArtwork } from "@/components/design-artwork";
import { OrderStatusStrip } from "./inbox";
import { ArtistModal } from "./discover";
import { inr, timeAgo } from "@/lib/format";

export function Orders({ buyer }: { buyer: SessionUser }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFor, setReviewFor] = useState<OrderRow | null>(null);
  const [inspectArtistId, setInspectArtistId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    const rows = await fetch(`/api/orders?buyerId=${buyer.id}`).then((r) => r.json());
    setOrders(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer.id]);

  return (
    <div>
      <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-terracotta">
        <Package className="size-3.5" /> Your orders
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Made for you, in progress.</h1>
      <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-ink-soft">
        Every locked deal with its delivery address, agreed price and artisan. Once it arrives, rate
        the maker — those reviews help the next customer.
      </p>

      {toast && (
        <p className="mt-4 rounded-xl bg-leaf/12 px-4 py-2.5 text-[12.5px] font-semibold text-leaf">{toast}</p>
      )}

      {loading ? (
        <Spinner label="Loading your orders…" />
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <Empty
            icon={<Package className="size-5" />}
            title="No orders yet"
            body="When you lock a deal in a chat, the order appears here with delivery tracking."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="overflow-hidden rounded-2xl border-[1.5px] border-ink/12 bg-cream">
              <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="w-full overflow-hidden rounded-xl border border-ink/10 sm:w-28">
                  <DesignArtwork spec={o.design.spec} className="h-32 w-full sm:h-28" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-semibold leading-tight text-ink">{o.design.title}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-faint">
                        <button
                          onClick={() => setInspectArtistId(o.artisan.id)}
                          className="flex items-center gap-1 font-semibold text-ink underline-offset-4 hover:text-terracotta hover:underline"
                        >
                          <Store className="size-3 text-terracotta" /> {o.artisan.name}
                        </button>
                        <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {o.etaDays} days</span>
                        <span>locked {timeAgo(o.createdAt)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-ink">{inr(o.amount)}</p>
                      <Badge tone={o.status === "delivered" ? "leaf" : "marigold"}>{o.status.replace("_", " ")}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-sand/60 p-3">
                    <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-soft">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-terracotta" />
                      <span>
                        <strong className="font-semibold text-ink">{o.city} {o.pincode}</strong> · {o.address}
                        {o.note ? ` · “${o.note}”` : ""}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3">
                    <OrderStatusStrip status={o.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={o.artisan.name} src={o.artisan.avatar} size={26} color={o.artisan.category === "paintings" ? "#2B3A8F" : "#C1502E"} />
                      <p className="text-[11.5px] text-ink-soft">{o.artisan.craft} · {o.artisan.city}</p>
                    </div>
                    <Btn size="sm" variant="outline" onClick={() => setReviewFor(o)}>
                      <Star className="size-3.5" /> Rate the artisan
                    </Btn>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ReviewModal
        order={reviewFor}
        buyerId={buyer.id}
        onClose={() => setReviewFor(null)}
        onDone={() => {
          setReviewFor(null);
          setToast("Thank you! Your review is live on the artisan's profile.");
          setTimeout(() => setToast(null), 4000);
        }}
      />

      <ArtistModal
        id={inspectArtistId}
        buyer={buyer}
        onClose={() => setInspectArtistId(null)}
      />
    </div>
  );
}

function ReviewModal({
  order,
  buyerId,
  onClose,
  onDone,
}: {
  order: OrderRow | null;
  buyerId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRating(5);
    setBody("");
    setError(null);
  }, [order]);

  async function submit() {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artisanId: order.artisanId, buyerId, rating, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post review");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(order)} onClose={onClose} title={order ? `Rate ${order.artisan.name}` : "Rate"} subtitle={order?.design.title}>
      <div className="space-y-4">
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`size-8 transition-colors ${n <= rating ? "fill-marigold text-marigold" : "fill-ink/10 text-ink/20 hover:text-marigold"}`} />
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="How was the craft, communication and delivery?"
          className="field resize-none"
        />
        {error && <p className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-3.5 py-2.5 text-[12px] font-medium text-terracotta-deep">{error}</p>}
        <Btn className="w-full" onClick={submit} loading={busy}>Post review</Btn>
      </div>
    </Modal>
  );
}
