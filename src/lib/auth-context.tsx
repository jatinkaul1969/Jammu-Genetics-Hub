"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type AuthUser = { name: string; phone: string; age: number; membershipActive: boolean } | null;

type AuthContextValue = {
  user: AuthUser;
  login: (user: NonNullable<AuthUser>) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ initialUser, children }: { initialUser: AuthUser; children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(initialUser);

  function login(u: NonNullable<AuthUser>) {
    setUser(u);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
