"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FlaskConical, ArrowRight, Loader2 } from "lucide-react";
import { formatInr } from "@/lib/format";

type Suggestion = {
  slug: string;
  name: string;
  category: string;
  type: string;
  price: number | null;
};

export function SearchBox({
  size = "compact",
  placeholder = "Search tests, packages — e.g. Thyroid, Full Body Checkup",
  initialValue = "",
  autoFocus = false,
}: {
  size?: "compact" | "hero";
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function onChange(value: string) {
    setQuery(value);
    setHighlighted(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(value.trim().length > 0);
      return;
    }

    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function goToSearch() {
    setOpen(false);
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/product/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && results[highlighted]) {
        goToProduct(results[highlighted].slug);
      } else {
        goToSearch();
      }
    }
  }

  const padding = size === "hero" ? "p-2 sm:p-2.5" : "px-3 py-2";
  const textSize = size === "hero" ? "text-sm sm:text-base" : "text-sm";

  return (
    <div ref={boxRef} className="relative w-full">
      <div className={`flex items-center gap-2 rounded-xl border border-border bg-surface ${padding} ${size === "hero" ? "shadow-sm" : ""}`}>
        <Search size={size === "hero" ? 18 : 16} className="ml-1 shrink-0 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query.trim().length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full bg-transparent outline-none placeholder:text-ink-faint ${textSize}`}
        />
        {loading && <Loader2 size={14} className="shrink-0 animate-spin text-ink-faint" />}
        <button
          type="button"
          onClick={goToSearch}
          className={`shrink-0 rounded-lg bg-brand font-semibold text-white hover:bg-brand-dark ${
            size === "hero" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
          }`}
        >
          Search
        </button>
      </div>

      {open && (query.trim().length > 0 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {results.length === 0 && !loading && query.trim().length >= 2 && (
            <p className="px-4 py-3 text-sm text-ink-soft">No matches yet — try a different term.</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.slug}
              onClick={() => goToProduct(r.slug)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-b-0 ${
                highlighted === i ? "bg-bg" : "hover:bg-bg"
              }`}
            >
              <FlaskConical size={15} className="shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{r.name}</span>
                <span className="block text-xs text-ink-faint">
                  {r.category} · {r.type === "PACKAGE" ? "Package" : "Test"}
                </span>
              </span>
              {r.price !== null && <span className="shrink-0 font-mono text-sm text-ink">{formatInr(r.price)}</span>}
            </button>
          ))}
          {query.trim().length > 0 && (
            <button
              onClick={goToSearch}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-brand hover:bg-bg"
            >
              See all results for &ldquo;{query.trim()}&rdquo;
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
