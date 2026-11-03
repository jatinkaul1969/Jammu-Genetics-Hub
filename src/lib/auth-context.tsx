"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = { name: string; phone: string; age: number; membershipActive: boolean } | null;

type AuthContextValue = {
  user: AuthUser;
  /** False until the first /api/auth/me answer is back — don't treat `user: null` as "logged out" before then. */
  ready: boolean;
  login: (user: NonNullable<AuthUser>) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// The logged-in user is looked up in the browser (not in the root layout) so
// that public pages — the landing pages Google crawls — don't read cookies on
// the server. Reading cookies there forced every page to be rendered fresh on
// every request (2–5 s) and told Google/CDNs "never cache this".
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUser(d.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function login(u: NonNullable<AuthUser>) {
    setUser(u);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
