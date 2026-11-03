// A tiny text-layout engine for the poster generator.
//
// Why it exists: the image renderer behind `next/og` (satori) does not apply
// OpenType shaping, so Hindi/Devanagari conjuncts come out wrong (visible
// virama marks, unjoined letters). Instead, we shape the text ourselves with
// fontkit (which implements the Indic shaping rules), wrap and auto-fit it,
// and hand the renderer finished vector outlines. English goes through the
// same path, so both languages look identical in quality and nothing can
// overflow its box.

import * as fontkit from "fontkit";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";

export type Lang = "en" | "hi";
export type FontKind = "display" | "body";

type FKFont = fontkit.Font;

const FONT_DIR = join(process.cwd(), "src/assets/fonts");
const fontCache = new Map<string, FKFont>();

function load(file: string): FKFont {
  let f = fontCache.get(file);
  if (!f) {
    f = fontkit.create(readFileSync(join(FONT_DIR, file))) as FKFont;
    fontCache.set(file, f);
  }
  return f;
}

type Stack = { deva: FKFont | null; latin: FKFont[] };

function stackFor(kind: FontKind, lang: Lang, weight: number): Stack {
  const hiW = weight >= 700 ? 700 : weight >= 600 ? 600 : 400;
  const deva = lang === "hi" ? load(`noto-sans-devanagari-devanagari-${hiW}-normal.woff`) : null;
  if (kind === "display") {
    const w = weight >= 700 ? 700 : 600;
    return { deva, latin: [load(`fraunces-latin-${w}-normal.woff`), load(`fraunces-latin-ext-${w}-normal.woff`)] };
  }
  const w = weight >= 700 ? 700 : weight >= 600 ? 600 : weight >= 500 ? 500 : 400;
  const ext = w >= 700 ? 700 : w >= 600 ? 600 : 400;
  return { deva, latin: [load(`ibm-plex-sans-latin-${w}-normal.woff`), load(`ibm-plex-sans-latin-ext-${ext}-normal.woff`)] };
}

const isDevanagari = (cp: number) =>
  (cp >= 0x0900 && cp <= 0x097f) || cp === 0x200c || cp === 0x200d || (cp >= 0xa8e0 && cp <= 0xa8ff);

function fontFor(cp: number, stack: Stack): FKFont | null {
  if (isDevanagari(cp)) return stack.deva ?? null;
  for (const f of stack.latin) if (f.hasGlyphForCodePoint(cp)) return f;
  if (stack.deva && stack.deva.hasGlyphForCodePoint(cp)) return stack.deva;
  return null;
}

type Run = { font: FKFont; glyphs: fontkit.Glyph[]; positions: fontkit.GlyphPosition[]; latin: boolean };
type Shaped = { runs: Run[]; width: number };

function shapeToken(token: string, stack: Stack, size: number, tracking: number): Shaped {
  const pieces: { font: FKFont; text: string }[] = [];
  for (const ch of token) {
    const cp = ch.codePointAt(0)!;
    const font = fontFor(cp, stack);
    if (!font) continue; // no glyph anywhere (e.g. emoji) — skip instead of drawing a box
    const last = pieces[pieces.length - 1];
    if (last && last.font === font) last.text += ch;
    else pieces.push({ font, text: ch });
  }
  const runs: Run[] = [];
  let width = 0;
  for (const p of pieces) {
    const run = p.font.layout(p.text);
    const scale = size / p.font.unitsPerEm;
    const latin = p.font !== stack.deva;
    let w = 0;
    for (const pos of run.positions) w += pos.xAdvance * scale;
    if (latin && tracking) w += tracking * run.glyphs.length;
    runs.push({ font: p.font, glyphs: run.glyphs, positions: run.positions, latin });
    width += w;
  }
  return { runs, width };
}

function spaceWidth(stack: Stack, size: number) {
  const f = stack.latin.find((x) => x.hasGlyphForCodePoint(32));
  return f ? (f.glyphForCodePoint(32).advanceWidth * size) / f.unitsPerEm : size * 0.26;
}

export type TextStyle = {
  kind: FontKind;
  weight: 400 | 500 | 600 | 700;
  size: number;
  color: string;
  lineHeight?: number; // multiple of size
  tracking?: number; // extra px between Latin letters (for small-caps style labels)
  align?: "left" | "center" | "right";
  opacity?: number;
  upper?: boolean;
};

export type Line = { tokens: Shaped[]; width: number };
export type Block = { lines: Line[]; size: number; lineHeight: number; width: number; height: number; truncated: boolean; space: number };

function wrapTokens(text: string, lang: Lang, st: TextStyle, size: number, maxWidth: number) {
  const stack = stackFor(st.kind, lang, st.weight);
  const track = st.tracking ?? 0;
  const sp = spaceWidth(stack, size);
  const lines: Line[] = [];
  const paragraphs = (st.upper ? text.toUpperCase() : text).split("\n");
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur: Line = { tokens: [], width: 0 };
    const push = () => {
      lines.push(cur);
      cur = { tokens: [], width: 0 };
    };
    if (words.length === 0) {
      lines.push(cur);
      continue;
    }
    for (const w of words) {
      let tok = shapeToken(w, stack, size, track);
      // a single word wider than the box: break it by characters
      if (tok.width > maxWidth) {
        if (cur.tokens.length) push();
        let chunk = "";
        for (const ch of w) {
          const trial = shapeToken(chunk + ch, stack, size, track);
          if (trial.width > maxWidth && chunk) {
            const t = shapeToken(chunk, stack, size, track);
            cur = { tokens: [t], width: t.width };
            push();
            chunk = ch;
          } else chunk += ch;
        }
        tok = shapeToken(chunk, stack, size, track);
      }
      const add = cur.tokens.length ? sp : 0;
      if (cur.tokens.length && cur.width + add + tok.width > maxWidth) push();
      cur.width += (cur.tokens.length ? sp : 0) + tok.width;
      cur.tokens.push(tok);
    }
    if (cur.tokens.length) push();
  }
  return { lines, sp };
}

