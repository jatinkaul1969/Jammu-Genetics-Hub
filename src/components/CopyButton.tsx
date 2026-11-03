"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          // clipboard blocked (e.g. insecure context) — fall back to a prompt the user can copy from
          window.prompt("Copy this text:", text);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand ${className}`}
    >
      {done ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      {done ? "Copied" : label}
    </button>
  );
}
