"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Phone, Truck, Check, UserRound, Loader2 } from "lucide-react";

const TrackingMapInner = dynamic(() => import("@/components/TrackingMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] w-full items-center justify-center rounded-lg border border-border bg-bg text-xs text-ink-faint">
      Loading map…
    </div>
  ),
});

type TrackData = {
  phleboStatus: string;
  destination: { lat: number | null; lng: number | null };
  phlebo: { name: string; phone: string; lat: number | null; lng: number | null } | null;
};

const STAGES = [
  { key: "ASSIGNED", label: "Assigned" },
  { key: "ACCEPTED", label: "Confirmed" },
  { key: "EN_ROUTE", label: "On the way" },
  { key: "ARRIVED", label: "Arrived" },
  { key: "COLLECTED", label: "Collected" },
];
const POLL_MS = 10_000;

export function PickupTracker({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<TrackData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/track`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // transient — next poll will retry
      }
    }
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId]);

  if (!data) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-ink-faint">
        <Loader2 size={13} className="animate-spin" /> Loading pickup status…
      </div>
    );
  }

  if (data.phleboStatus === "COLLECTED") return null;

  const stageIndex = STAGES.findIndex((s) => s.key === data.phleboStatus);

  return (
    <div className="mt-3 rounded-lg border border-border bg-bg p-3">
      <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-ink">
        <Truck size={14} className="text-brand" /> Track your pickup
      </p>

      {data.phleboStatus === "UNASSIGNED" || stageIndex === -1 ? (
        <p className="text-xs text-ink-soft">We&apos;re assigning a phlebotomist for your pickup.</p>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1">
            {STAGES.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center gap-1">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    i <= stageIndex ? "bg-brand text-white" : "bg-surface-muted text-ink-faint"
                  }`}
                >
                  {i < stageIndex ? <Check size={11} /> : i + 1}
                </span>
                {i < STAGES.length - 1 && (
                  <span className={`h-0.5 flex-1 ${i < stageIndex ? "bg-brand" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <p className="mb-2 text-xs font-medium text-ink">{STAGES[stageIndex]?.label}</p>

          {data.phlebo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-surface p-2.5">
              <span className="flex items-center gap-1.5 text-xs text-ink">
                <UserRound size={13} className="text-brand" /> {data.phlebo.name}
              </span>
              <a href={`tel:+91${data.phlebo.phone}`} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                <Phone size={12} /> +91 {data.phlebo.phone}
              </a>
            </div>
          )}

          {data.phleboStatus === "EN_ROUTE" &&
            data.destination.lat !== null &&
            data.destination.lng !== null && (
              <TrackingMapInner
                destLat={data.destination.lat}
                destLng={data.destination.lng}
                phleboLat={data.phlebo?.lat ?? null}
                phleboLng={data.phlebo?.lng ?? null}
              />
            )}
        </>
      )}
    </div>
  );
}
