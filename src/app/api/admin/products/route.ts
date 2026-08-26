import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = body?.type === "PACKAGE" ? "PACKAGE" : "TEST";
  const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
  const parameters = Number(body?.parameters) || 1;
  const sampleType = typeof body?.sampleType === "string" ? body.sampleType.trim() : "Blood";
  const fasting = Boolean(body?.fasting);
  const fastingHours = fasting ? Number(body?.fastingHours) || 8 : null;
  const reportHours = Number(body?.reportHours) || 24;
  const gender = ["male", "female", "both"].includes(body?.gender) ? body.gender : "both";
  const minAge = Number(body?.minAge) || 0;
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const about = typeof body?.about === "string" ? body.about.trim() : "";
  const includes: string[] = Array.isArray(body?.includes)
    ? body.includes.filter((s: unknown) => typeof s === "string" && s.trim())
    : [];
  const popular = Boolean(body?.popular);
  const badge = typeof body?.badge === "string" && body.badge.trim() ? body.badge.trim() : null;

  if (!name || !categoryId || !description) {
    return NextResponse.json({ ok: false, error: "Name, category and description are required." }, { status: 400 });
  }

  // Only the general comparison labs get an auto-created ₹0 starting row —
  // specialty partner labs (genetic-testing partners) are sparse by design,
  // added deliberately per-product from the price editor instead.
  const labs = await prisma.lab.findMany({ where: { isSpecialtyPartner: false } });
  if (labs.length === 0) {
    return NextResponse.json({ ok: false, error: "No labs configured — seed labs first." }, { status: 400 });
  }

  let slug = slugify(name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      type,
      categoryId,
      parameters,
      sampleType,
      fasting,
      fastingHours: fastingHours ?? undefined,
      reportHours,
      gender,
      minAge,
      description,
      about: about || description,
      includesJson: JSON.stringify(includes),
      popular,
      badge: badge ?? undefined,
      prices: {
        create: labs.map((lab) => ({ labId: lab.id, price: 0, mrp: 0 })),
      },
    },
  });

  return NextResponse.json({ ok: true, product });
}
