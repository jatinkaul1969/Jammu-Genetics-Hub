"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function StaffOnlineToggle({
  initialOnline,
  url = "/api/staff/online",
  onLabel = "Online — receiving leads",
}: {
  initialOnline: boolean;
  url?: string;
  onLabel?: string;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(initialOnline);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: !online }),
      });
      if (res.ok) {
        setOnline((v) => !v);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        online ? "border-success bg-success-soft text-success" : "border-border text-ink-soft"
      }`}
    >
      {saving ? <Loader2 size={12} className="animate-spin" /> : <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success" : "bg-ink-faint"}`} />}
      {online ? onLabel : "Offline"}
    </button>
  );
}