/** Lay text out inside `maxWidth`, shrinking the font (down to `minSize`) until it fits `maxLines`. */
export function layout(text: string, lang: Lang, st: TextStyle, maxWidth: number, maxLines = 99, minSize?: number): Block {
  const lh = st.lineHeight ?? 1.25;
  const floor = minSize ?? st.size;
  let size = st.size;
  let wrapped = wrapTokens(text, lang, st, size, maxWidth);
  while (wrapped.lines.length > maxLines && size - 2 >= floor) {
    size -= 2;
    wrapped = wrapTokens(text, lang, st, size, maxWidth);
  }
  let lines = wrapped.lines;
  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    // add an ellipsis to the last line, dropping words until it fits
    const stack = stackFor(st.kind, lang, st.weight);
    const ell = shapeToken("…", stack, size, 0);
    const last = lines[maxLines - 1];
    while (last.tokens.length > 1 && last.width + wrapped.sp + ell.width > maxWidth) {
      const t = last.tokens.pop()!;
      last.width -= wrapped.sp + t.width;
    }
    last.tokens.push(ell);
    last.width += ell.width;
  }
  const widest = lines.reduce((m, l) => Math.max(m, l.width), 0);
  return { lines, size, lineHeight: lh, width: widest, height: Math.ceil(lines.length * size * lh), truncated, space: wrapped.sp };
}

type Cmd = { command: string; args: number[] };

function glyphPathD(glyph: fontkit.Glyph, scale: number, ox: number, oy: number): string {
  const cmds = (glyph.path as unknown as { commands: Cmd[] }).commands;
  const X = (x: number) => (ox + x * scale).toFixed(1);
  const Y = (y: number) => (oy - y * scale).toFixed(1);
  let d = "";
  for (const c of cmds) {
    const a = c.args;
    if (c.command === "moveTo") d += `M${X(a[0])} ${Y(a[1])}`;
    else if (c.command === "lineTo") d += `L${X(a[0])} ${Y(a[1])}`;
    else if (c.command === "quadraticCurveTo") d += `Q${X(a[0])} ${Y(a[1])} ${X(a[2])} ${Y(a[3])}`;
    else if (c.command === "bezierCurveTo") d += `C${X(a[0])} ${Y(a[1])} ${X(a[2])} ${Y(a[3])} ${X(a[4])} ${Y(a[5])}`;
    else if (c.command === "closePath") d += "Z";
  }
  return d;
}

function blockPath(block: Block, st: TextStyle, boxWidth: number): string {
  const track = st.tracking ?? 0;
  const parts: string[] = [];
  block.lines.forEach((line, i) => {
    // baseline: top of line box + half-leading + ascent (approx 0.8 of the font size)
    const baseline = i * block.size * block.lineHeight + block.size * (0.5 * (block.lineHeight - 1) + 0.82);
    let x = st.align === "center" ? (boxWidth - line.width) / 2 : st.align === "right" ? boxWidth - line.width : 0;
    line.tokens.forEach((tok, ti) => {
      if (ti > 0) x += block.space;
      for (const run of tok.runs) {
        const scale = block.size / run.font.unitsPerEm;
        let pen = x;
        run.glyphs.forEach((g, gi) => {
          const pos = run.positions[gi];
          parts.push(glyphPathD(g, scale, pen + pos.xOffset * scale, baseline - pos.yOffset * scale));
          pen += pos.xAdvance * scale + (run.latin ? track : 0);
        });
        x = pen;
      }
    });
  });
  return parts.join("");
}

/** A laid-out block as a satori-compatible <svg> element (vector outlines). */
export function textSvg(block: Block, st: TextStyle, boxWidth: number): ReactElement {
  const h = Math.max(1, block.height);
  return (
    <svg width={boxWidth} height={h} viewBox={`0 0 ${boxWidth} ${h}`} style={{ display: "flex" }}>
      <path d={blockPath(block, st, boxWidth)} fill={st.color} fillOpacity={st.opacity ?? 1} />
    </svg>
  );
}

/**
 * Convenience: lay out + render in one go. With `tight` the SVG is only as wide
 * as the text (for buttons / pills); otherwise it spans `width`.
 */
export function Txt(props: {
  text: string;
  lang: Lang;
  style: TextStyle;
  width: number;
  maxLines?: number;
  minSize?: number;
  tight?: boolean;
}): { el: ReactElement; height: number; size: number; width: number } {
  const block = layout(props.text, props.lang, props.style, props.width, props.maxLines, props.minSize);
  const boxWidth = props.tight ? Math.ceil(block.width) + 2 : props.width;
  return { el: textSvg(block, props.style, boxWidth), height: block.height, size: block.size, width: boxWidth };
}
