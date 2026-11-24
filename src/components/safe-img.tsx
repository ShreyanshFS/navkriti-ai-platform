"use client";

import { useState, type ImgHTMLAttributes } from "react";

/**
 * Drop-in replacement for <img>.
 * If the remote image fails to load (dead URL, hotlink block, offline),
 * it swaps to a generated craft-toned placeholder instead of showing
 * the browser's broken-image icon and alt text.
 *
 * Save as: src/components/safe-img.tsx
 */

const TONES = [
  ["#c4572f", "#f3e3d3"], // terracotta
  ["#2f3e6b", "#e4e7f2"], // indigo
  ["#6b7a3d", "#eef0dc"], // leaf
  ["#8a5a2b", "#f1e6d6"], // ochre
  ["#7a2f4a", "#f3dfe7"], // madder
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function placeholder(label: string) {
  const [fg, bg] = TONES[hash(label) % TONES.length];
  const text = (label || "Navkriti")
    .replace(/[<>&"']/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
<rect width="400" height="300" fill="${bg}"/>
<g fill="none" stroke="${fg}" stroke-opacity=".25" stroke-width="2">
<path d="M0 60 L60 0 L120 60 L180 0 L240 60 L300 0 L360 60 L420 0"/>
<path d="M0 300 L60 240 L120 300 L180 240 L240 300 L300 240 L360 300 L420 240"/>
</g>
<text x="200" y="168" text-anchor="middle" font-family="Georgia,serif" font-size="72" fill="${fg}" fill-opacity=".85">${text}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function SafeImg({
  src,
  alt = "",
  onError,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  const label = alt || (typeof src === "string" ? src : "");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      alt={alt}
      src={failed || !src ? placeholder(label) : src}
      referrerPolicy="no-referrer"
      loading={rest.loading ?? "lazy"}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
