import { NextResponse } from "next/server";
import { destroyPhleboSession } from "@/lib/phlebo-session";

export async function POST() {
  await destroyPhleboSession();
  return NextResponse.json({ ok: true });
}
