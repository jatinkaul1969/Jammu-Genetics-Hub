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
  const { user, ready, login } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ready || user) return;
    // Only nudge people who are actually shopping. A login pop-up over the
    // test / genetic-counselling pages interrupts someone reading medical
    // information and hurts both them and the page's engagement.
    if (!(pathname?.startsWith("/cart") || pathname?.startsWith("/product/"))) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, ready, pathname]);

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
