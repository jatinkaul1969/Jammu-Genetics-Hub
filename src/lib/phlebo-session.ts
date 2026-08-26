import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "jgh_phlebo";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export async function createPhleboSession(phleboId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, phleboId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroyPhleboSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Re-checks `enabled` against the DB on every call, so disabling a phlebo
// account takes effect immediately rather than waiting for their session
// to expire.
export async function getCurrentPhlebo() {
  const store = await cookies();
  const phleboId = store.get(COOKIE_NAME)?.value;
  if (!phleboId) return null;
  const phlebo = await prisma.phlebo.findUnique({ where: { id: phleboId } });
  if (!phlebo || !phlebo.enabled) return null;
  return phlebo;
}
