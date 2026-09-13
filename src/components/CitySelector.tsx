"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { SERVICEABLE_CITIES, COMING_SOON_NOTE } from "@/lib/serviceable-areas";

// Persisted so checkout can default the collection city to whatever the
// visitor picked here. Home collection is only offered in these cities for
// now — everything else is "coming soon".
export const CITY_STORAGE_KEY = "jgh_city";

export function CitySelector() {
  const [city, setCity] = useState(SERVICEABLE_CITIES[0].label);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CITY_STORAGE_KEY);
      if (saved && SERVICEABLE_CITIES.some((c) => c.label === saved)) setCity(saved);
    } catch {
      // localStorage unavailable (private mode etc.) — just use the default
    }
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(label: string) {
    setCity(label);
    setOpen(false);
    try {
      localStorage.setItem(CITY_STORAGE_KEY, label);
    } catch {
      // ignore — selection still applies for this render
    }
  }

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs text-ink-soft hover:border-brand"
      >
        <MapPin size={14} className="text-brand" />
        {city}
        <ChevronDown size={13} className="text-ink-faint" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          {SERVICEABLE_CITIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => pick(c.label)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-bg"
            >
              {c.label}
              {c.label === city && <Check size={14} className="text-brand" />}
            </button>
          ))}
          <p className="border-t border-border px-3 py-2 text-[11px] text-ink-faint">{COMING_SOON_NOTE}</p>
        </div>
      )}
    </div>
  );
}
