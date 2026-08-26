"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

const LOCATION_THROTTLE_MS = 15_000;

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "New — needs your response",
  ACCEPTED: "Accepted",
  EN_ROUTE: "On the way",
  ARRIVED: "Arrived",
  COLLECTED: "Sample collected",
};

// What the dropdown offers once a pickup has been accepted — deliberately
// not locked to "one step at a time" beyond that, so a phlebo who tapped
// the wrong option can correct it themselves instead of calling support.
const SELECTABLE_STATUSES = ["ACCEPTED", "EN_ROUTE", "ARRIVED", "COLLECTED"];

export function PhleboPickupActions({
  bookingId,
  status,
  cancellable,
}: {
  bookingId: string;
  status: string;
  cancellable: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  function stopSharing() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  function startSharing() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser.");
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < LOCATION_THROTTLE_MS) return;
        lastSentRef.current = now;
        fetch("/api/phlebo/location", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => setError("Couldn't get your location — check location permission and try again."),
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => () => stopSharing(), []);

  async function setStatus(next: string) {
    setLoading(next);
    setError(null);
    try {
      const res = await fetch(`/api/phlebo/pickups/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update.");

      setCurrent(next);
      if (next === "EN_ROUTE") startSharing();
      if (next === "ARRIVED" || next === "COLLECTED") stopSharing();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function cancel() {
    setLoading("cancel");
    setError(null);
    try {
      const res = await fetch(`/api/phlebo/pickups/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not cancel.");
      stopSharing();
      router.push("/admin/phlebo/pickups");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  const btnClass =
    "flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60";
  const cancelClass =
    "flex items-center justify-center gap-1.5 rounded-lg border border-accent px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent-soft disabled:opacity-60";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-sm font-semibold text-ink">Status: {STATUS_LABEL[current] ?? current}</p>

      <div className="flex flex-wrap items-center gap-2">
        {current === "ASSIGNED" ? (
          <button onClick={() => setStatus("ACCEPTED")} disabled={!!loading} className={btnClass}>
            {loading === "ACCEPTED" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Accept pickup
          </button>
        ) : current === "COLLECTED" ? (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <Check size={15} /> This pickup is complete.
          </p>
        ) : (
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-soft">Update status</span>
            <select
              value={current}
              onChange={(e) => setStatus(e.target.value)}
              disabled={!!loading}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
            >
              {SELECTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {loading && <Loader2 size={15} className="animate-spin text-ink-faint" />}
          </label>
        )}

        {cancellable && ["ASSIGNED", "ACCEPTED", "EN_ROUTE"].includes(current) && (
          <button onClick={cancel} disabled={!!loading} className={cancelClass}>
            {loading === "cancel" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            Can&apos;t take this pickup
          </button>
        )}
      </div>

      {current === "EN_ROUTE" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
          <span className={`h-1.5 w-1.5 rounded-full ${sharing ? "bg-success animate-pulse" : "bg-ink-faint"}`} />
          {sharing ? "Sharing your live location with the customer" : "Live location sharing is off"}
        </p>
      )}
      {!cancellable && ["ASSIGNED", "ACCEPTED", "EN_ROUTE"].includes(current) && (
        <p className="mt-3 text-xs text-ink-faint">Too close to the scheduled slot to cancel — call support if there&apos;s a real problem.</p>
      )}
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
