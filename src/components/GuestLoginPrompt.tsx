"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/LoginModal";

const DELAY_MS = 30_000;
const DISMISS_KEY = "jgh_guest_prompt_dismissed";

export function GuestLoginPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (user) return;
    if (pathname?.startsWith("/admin")) return;
    if (pathname?.startsWith("/checkout")) return; // checkout has its own login prompt inline
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, pathname]);

  if (!show) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <LoginModal
      onClose={dismiss}
      onSuccess={(u) => {
        login(u);
        sessionStorage.setItem(DISMISS_KEY, "1");
        setShow(false);
        router.refresh();
      }}
    />
  );
}
