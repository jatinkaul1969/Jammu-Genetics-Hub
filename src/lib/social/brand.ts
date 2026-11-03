import { CONTACT_PHONES } from "@/lib/contact";
import { SITE_URL } from "@/lib/site-url";

export const BRAND = {
  name: "Jammu Genetics Hub",
  mono: "JGH",
  site: SITE_URL,
  siteHost: SITE_URL.replace(/^https?:\/\//, ""),
  whatsapp: CONTACT_PHONES[0],
  location: "Sarwal, Jammu",
};

/** "9086567018" → "+91 90865 67018" */
export function phoneDisplay(p: string) {
  return `+91 ${p.slice(0, 5)} ${p.slice(5)}`;
}

export type ThemeId = "teal" | "light" | "warm";

export type Theme = {
  id: ThemeId;
  bg: string;
  ink: string; // main text
  sub: string; // secondary text
  accent: string; // eyebrows, highlights
  accentSoft: string;
  card: string;
  cardBorder: string;
  decor: string; // helix / circles
  decorOpacity: number;
  ctaBg: string;
  ctaInk: string;
  good: string;
  bad: string;
  logoBg: string;
  logoInk: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  teal: {
    id: "teal",
    bg: "linear-gradient(160deg, #063f34 0%, #0b6e5c 100%)",
    ink: "#ffffff",
    sub: "#d7ece6",
    accent: "#e8c767",
    accentSoft: "rgba(232,199,103,0.18)",
    card: "rgba(255,255,255,0.10)",
    cardBorder: "rgba(255,255,255,0.24)",
    decor: "#ffffff",
    decorOpacity: 0.16,
    ctaBg: "#ffffff",
    ctaInk: "#063f34",
    good: "#8fe3c4",
    bad: "#ffb59e",
    logoBg: "#e8c767",
    logoInk: "#063f34",
  },
  light: {
    id: "light",
    bg: "linear-gradient(180deg, #f6f8f7 0%, #e3f0ec 100%)",
    ink: "#142420",
    sub: "#4b5d56",
    accent: "#c1502e",
    accentSoft: "rgba(193,80,46,0.12)",
    card: "#ffffff",
    cardBorder: "#cfddd7",
    decor: "#0b6e5c",
    decorOpacity: 0.14,
    ctaBg: "#0b6e5c",
    ctaInk: "#ffffff",
    good: "#0b6e5c",
    bad: "#c1502e",
    logoBg: "#0b6e5c",
    logoInk: "#ffffff",
  },
  warm: {
    id: "warm",
    bg: "linear-gradient(160deg, #7d2c14 0%, #c1502e 100%)",
    ink: "#ffffff",
    sub: "#fbe6de",
    accent: "#ffe3a3",
    accentSoft: "rgba(255,227,163,0.2)",
    card: "rgba(255,255,255,0.13)",
    cardBorder: "rgba(255,255,255,0.28)",
    decor: "#ffffff",
    decorOpacity: 0.15,
    ctaBg: "#ffffff",
    ctaInk: "#7d2c14",
    good: "#c9f2dd",
    bad: "#ffd9cb",
    logoBg: "#ffe3a3",
    logoInk: "#7d2c14",
  },
};
