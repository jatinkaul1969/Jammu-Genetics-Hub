import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/staff-auth";

const COOKIE_NAME = "jgh_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours
const OWNER_ID = "owner";

// The current credential source: the DB row once the owner has changed their
// password at least once, otherwise the ADMIN_PASSWORD env var. Returned as
// an opaque "seed" string used only to derive the session token below — it's
// never compared against directly for login (see checkAdminPassword).
async function credentialSeed(): Promise<string | null> {
  const stored = await prisma.ownerCredential.findUnique({ where: { id: OWNER_ID } });
  if (stored) return stored.passwordHash;
  return process.env.ADMIN_PASSWORD ?? null;
}

async function expectedToken() {
  const seed = await credentialSeed();
  if (!seed) return null;
  return createHash("sha256").update(`jgh-admin:${seed}`).digest("hex");
}

export async function adminConfigured() {
  return (await credentialSeed()) !== null;
}

export async function checkAdminPassword(password: string) {
  const stored = await prisma.ownerCredential.findUnique({ where: { id: OWNER_ID } });
  if (stored) return verifyPassword(password, stored.passwordHash);
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && password === expected;
}

export async function changeOwnerPassword(currentPassword: string, newPassword: string) {
  if (!(await checkAdminPassword(currentPassword))) {
    return { ok: false as const, error: "Current password is incorrect." };
  }
  if (newPassword.length < 6) {
    return { ok: false as const, error: "New password must be at least 6 characters." };
  }
  await prisma.ownerCredential.upsert({
    where: { id: OWNER_ID },
    update: { passwordHash: hashPassword(newPassword) },
    create: { id: OWNER_ID, passwordHash: hashPassword(newPassword) },
  });
  // Re-issue the session cookie against the new credential so the owner
  // isn't logged out by changing their own password mid-session.
  await createAdminSession();
  return { ok: true as const };
}

export async function createAdminSession() {
  const token = await expectedToken();
  if (!token) return;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const token = await expectedToken();
  if (!token) return false;
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === token;
}
