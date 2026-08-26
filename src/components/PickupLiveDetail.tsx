"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Phone, UserRound, Loader2, Clock } from "lucide-react";
import { PICKUP_STATUS_STYLE as STATUS_STYLE } from "@/lib/pickup-status";

const TrackingMapInner = dynamic(() => import("@/components/TrackingMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] w-full items-center justify-center rounded-lg border border-border bg-bg text-xs text-ink-faint">
      Loading map…
    </div>
  ),
});

type PickupEvent = { status: string; actor: string; createdAt: string };
type TrackData = {
  phleboStatus: string;
  destination: { lat: number | null; lng: number | null };
  phlebo: { name: string; phone: string; lat: number | null; lng: number | null; locationUpdatedAt: string | null } | null;
  events: PickupEvent[];
};

const STATUS_LABEL: Record<string, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned — awaiting response",
  ACCEPTED: "Accepted",
  EN_ROUTE: "On the way",
  ARRIVED: "Arrived",
  COLLECTED: "Collected",
  CANCELLED_BY_PHLEBO: "Cancelled by phlebotomist — reassigning",
};
const ACTOR_LABEL: Record<string, string> = {
  system: "auto-assigned",
  phlebo: "by phlebo",
  owner: "by owner",
  staff: "by staff",
};
const POLL_MS = 8_000;

export function PickupLiveDetail({ bookingId }: { bookingId: string }) {
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
        // transient — next poll retries
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
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-ink-faint">
        <Loader2 size={14} className="animate-spin" /> Loading live status…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Live pickup status</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[data.phleboStatus] ?? ""}`}>
          {STATUS_LABEL[data.phleboStatus] ?? data.phleboStatus}
        </span>
      </div>

      {data.phlebo && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-bg p-2.5">
          <span className="flex items-center gap-1.5 text-sm text-ink">
            <UserRound size={14} className="text-brand" /> {data.phlebo.name}
          </span>
          <a href={`tel:+91${data.phlebo.phone}`} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
            <Phone size={12} /> +91 {data.phlebo.phone}
          </a>
        </div>
      )}

      {data.destination.lat !== null && data.destination.lng !== null && (
        <TrackingMapInner
          destLat={data.destination.lat}
          destLng={data.destination.lng}
          phleboLat={data.phlebo?.lat ?? null}
          phleboLng={data.phlebo?.lng ?? null}
        />
      )}
      {data.phlebo?.locationUpdatedAt && (
        <p className="mt-2 text-[11px] text-ink-faint">
          Location updated {new Date(data.phlebo.locationUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {data.events.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Clock size={13} className="text-brand" /> Timing record
          </p>
          <div className="space-y-1.5">
            {data.events.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-ink-soft">
                  {STATUS_LABEL[e.status] ?? e.status}
                  <span className="text-ink-faint"> · {ACTOR_LABEL[e.actor] ?? e.actor}</span>
                </span>
                <span className="font-mono text-ink-faint">
                  {new Date(e.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
