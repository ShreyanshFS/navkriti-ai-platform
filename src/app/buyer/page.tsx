"use client";

import { useEffect, useState } from "react";
import { Compass, LogOut, MapPin, MessageSquare, Package, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearSession, useSession } from "@/lib/session";
import type { ArtisanT, ConversationT } from "@/lib/types";
import { Avatar, Spinner } from "@/components/ui";
import { Discover } from "@/components/buyer/discover";
import { Studio } from "@/components/buyer/studio";
import { Inbox } from "@/components/buyer/inbox";
import { Orders } from "@/components/buyer/orders";
import { AwsArchitectureModal } from "@/components/aws-modal";
import { Cloud } from "lucide-react";

type Tab = "discover" | "studio" | "chats" | "orders";

const TABS: { key: Tab; label: string; icon: typeof Compass }[] = [
  { key: "discover", label: "Discover", icon: Compass },
  { key: "studio", label: "AI Studio", icon: Wand2 },
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "orders", label: "Orders", icon: Package },
];

export default function BuyerPortal() {
  const router = useRouter();
  const { user, ready } = useSession("buyer");
  const [tab, setTab] = useState<Tab>("discover");
  const [artisans, setArtisans] = useState<ArtisanT[]>([]);
  const [conversations, setConversations] = useState<ConversationT[]>([]);
  const [studioArtisan, setStudioArtisan] = useState<string | null>(null);
  const [openConversation, setOpenConversation] = useState<string | null>(null);
  const [awsOpen, setAwsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (user.lat != null && user.lng != null) {
      params.set("lat", String(user.lat));
      params.set("lng", String(user.lng));
    }
    fetch(`/api/artisans?${params.toString()}`).then((r) => r.json()).then(setArtisans);
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function refreshConversations() {
    if (!user) return;
    fetch(`/api/conversations?buyerId=${user.id}`).then((r) => r.json()).then(setConversations);
  }

  function logout() {
    clearSession();
    router.replace("/");
  }

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Spinner label="Opening your portal…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 rotate-[-4deg] place-items-center rounded-[9px] bg-terracotta font-hindi text-lg text-cream shadow-[2px_3px_0_0_rgba(29,23,18,0.85)]">न</span>
            <div className="hidden leading-none sm:block">
              <p className="font-display text-lg font-semibold text-ink">Navkriti</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-ink-faint">Buyer portal</p>
            </div>
          </div>

          <nav className="no-scrollbar mx-auto flex items-center gap-1 overflow-x-auto rounded-full border border-ink/10 bg-cream p-1">
            {TABS.map((t) => {
              const count = t.key === "chats" ? conversations.length : 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-all sm:px-4 ${
                    tab === t.key ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand"
                  }`}
                >
                  <t.icon className="size-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {count > 0 && (
                    <span className={`grid size-4 place-items-center rounded-full text-[9px] font-bold ${tab === t.key ? "bg-cream text-ink" : "bg-terracotta text-cream"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAwsOpen(true)}
              className="hidden items-center gap-1 rounded-full border border-indigo/25 bg-indigo/10 px-3 py-1.5 text-[11px] font-bold text-indigo transition-colors hover:bg-indigo hover:text-cream lg:flex"
            >
              <Cloud className="size-3" /> AWS & Team
            </button>
            <span className="hidden items-center gap-1 rounded-full bg-cream px-3 py-1.5 text-[11px] font-medium text-ink-soft md:flex">
              <MapPin className="size-3 text-terracotta" /> {user.city}
            </span>
            <div className="flex items-center gap-2">
              <Avatar name={user.name} src={user.avatar} size={32} />
              <span className="hidden text-[12.5px] font-semibold text-ink sm:block">{user.name.split(" ")[0]}</span>
            </div>
            <button onClick={logout} className="grid size-8 place-items-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta" aria-label="Sign out">
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
        {tab === "discover" && (
          <Discover
            buyer={user}
            onStudio={(artisanId) => {
              setStudioArtisan(artisanId);
              setTab("studio");
            }}
          />
        )}

        {tab === "studio" && (
          <Studio
            buyer={user}
            artisans={artisans}
            preselected={studioArtisan}
            onBrowse={() => setTab("discover")}
            onSent={(conversationId) => {
              refreshConversations();
              setOpenConversation(conversationId);
              setTab("chats");
            }}
          />
        )}

        {tab === "chats" && (
          <Inbox
            buyer={user}
            initialConversationId={openConversation}
            onConsumedInitial={() => setOpenConversation(null)}
            onLocked={() => refreshConversations()}
          />
        )}

        {tab === "orders" && <Orders buyer={user} />}

        {/* contextual helper */}
        {tab !== "studio" && (
          <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-ink/20 bg-cream/60 p-5 sm:flex-row sm:items-center">
            <span className="grid size-10 place-items-center rounded-xl bg-terracotta/10 text-terracotta">
              <Sparkles className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold text-ink">Have an idea in your head?</p>
              <p className="text-[12.5px] text-ink-soft">Describe it in one line and see it before you order — the studio does the rest.</p>
            </div>
            <button onClick={() => { setStudioArtisan(null); setTab("studio"); }} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-cream hover:bg-ink/85">
              <Wand2 className="size-3.5" /> Open AI studio
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-ink/10 px-4 py-6 text-center text-[11px] text-ink-faint">
        <span>Navkriti · Team Handmind (Pranav Gupta · 2501640100639 & Hansika Ojha · 2501640100395) · </span>
        <button onClick={() => setAwsOpen(true)} className="font-semibold text-indigo underline-offset-4 hover:underline">
          View AWS Architecture & Circular Loop
        </button>
      </footer>

      <AwsArchitectureModal open={awsOpen} onClose={() => setAwsOpen(false)} />
    </div>
  );
}
