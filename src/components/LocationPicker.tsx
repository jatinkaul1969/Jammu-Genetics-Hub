"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, MapPin, Loader2 } from "lucide-react";

const LocationMapInner = dynamic(() => import("@/components/LocationMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] w-full items-center justify-center rounded-lg border border-border bg-bg text-xs text-ink-faint">
      Loading map…
    </div>
  ),
});

// Jammu, India — sensible default center when no pin has been set yet.
const DEFAULT_LAT = 32.7266;
const DEFAULT_LNG = 74.857;

export function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (loc: { lat: number; lng: number } | null) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — check location permission, or drop a pin manually on the map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const active = value ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <MapPin size={14} className="text-brand" />
          Pin your exact location (optional) — helps the phlebotomist find you precisely
        </p>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="mb-2 flex items-center gap-1.5 rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
      >
        {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
        Use my current location
      </button>

      {error && <p className="mb-2 text-xs text-accent">{error}</p>}

      <LocationMapInner lat={active.lat} lng={active.lng} onMove={(lat, lng) => onChange({ lat, lng })} />

      {value ? (
        <p className="mt-2 text-xs text-ink-faint">
          Pinned at {value.lat.toFixed(5)}, {value.lng.toFixed(5)} — drag the pin or click the map to adjust.
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-faint">Click anywhere on the map to drop a pin, or drag it to adjust.</p>
      )}
    </div>
  );
}
