import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/staff-auth";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !/^[6-9]\d{9}$/.test(phone) || !/^[a-z0-9._-]{3,32}$/.test(username) || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Name, valid 10-digit phone, username (3-32 chars) and password (min 6) are required." },
      { status: 400 }
    );
  }

  const existingUsername = await prisma.phlebo.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.json({ ok: false, error: "That username is already taken." }, { status: 409 });
  }
  const existingPhone = await prisma.phlebo.findUnique({ where: { phone } });
  if (existingPhone) {
    return NextResponse.json({ ok: false, error: "That phone number is already registered." }, { status: 409 });
  }

  const phlebo = await prisma.phlebo.create({
    data: { name, phone, username, passwordHash: hashPassword(password) },
  });

  return NextResponse.json({ ok: true, phlebo: { id: phlebo.id, name: phlebo.name, username: phlebo.username } });
}
