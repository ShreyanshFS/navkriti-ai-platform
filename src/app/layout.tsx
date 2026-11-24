import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Space_Grotesk, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

const tiroHindi = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-hindi",
});

export const metadata: Metadata = {
  title: "Navkriti — design it with AI, get it made by an artisan near you",
  description:
    "Describe an idea, generate a design concept with AI, send it to a verified artisan near you, chat over materials and price, and lock the deal. By Team Handmind.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${spaceGrotesk.variable} ${tiroHindi.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
