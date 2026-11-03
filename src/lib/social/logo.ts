import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Optional real logo: drop a square PNG (transparent background works best) at
// src/assets/brand/logo.png and every poster picks it up automatically.
// Until then, posters use the same "JGH" monogram as the website header.
let cached: string | null | undefined;

export function customLogoUri(): string | null {
  if (cached !== undefined) return cached;
  const file = join(process.cwd(), "src/assets/brand/logo.png");
  cached = existsSync(file) ? `data:image/png;base64,${readFileSync(file).toString("base64")}` : null;
  return cached;
}
