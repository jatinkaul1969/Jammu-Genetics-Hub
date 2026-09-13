import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStaff } from "@/lib/staff-session";
import { hashPassword, verifyPassword } from "@/lib/staff-auth";

// Self-service password change for a logged-in staff member. Requires the
// current password; the session cookie is just the account id, so nothing
// needs re-issuing.
export async function POST(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!verifyPassword(currentPassword, staff.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ ok: false, error: "New password must be at least 6 characters." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: staff.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}
