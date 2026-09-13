"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, User, Menu, X, LogOut, ClipboardList } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { LoginModal } from "@/components/LoginModal";
import { SearchBox } from "@/components/SearchBox";
import { CitySelector } from "@/components/CitySelector";

export function Header() {
  const router = useRouter();
  const { user, login, logout: authLogout } = useAuth();
  const { items } = useCart();
  const [showLogin, setShowLogin] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function logout() {
    await authLogout();
    setShowAccountMenu(false);
    router.refresh();
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-display text-sm font-semibold text-white">
            JGH
          </span>
          <span className="hidden font-display text-lg font-semibold leading-tight text-ink sm:block">
            Jammu Genetics
            <br className="hidden lg:block" /> Hub
          </span>
        </Link>

        <CitySelector />

        <div className="hidden flex-1 md:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink hover:border-brand hover:text-brand"
          >
            <ShoppingCart size={17} />
            <span className="hidden sm:inline">Cart</span>
            {items.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowAccountMenu((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink hover:border-brand hover:text-brand"
              >
                <User size={17} />
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="text-sm font-medium text-ink">{user.name}</p>
                    <p className="text-xs text-ink-faint">+91 {user.phone}</p>
                  </div>
                  <Link
                    href="/account/bookings"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-bg"
                  >
                    <ClipboardList size={15} /> My Bookings
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-accent hover:bg-bg"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Log in
            </button>
          )}

          <button
            className="rounded-lg border border-border p-2 text-ink md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <SearchBox placeholder="Search tests, packages…" />
        </div>
      )}
    </header>

    {showLogin && (
      <LoginModal
        onClose={() => setShowLogin(false)}
        onSuccess={(u) => {
          login(u);
          router.refresh();
        }}
      />
    )}
    </>
  );
}
