"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, SessionUser } from "./types";

const KEY = "navkriti_session";

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("navkriti-session"));
}

/** Guarded session hook — redirects to the login portal when missing / wrong role. */
export function useSession(role: Role) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== role) {
      router.replace("/");
      return;
    }
    setUser(s);
    setReady(true);
  }, [role, router]);

  return { user, ready };
}
