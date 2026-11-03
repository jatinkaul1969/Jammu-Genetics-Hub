// Fire a Google Analytics event if GA is loaded (see components/Analytics.tsx);
// otherwise do nothing. Safe to call anywhere on the client.
type Gtag = (...args: unknown[]) => void;

export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  try {
    if (typeof window === "undefined") return;
    (window as unknown as { gtag?: Gtag }).gtag?.("event", name, params);
  } catch {
    // analytics must never break the page
  }
}
