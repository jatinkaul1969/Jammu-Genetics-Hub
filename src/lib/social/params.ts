import { THEMES, type ThemeId } from "./brand";
import { FORMATS, FORMAT_IDS, type FormatId } from "./formats";
import { TEMPLATES, type TemplateId } from "./templates";
import type { Lang } from "./text";
import { SOURCES, type SourceId } from "./copy";

export type ParsedParams = {
  template: TemplateId;
  format: FormatId;
  lang: Lang;
  theme: ThemeId;
  slug: string | null;
  headline?: string;
  body?: string;
  eyebrow?: string;
  date?: string;
  place?: string;
  mythId?: string;
  factId?: string;
  showQr: boolean;
  showPrice: boolean;
  source: SourceId;
  download: boolean;
};

const clean = (v: string | null, max: number) => (v ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, max) : undefined);

/** Parse + validate poster/caption query params. Returns an error string for bad input. */
export function parseParams(sp: URLSearchParams): ParsedParams | { error: string } {
  const template = sp.get("template") as TemplateId | null;
  const info = TEMPLATES.find((t) => t.id === template);
  if (!template || !info) return { error: "Unknown template." };
  const format = (sp.get("format") as FormatId | null) ?? info.defaultFormat;
  if (!FORMAT_IDS.includes(format)) return { error: "Unknown format." };
  const lang: Lang = sp.get("lang") === "hi" ? "hi" : "en";
  const theme = (sp.get("theme") as ThemeId | null) ?? "teal";
  if (!(theme in THEMES)) return { error: "Unknown theme." };
  const slug = sp.get("slug");
  if (info.needsTest && (!slug || !/^[a-z0-9][a-z0-9-]{0,120}$/.test(slug))) return { error: "Pick a test for this template." };
  const source = (sp.get("source") as SourceId | null) ?? "instagram";
  if (!SOURCES.some((s) => s.id === source)) return { error: "Unknown source." };
  return {
    template,
    format,
    lang,
    theme,
    slug: slug && /^[a-z0-9][a-z0-9-]{0,120}$/.test(slug) ? slug : null,
    headline: clean(sp.get("headline"), 140),
    body: clean(sp.get("body"), 600),
    eyebrow: clean(sp.get("eyebrow"), 60),
    date: clean(sp.get("date"), 80),
    place: clean(sp.get("place"), 120),
    mythId: clean(sp.get("myth"), 40),
    factId: clean(sp.get("fact"), 40),
    showQr: sp.get("qr") === "1" || (sp.get("qr") === null && (template === "doctor" || format === "a4")),
    showPrice: sp.get("price") !== "0",
    source,
    download: sp.get("download") === "1",
  };
}

export const formatOf = (id: FormatId) => FORMATS[id];
