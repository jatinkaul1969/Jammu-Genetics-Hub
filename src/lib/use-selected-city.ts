"use client";

import { useSyncExternalStore } from "react";
import { SERVICEABLE_CITIES, cityByLabel } from "@/lib/serviceable-areas";

// Same key CitySelector writes. Read through useSyncExternalStore so the
// server render (and first client render) use the default city and the real
// choice is picked up after hydration without a mismatch.
const STORAGE_KEY = "jgh_city";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("jgh-city-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("jgh-city-change", onChange);
  };
}

function getSnapshot() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved && cityByLabel(saved)?.key) || SERVICEABLE_CITIES[0].key;
  } catch {
    return SERVICEABLE_CITIES[0].key;
  }
}

export function useSelectedCityKey() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVICEABLE_CITIES[0].key);
}
