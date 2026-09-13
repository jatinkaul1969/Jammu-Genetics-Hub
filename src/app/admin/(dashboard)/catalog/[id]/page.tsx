import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductEditForm } from "@/components/ProductEditForm";
import { ProductPriceEditor } from "@/components/ProductPriceEditor";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, labs] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { prices: true } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.lab.findMany({ orderBy: [{ isOwn: "desc" }, { name: "asc" }] }),
  ]);
  if (!product) notFound();

  const includes: string[] = JSON.parse(product.includesJson);

  return (
    <div>
      <Link href="/admin/catalog" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={15} /> Back to catalog
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <ProductEditForm
          productId={product.id}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          initial={{
            name: product.name,
            categoryId: product.categoryId,
            type: product.type,
            parameters: product.parameters,
            sampleType: product.sampleType,
            fasting: product.fasting,
            fastingHours: product.fastingHours,
            reportHours: product.reportHours,
            gender: product.gender,
            minAge: product.minAge,
            description: product.description,
            about: product.about,
            includes,
            popular: product.popular,
            badge: product.badge,
          }}
        />

        <ProductPriceEditor
          productId={product.id}
          labs={labs.map((l) => ({
            id: l.id,
            name: l.name,
            shortName: l.shortName,
            isOwn: l.isOwn,
            colorHex: l.colorHex,
            logoInitials: l.logoInitials,
          }))}
          prices={product.prices.map((p) => ({ labId: p.labId, price: p.price, mrp: p.mrp, testCode: p.testCode }))}
        />
      </div>
    </div>
  );
}
