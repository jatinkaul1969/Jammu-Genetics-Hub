"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton({
  logoutUrl = "/api/admin/logout",
  redirectUrl = "/admin/login",
}: {
  logoutUrl?: string;
  redirectUrl?: string;
}) {
  const router = useRouter();

  async function logout() {
    await fetch(logoutUrl, { method: "POST" });
    router.push(redirectUrl);
    router.refresh();
  }

  return (
    <button onClick={logout} className="flex items-center gap-1.5 text-accent hover:underline">
      <LogOut size={14} /> Log out
    </button>
  );
}
