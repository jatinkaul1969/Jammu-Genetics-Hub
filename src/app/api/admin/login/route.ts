import { NextResponse } from "next/server";
import { adminConfigured, checkAdminPassword, createAdminSession } from "@/lib/admin-session";

export async function POST(req: Request) {
  if (!(await adminConfigured())) {
    return NextResponse.json(
      { ok: false, error: "Admin access isn't configured yet. Set ADMIN_PASSWORD in .env." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!(await checkAdminPassword(password))) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
