export type FormatId = "square" | "portrait" | "story" | "gbp" | "a4";

export type Format = {
  id: FormatId;
  label: string;
  hint: string;
  w: number;
  h: number;
  pad: number;
  /** font/spacing scale relative to the 1080×1350 portrait design */
  scale: number;
  safeTop: number; // extra top padding (Instagram/WhatsApp story UI covers this area)
  safeBottom: number;
};

export const FORMATS: Record<FormatId, Format> = {
  square: { id: "square", label: "Square 1080×1080", hint: "Instagram / Facebook feed, WhatsApp", w: 1080, h: 1080, pad: 64, scale: 0.9, safeTop: 0, safeBottom: 0 },
  portrait: { id: "portrait", label: "Portrait 1080×1350", hint: "Instagram feed (best reach), Facebook", w: 1080, h: 1350, pad: 68, scale: 1, safeTop: 0, safeBottom: 0 },
  story: { id: "story", label: "Story 1080×1920", hint: "Instagram / WhatsApp status, Reels cover", w: 1080, h: 1920, pad: 72, scale: 1.08, safeTop: 150, safeBottom: 190 },
  gbp: { id: "gbp", label: "Google post 1200×900", hint: "Google Business Profile posts", w: 1200, h: 900, pad: 60, scale: 0.86, safeTop: 0, safeBottom: 0 },
  a4: { id: "a4", label: "A4 print 1240×1754", hint: "Clinic / society notice boards (150 dpi)", w: 1240, h: 1754, pad: 90, scale: 1.16, safeTop: 0, safeBottom: 0 },
};

export const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];
