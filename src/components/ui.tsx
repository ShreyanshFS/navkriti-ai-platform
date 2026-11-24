"use client";

import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { Loader2, Star, X } from "lucide-react";

export function Stars({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-marigold text-marigold" : "fill-ink/10 text-ink/15"}
        />
      ))}
      <span className="ml-1 text-[11.5px] font-semibold text-ink">{value > 0 ? value.toFixed(1) : "New"}</span>
      {typeof count === "number" && count > 0 && <span className="text-[11px] text-ink-faint">({count})</span>}
    </span>
  );
}

const TONES: Record<string, string> = {
  terracotta: "bg-terracotta/12 text-terracotta-deep",
  indigo: "bg-indigo/12 text-indigo",
  leaf: "bg-leaf/15 text-leaf",
  marigold: "bg-marigold/25 text-ink",
  neutral: "bg-sand text-ink-soft",
};

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: keyof typeof TONES | string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] ${TONES[tone] ?? TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "outline" | "ghost" | "leaf";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Btn({ variant = "primary", size = "md", loading, className = "", children, ...rest }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-55";
  const sizes = { sm: "px-3.5 py-2 text-[12px]", md: "px-5 py-2.5 text-[13px]", lg: "px-6 py-3.5 text-[14.5px]" }[size];
  const variants = {
    primary: "bg-terracotta text-cream shadow-[2px_3px_0_0_rgba(28,25,23,0.85)] hover:bg-terracotta-deep hover:-translate-y-0.5",
    dark: "bg-ink text-cream hover:bg-ink/85",
    outline: "border-[1.5px] border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream",
    ghost: "text-ink-soft hover:bg-sand hover:text-ink",
    leaf: "bg-leaf text-cream hover:brightness-110",
  }[variant];
  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} disabled={rest.disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">{label}</span>}
      <input className={`field ${className}`} {...rest} />
    </label>
  );
}

export function Modal({
  open,
  onClose,
  children,
  title,
  subtitle,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-[1.5px] border-ink/15 bg-paper shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/10 bg-paper/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            {title && <p className="font-display text-xl font-semibold text-ink">{title}</p>}
            {subtitle && <p className="mt-0.5 text-[12px] text-ink-faint">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-ink hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, src, size = 40, color = "#C1502E", className = "" }: { name: string; src?: string | null; size?: number; color?: string; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-bold text-cream ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.34 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-cream/60 px-6 py-14 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sand text-terracotta">{icon}</span>
      <p className="mt-4 font-display text-xl font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-faint">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-ink-faint">
      <Loader2 className="size-5 animate-spin text-terracotta" /> {label ?? "Loading…"}
    </div>
  );
}
