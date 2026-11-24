"use client";

import {
  BrainCircuit,
  Cloud,
  Database,
  FunctionSquare,
  GraduationCap,
  IdCard,
  Images,
  KeyRound,
  Recycle,
  Scissors,
  Webhook,
  Wrench,
} from "lucide-react";
import { Badge, Modal } from "./ui";

const SERVICES = [
  {
    icon: BrainCircuit,
    name: "Amazon Bedrock",
    role: "Idea → Multi-Zone Brief + Concept Visual",
    desc: "Converts a customer's plain-language explanation (e.g. kurti with chikankari yoke & block-print sleeve borders) into structured zones, materials, palette, budget & concept artwork.",
  },
  {
    icon: Webhook,
    name: "Amazon API Gateway",
    role: "Managed REST Entrypoint",
    desc: "Routes buyer & artisan portal requests (/designs, /conversations, /orders, /reviews) with throttling and auth validation.",
  },
  {
    icon: FunctionSquare,
    name: "AWS Lambda",
    role: "Serverless Backend Compute",
    desc: "Executes the AI brief generator, geolocation distance matching, quotation messaging, and deal-locking order workflows.",
  },
  {
    icon: Database,
    name: "Amazon DynamoDB",
    role: "Users · Designs · Quotes · Orders",
    desc: "Low-latency NoSQL tables storing Artisan profiles, Buyer accounts, Custom Design specs, Chat threads, Locked Orders & Reviews.",
  },
  {
    icon: Images,
    name: "Amazon S3",
    role: "Portfolio & Reference Media",
    desc: "Stores artisan past-work portfolios, buyer reference photos, and AI-generated concept renders.",
  },
  {
    icon: KeyRound,
    name: "Amazon Cognito",
    role: "Buyer & Artisan Authentication",
    desc: "Handles role-based sign-in and new artisan registration with verified badges and profile onboarding.",
  },
  {
    icon: Cloud,
    name: "AWS Amplify",
    role: "Full-Stack Frontend Hosting",
    desc: "Hosts and serves the responsive Buyer & Artisan portals globally with CI/CD.",
  },
];

export function AwsArchitectureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Navkriti · AWS Architecture & Team Handmind"
      subtitle="Track: Open Innovation — AI that turns a customer's idea into a ready-to-quote order for Indian artisans"
    >
      <div className="space-y-6">
        {/* Team Handmind banner */}
        <div className="rounded-2xl border-[1.5px] border-ink/15 bg-cream p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta">Team Handmind · Open Innovation</p>
              <p className="mt-0.5 font-display text-lg font-semibold text-ink">
                AI suggests — the maker makes the final call.
              </p>
            </div>
            <Badge tone="indigo">Final Deployment Build</Badge>
          </div>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            {[
              { name: "Pranav Gupta", year: "2nd Year · CSE", roll: "2501640100639", color: "#C1502E" },
              { name: "Hansika Ojha", year: "2nd Year · CSE", roll: "2501640100395", color: "#2B3A8F" },
            ].map((m) => (
              <div key={m.roll} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper p-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-xs font-bold text-cream"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-ink">{m.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-ink-soft">
                    <GraduationCap className="size-3 text-terracotta" /> {m.year}
                  </p>
                  <p className="flex items-center gap-1 text-[10.5px] font-medium text-ink-faint">
                    <IdCard className="size-3 text-indigo" /> Roll No.: {m.roll}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AWS Stack */}
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-faint">
            Production AWS Stack (7 Services)
          </p>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <div key={s.name} className="rounded-xl border border-ink/12 bg-cream p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo/10 text-indigo">
                    <s.icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">{s.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-terracotta">{s.role}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Future Scope: Navkriti Loop */}
        <div className="rounded-2xl border border-leaf/30 bg-leaf/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-leaf">
            Future Scope · Navkriti Circular Craft Loop
          </p>
          <p className="mt-1 text-[12px] text-ink-soft">
            Items customers no longer need are routed to verified reuse, repair, or upcycling artisan partners:
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {[
              { icon: Recycle, title: "Reuse", text: "Pre-loved handloom sarees & art re-listed with original maker provenance." },
              { icon: Wrench, title: "Repair", text: "Torn kantha, zari or folk canvases routed back to the craft cluster for authentic mending." },
              { icon: Scissors, title: "Upcycle", text: "Heirloom fabric & tailoring offcuts transformed into custom jackets, totes & cushions." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-paper/90 p-3">
                <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
                  <item.icon className="size-3.5 text-leaf" /> {item.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
