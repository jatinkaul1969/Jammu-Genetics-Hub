"use client";

import { useRouter } from "next/navigation";
import { SearchBox } from "@/components/SearchBox";

const SUGGESTIONS = ["Full Body Checkup", "Thyroid Profile", "Vitamin D", "NIPT", "Lipid Profile"];

export function HeroSearch() {
  const router = useRouter();

  return (
    <div>
      <SearchBox size="hero" />
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-ink-soft hover:border-brand hover:text-brand"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
