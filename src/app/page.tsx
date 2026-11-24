"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Brush, Hammer, Loader2, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { getSession, setSession } from "@/lib/session";
import type { Role, SessionUser } from "@/lib/types";
import { Avatar, Btn, Input, Spinner } from "@/components/ui";
import { DesignArtwork } from "@/components/design-artwork";
import { AwsArchitectureModal } from "@/components/aws-modal";
import { Cloud } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  city: string;
  avatar: string;
  craft?: string;
  category?: string;
  rating?: number;
}

const HERO_SPEC = {
  palette: ["#EFE7D8", "#C1502E", "#5F7A52", "#2B3A8F", "#26221E"],
  motif: "floral" as const,
  sleeveMotif: "geometric" as const,
  layout: "kurti" as const,
  seed: 40021,
};

export default function LoginPortal() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("buyer");
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [awsOpen, setAwsOpen] = useState(false);
  const [buyers, setBuyers] = useState<Persona[]>([]);
  const [artisans, setArtisans] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", craft: "", category: "textiles", years: "", startingPrice: "" });

  useEffect(() => {
    const existing = getSession();
    if (existing) router.replace(existing.role === "buyer" ? "/buyer" : "/seller");
  }, [router]);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setBuyers(d.buyers ?? []);
        setArtisans(d.artisans ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(persona: Persona) {
    setBusy(persona.id);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", role, id: persona.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not sign in");
      setSession(data.user as SessionUser);
      router.push(role === "buyer" ? "/buyer" : "/seller");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in");
      setBusy(null);
    }
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setBusy("register");
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", role, ...form, years: Number(form.years) || 3, startingPrice: Number(form.startingPrice) || 800 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create account");
      setSession(data.user as SessionUser);
      router.push(role === "buyer" ? "/buyer" : "/seller");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account");
      setBusy(null);
    }
  }

  const personas = role === "buyer" ? buyers : artisans;

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_1fr]">
      {/* ── brand panel ── */}
      <section className="noise relative hidden flex-col justify-between overflow-hidden bg-indigo-deep p-10 text-cream lg:flex">
        <div className="blockprint-dark absolute inset-0" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 rotate-[-4deg] place-items-center rounded-[9px] bg-terracotta font-hindi text-lg text-cream shadow-[2px_3px_0_0_rgba(0,0,0,0.4)]">न</span>
            <div className="leading-none">
              <p className="font-display text-lg font-semibold">Navkriti</p>
              <p className="text-[9.5px] uppercase tracking-[0.22em] text-cream/50">by Team Handmind</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="font-hindi text-2xl italic text-marigold">आपका ख़याल, उनके हाथ</p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,4.4vw,3.6rem)] font-semibold leading-[1.02] tracking-tight">
            Describe it once.
            <br />
            <span className="italic text-marigold">An artisan makes it.</span>
          </h1>
          <p className="mt-5 text-[14.5px] leading-relaxed text-cream/65">
            Navkriti turns a plain-language idea into a design concept you can send straight to a
            nearby artisan — then chat, agree a price and lock the deal.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Sparkles, text: "AI studio turns one sentence into a design concept" },
              { icon: MapPin, text: "Discover verified artisans near your city" },
              { icon: ShieldCheck, text: "Chat, agree materials & price, lock the deal" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-xl border border-cream/15 bg-cream/[0.05] px-4 py-3">
                <f.icon className="size-4 shrink-0 text-marigold" />
                <p className="text-[13px] text-cream/80">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-end gap-4">
          <div className="w-28 rotate-[-3deg] overflow-hidden rounded-xl border-2 border-cream/25 shadow-xl">
            <DesignArtwork spec={HERO_SPEC} className="h-36 w-full" />
          </div>
          <p className="pb-1 text-[11px] leading-relaxed text-cream/45">
            Concept render generated in the studio
            <br />
            from “rust chikankari kurti with block sleeves”.
          </p>
        </div>
      </section>

      {/* ── auth card ── */}
      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 rotate-[-4deg] place-items-center rounded-[9px] bg-terracotta font-hindi text-lg text-cream shadow-[2px_3px_0_0_rgba(29,23,18,0.9)]">न</span>
            <div className="leading-none">
              <p className="font-display text-lg font-semibold text-ink">Navkriti</p>
              <p className="text-[9.5px] uppercase tracking-[0.22em] text-ink-faint">by Team Handmind</p>
            </div>
          </div>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Welcome in.</h2>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">Choose how you want to use Navkriti.</p>

          {/* role switch */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border-[1.5px] border-ink/12 bg-cream p-1.5">
            {(
              [
                ["buyer", "I'm a buyer", Brush],
                ["artisan", "I'm an artisan", Hammer],
              ] as const
            ).map(([r, label, Icon]) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                  role === r ? "bg-ink text-cream shadow-sm" : "text-ink-soft hover:bg-sand"
                }`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          {mode === "signin" ? (
            <>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                  {role === "buyer" ? "Continue as a customer" : "Continue as an artisan"}
                </p>
                <button onClick={() => setMode("register")} className="text-[12px] font-semibold text-terracotta hover:underline">
                  {role === "buyer" ? "Create account" : "Register your craft"}
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {loading && <Spinner label="Loading accounts…" />}
                {!loading &&
                  personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => login(p)}
                      disabled={busy !== null}
                      className="group flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-ink/12 bg-cream p-3 text-left transition-all hover:-translate-y-0.5 hover:border-terracotta hover:shadow-[0_12px_24px_-16px_rgba(28,25,23,0.5)] disabled:opacity-60"
                    >
                      <Avatar name={p.name} src={p.avatar} size={42} color={role === "artisan" ? "#2B3A8F" : "#C1502E"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
                        <p className="flex items-center gap-1 truncate text-[11.5px] text-ink-faint">
                          {p.craft ? `${p.craft} · ` : ""}
                          <MapPin className="size-3" /> {p.city}
                        </p>
                      </div>
                      {typeof p.rating === "number" && p.rating > 0 ? (
                        <span className="flex items-center gap-0.5 text-[11.5px] font-semibold text-ink">
                          <Star className="size-3 fill-marigold text-marigold" /> {p.rating.toFixed(1)}
                        </span>
                      ) : null}
                      {busy === p.id ? <Loader2 className="size-4 animate-spin text-terracotta" /> : <ArrowRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-terracotta" />}
                    </button>
                  ))}
              </div>

              <p className="mt-5 rounded-xl border border-dashed border-ink/20 bg-cream/60 px-4 py-3 text-[11.5px] leading-relaxed text-ink-faint">
                Demo accounts — no password needed. In production this portal is Amazon Cognito with
                phone OTP, and role-based access for buyers and artisans.
              </p>
            </>
          ) : (
            <form onSubmit={register} className="mt-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                  {role === "buyer" ? "New customer account" : "New artisan registration"}
                </p>
                <button type="button" onClick={() => setMode("signin")} className="text-[12px] font-semibold text-terracotta hover:underline">
                  Back to sign in
                </button>
              </div>
              <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ananya Sharma" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" />
                <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Jaipur" />
              </div>
              {role === "artisan" && (
                <>
                  <Input label="Your craft" required value={form.craft} onChange={(e) => setForm({ ...form, craft: e.target.value })} placeholder="e.g. Bagru block printing" />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">Category</span>
                      <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="textiles">Handmade textiles</option>
                        <option value="paintings">Paintings</option>
                      </select>
                    </label>
                    <Input label="Years of practice" type="number" min={1} value={form.years} onChange={(e) => setForm({ ...form, years: e.target.value })} placeholder="8" />
                  </div>
                  <Input label="Starting price (₹)" type="number" min={100} value={form.startingPrice} onChange={(e) => setForm({ ...form, startingPrice: e.target.value })} placeholder="1200" />
                </>
              )}
              {error && <p className="rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-2.5 text-[12.5px] font-medium text-terracotta-deep">{error}</p>}
              <Btn type="submit" size="lg" loading={busy === "register"} className="w-full">
                {role === "buyer" ? "Create my account" : "Register as an artisan"} <ArrowRight className="size-4" />
              </Btn>
              <p className="text-center text-[11px] text-ink-faint">
                {role === "artisan" ? "New profiles start unverified — ratings appear after your first orders." : "Your city helps us show artisans near you."}
              </p>
            </form>
          )}

          {error && mode === "signin" && (
            <p className="mt-4 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-2.5 text-[12.5px] font-medium text-terracotta-deep">{error}</p>
          )}

          <div className="mt-7 flex flex-col items-center gap-2 border-t border-ink/10 pt-5 text-center text-[10.5px] leading-relaxed text-ink-faint">
            <p>
              Team Handmind · Pranav Gupta (2501640100639) & Hansika Ojha (2501640100395) · Open Innovation
            </p>
            <button
              type="button"
              onClick={() => setAwsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo/25 bg-indigo/10 px-3.5 py-1.5 text-[11px] font-bold text-indigo transition-colors hover:bg-indigo hover:text-cream"
            >
              <Cloud className="size-3.5" /> View AWS Architecture (Bedrock · Lambda · DynamoDB · S3 · Cognito · Amplify)
            </button>
          </div>
        </div>
      </section>

      <AwsArchitectureModal open={awsOpen} onClose={() => setAwsOpen(false)} />
    </main>
  );
}
