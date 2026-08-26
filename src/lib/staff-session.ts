import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "jgh_staff";
const MAX_AGE = 60 * 60 * 12; // 12 hours — same as the owner admin session

export async function createStaffSession(staffId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, staffId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroyStaffSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Re-checks `enabled` against the DB on every call (not just at login) so
// disabling a staff account from /admin/team takes effect immediately,
// without waiting for their session to expire.
export async function getCurrentStaff() {
  const store = await cookies();
  const staffId = store.get(COOKIE_NAME)?.value;
  if (!staffId) return null;
  const staff = await prisma.adminUser.findUnique({ where: { id: staffId } });
  if (!staff || !staff.enabled) return null;
  return staff;
}
