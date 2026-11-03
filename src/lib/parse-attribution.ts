// Server-side reading of the "where did this visitor come from" tag the browser
// sends along with a lead or booking (see lib/attribution.ts). It is free text
// from the browser, so keep only harmless characters and a short length.
export function parseAttribution(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  const part = (x: unknown) => (typeof x === "string" ? x.replace(/[^\w .\-/]/g, "").slice(0, 60) : "");
  return [part(a.src), part(a.med), part(a.camp)].filter(Boolean).join(" / ") || null;
}
