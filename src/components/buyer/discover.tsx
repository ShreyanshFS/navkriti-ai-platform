"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Images,
  Languages,
  Loader2,
  LocateFixed,
  MapPin,
  Scissors,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { ArtisanT, ReviewT, SessionUser } from "@/lib/types";
import { formatDistance } from "@/lib/studio";
import { Avatar, Badge, Btn, Empty, Modal, Spinner, Stars } from "@/components/ui";
import SafeImg from "@/components/safe-img";

export function Discover({
  buyer,
  onStudio,
}: {
  buyer: SessionUser;
  onStudio: (artisanId: string) => void;
}) {
  const [artisans, setArtisans] = useState<ArtisanT[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    buyer.lat != null && buyer.lng != null ? { lat: buyer.lat, lng: buyer.lng } : null,
  );
  const [locating, setLocating] = useState(false);
  const [locLabel, setLocLabel] = useState(buyer.city);
  const [category, setCategory] = useState<"all" | "tailors" | "textiles" | "paintings">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"near" | "rating" | "price">("near");
  const [openId, setOpenId] = useState<string | null>(null);

  function fetchList(currentCoords: { lat: number; lng: number } | null) {
    const params = new URLSearchParams();
    if (currentCoords) {
      params.set("lat", String(currentCoords.lat));
      params.set("lng", String(currentCoords.lng));
    }
    setLoading(true);
    fetch(`/api/artisans?${params.toString()}`)
      .then((r) => r.json())
      .then(setArtisans)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchList(coords);
  }, [coords]);

  function useLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLabel("your GPS location");
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  const list = useMemo(() => {
    let rows = artisans.filter((a) => {
      if (category === "all") return true;
      if (category === "tailors") {
        return /tailor|kurti|chikan|boutique|stitch/i.test([a.craft, ...a.techniques].join(" "));
      }
      return a.category === category;
    });
    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter((a) => [a.name, a.craft, a.city, a.state, ...a.techniques].join(" ").toLowerCase().includes(needle));
    }
    if (sort === "rating") rows = [...rows].sort((x, y) => y.rating - x.rating);
    if (sort === "price") rows = [...rows].sort((x, y) => x.startingPrice - y.startingPrice);
    if (sort === "near") rows = [...rows].sort((x, y) => (x.distanceKm ?? 99999) - (y.distanceKm ?? 99999));
    return rows;
  }, [artisans, category, q, sort]);

  const nearest = list.filter((a) => a.distanceKm != null).slice(0, 4).length;

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-terracotta">
            <MapPin className="size-3.5" /> Nearby Tailors & Craft Artists around {locLabel}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Select an artist near you & create with AI.
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
            {nearest > 0
              ? `Showing ${list.length} verified tailors, textile makers & folk artists sorted by distance from ${locLabel}. Click any artist's name to view their previous designs & reviews, or select them to generate your custom piece.`
              : "Click any artist's name to see their previous designs, photos of their products, ratings & reviews, then generate your custom design with AI."}
          </p>
        </div>
        <Btn variant="outline" onClick={useLocation} loading={locating}>
          <LocateFixed className="size-4" /> {locating ? "Detecting GPS…" : "Use my location"}
        </Btn>
      </div>

      {/* controls */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tailor, chikankari, block print, city or artist name…"
            className="field pl-10"
          />
        </div>
        <div className="flex flex-wrap rounded-xl border-[1.5px] border-ink/12 bg-cream p-1">
          {(
            [
              ["all", "All Artists"],
              ["tailors", "Tailors & Kurtis"],
              ["textiles", "Textiles & Weaves"],
              ["paintings", "Paintings & Art"],
            ] as const
          ).map(([c, label]) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                category === c ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field w-auto">
          <option value="near">Nearest to me</option>
          <option value="rating">Highest rated</option>
          <option value="price">Lowest starting price</option>
        </select>
      </div>

      {loading ? (
        <Spinner label="Finding nearby tailors & craft artisans…" />
      ) : list.length === 0 ? (
        <div className="mt-6">
          <Empty icon={<Search className="size-5" />} title="No artisans match that filter" body="Try clearing the search box or switching categories." />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <article
              key={a.id}
              className="group flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-ink/12 bg-cream transition-all hover:-translate-y-1 hover:border-terracotta/60 hover:shadow-[0_18px_36px_-22px_rgba(28,25,23,0.45)]"
            >
              <div
                onClick={() => setOpenId(a.id)}
                className="relative aspect-[16/9] cursor-pointer overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <SafeImg
                  src={a.cover}
                  alt={`${a.craft} by ${a.name}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {a.distanceKm != null && <Badge tone="marigold">{formatDistance(a.distanceKm)} away</Badge>}
                  {a.verified && (
                    <Badge tone="leaf">
                      <BadgeCheck className="size-3" /> Verified
                    </Badge>
                  )}
                </div>
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-semibold text-cream backdrop-blur">
                  <Images className="size-3 text-marigold" /> {a.portfolio.length} past works
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-cream/95 px-2.5 py-1 text-[10.5px] font-bold text-ink backdrop-blur">
                  from ₹{a.startingPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={a.name} src={a.avatar} size={42} color={a.category === "paintings" ? "#2B3A8F" : "#C1502E"} />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => setOpenId(a.id)}
                      className="truncate text-left font-display text-[17.5px] font-semibold text-ink underline-offset-4 hover:text-terracotta hover:underline"
                    >
                      {a.name}
                    </button>
                    <p className="truncate text-[12px] font-semibold text-terracotta">{a.craft}</p>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{a.tagline}</p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {a.techniques.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-ink-soft">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-dashed border-ink/12 pt-2.5 text-[11.5px]">
                  <span className="flex items-center gap-1 text-ink-faint">
                    <MapPin className="size-3 text-terracotta" /> {a.city}, {a.state}
                  </span>
                  <Stars value={a.rating} count={a.reviewCount} />
                </div>

                {/* Past work mini strip */}
                <div className="mt-3 flex items-center gap-1.5">
                  {a.portfolio.slice(0, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setOpenId(a.id)}
                      className="relative h-11 flex-1 overflow-hidden rounded-lg border border-ink/10"
                      title="Click to view previous designs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <SafeImg src={img} alt="" className="h-full w-full object-cover transition-transform hover:scale-110" />
                    </button>
                  ))}
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setOpenId(a.id)}
                    className="flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-ink/20 py-2 text-[11.5px] font-semibold text-ink transition-colors hover:border-ink hover:bg-sand"
                  >
                    <Images className="size-3.5" /> Past Designs
                  </button>
                  <button
                    onClick={() => onStudio(a.id)}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-terracotta py-2 text-[11.5px] font-semibold text-cream shadow-[2px_2px_0_0_rgba(28,25,23,0.85)] transition-all hover:bg-terracotta-deep"
                  >
                    <Sparkles className="size-3.5" /> Select & Design
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ArtistModal
        id={openId}
        buyer={buyer}
        onClose={() => setOpenId(null)}
        onStudio={onStudio}
        onReviewAdded={() => fetchList(coords)}
      />
    </div>
  );
}

export function ArtistModal({
  id,
  buyer,
  onClose,
  onStudio,
  onReviewAdded,
}: {
  id: string | null;
  buyer: SessionUser;
  onClose: () => void;
  onStudio?: (artisanId: string) => void;
  onReviewAdded?: () => void;
}) {
  const [artisan, setArtisan] = useState<ArtisanT | null>(null);
  const [reviews, setReviews] = useState<ReviewT[]>([]);
  const [works, setWorks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // inline review composer
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  function loadProfile(targetId: string) {
    setLoading(true);
    fetch(`/api/artisans/${targetId}`)
      .then((r) => r.json())
      .then((d) => {
        setArtisan(d.artisan);
        setReviews(d.reviews ?? []);
        setWorks(d.works ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!id) return;
    setArtisan(null);
    setShowReviewForm(false);
    setReviewText("");
    setReviewError(null);
    loadProfile(id);
  }, [id]);

  async function submitReview() {
    if (!artisan) return;
    if (reviewText.trim().length < 4) {
      setReviewError("Please write a short note about the artist's work.");
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId: artisan.id,
          buyerId: buyer.id,
          rating,
          body: reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post review");
      setReviewText("");
      setShowReviewForm(false);
      loadProfile(artisan.id);
      onReviewAdded?.();
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Could not post review");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      wide
      title={artisan ? artisan.name : "Artisan Portfolio"}
      subtitle={artisan ? `${artisan.craft} · ${artisan.city}, ${artisan.state}` : "Loading portfolio & reviews…"}
    >
      {loading || !artisan ? (
        <div className="py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top identity row */}
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={artisan.name} src={artisan.avatar} size={64} color={artisan.category === "paintings" ? "#2B3A8F" : "#C1502E"} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={artisan.rating} count={artisan.reviewCount} size={15} />
                {artisan.verified && (
                  <Badge tone="leaf">
                    <BadgeCheck className="size-3" /> Verified Artisan
                  </Badge>
                )}
                <Badge tone={artisan.acceptingOrders ? "marigold" : "neutral"}>
                  {artisan.acceptingOrders ? "Accepting Custom Orders" : "Currently Booked"}
                </Badge>
              </div>
              <p className="mt-1.5 text-[12.5px] text-ink-soft">
                {artisan.years} years experience · starts at ₹{artisan.startingPrice.toLocaleString("en-IN")} · {works + 12} custom pieces delivered
              </p>
            </div>
            {onStudio && (
              <Btn
                onClick={() => {
                  onStudio(artisan.id);
                  onClose();
                }}
              >
                <Sparkles className="size-4" /> Design with AI for {artisan.name.split(" ")[0]}
              </Btn>
            )}
          </div>

          <p className="text-[13.5px] leading-relaxed text-ink-soft">{artisan.bio}</p>
          <p className="rounded-xl bg-sand/70 px-3.5 py-2.5 text-[12.5px] italic text-ink-soft">“{artisan.tagline}”</p>

          {/* Previous Designs & Products Gallery */}
          <div>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-terracotta">
                <Images className="size-3.5" /> Previous Designs & Products by {artisan.name}
              </p>
              <span className="text-[11px] text-ink-faint">Click any photo to zoom</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {artisan.portfolio.map((src, i) => (
                <div
                  key={i}
                  onClick={() => setLightbox(src)}
                  className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border-[1.5px] border-ink/12 bg-sand"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <SafeImg
                    src={src}
                    alt={`${artisan.craft} sample ${i + 1} by ${artisan.name}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-2">
                    <p className="truncate text-[10px] font-semibold text-cream">
                      {artisan.techniques[i % artisan.techniques.length] ?? artisan.craft} · Piece #{i + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">Craft Specialties & Custom Techniques</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {artisan.techniques.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1 text-[11px] font-semibold text-ink-soft">
                  <Scissors className="size-3 text-terracotta" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-ink-faint">
            <Languages className="size-3.5" /> Speaks {artisan.languages.join(", ")} · Workshop in {artisan.city} · Ships to {buyer.city}
          </div>

          {/* Reviews & Rating Section */}
          <div className="rounded-2xl border border-ink/12 bg-paper/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                <Star className="size-3.5 fill-marigold text-marigold" /> Customer Ratings & Reviews ({reviews.length})
              </p>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-[12px] font-semibold text-terracotta hover:underline"
              >
                {showReviewForm ? "Cancel" : "+ Write a review"}
              </button>
            </div>

            {showReviewForm && (
              <div className="mt-3 space-y-2.5 rounded-xl border border-ink/15 bg-cream p-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-semibold text-ink-soft">Your rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setRating(n)}>
                        <Star className={`size-5 ${n <= rating ? "fill-marigold text-marigold" : "fill-ink/10 text-ink/20"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={2}
                  placeholder={`Share your experience with ${artisan.name}'s craft & fitting…`}
                  className="field resize-none !py-2 text-[12.5px]"
                />
                {reviewError && <p className="text-[11.5px] font-medium text-terracotta-deep">{reviewError}</p>}
                <Btn size="sm" onClick={submitReview} loading={submittingReview}>
                  Post Review
                </Btn>
              </div>
            )}

            <div className="mt-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
              {reviews.length === 0 && <p className="text-[12.5px] text-ink-faint">No reviews yet — be the first to review this artisan.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-ink/10 bg-cream p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12.5px] font-semibold text-ink">{r.buyerName}</p>
                    <Stars value={r.rating} size={11} />
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{r.body}</p>
                </div>
              ))}
            </div>
          </div>

          {onStudio && (
            <div className="flex flex-col gap-2 border-t border-ink/10 pt-3 sm:flex-row">
              <Btn
                size="lg"
                className="flex-1"
                onClick={() => {
                  onStudio(artisan.id);
                  onClose();
                }}
              >
                <Sparkles className="size-4" /> Select {artisan.name.split(" ")[0]} & Generate Custom Design with AI
              </Btn>
              <Btn size="lg" variant="outline" onClick={onClose}>
                Keep browsing
              </Btn>
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/85 p-5" onClick={() => setLightbox(null)}>
          <button className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-cream text-ink" aria-label="Close image">
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <SafeImg src={lightbox} alt="Artisan work" className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain" />
        </div>
      )}
    </Modal>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="flex items-center gap-2 py-16 text-[13px] text-ink-faint">
      <Loader2 className="size-4 animate-spin" /> Loading nearby artisans…
    </div>
  );
}
