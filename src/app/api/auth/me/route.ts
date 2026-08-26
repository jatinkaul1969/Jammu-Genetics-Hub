import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isMembershipActive } from "@/lib/collection-slots";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { name: user.name, phone: user.phone, age: user.age, membershipActive: isMembershipActive(user) },
  });
}
