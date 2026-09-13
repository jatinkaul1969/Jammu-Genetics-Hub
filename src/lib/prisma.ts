import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// `max` caps how many raw Postgres connections THIS pool instance can open.
// pg's default is 10, and `next build` spins up several parallel workers,
// each with its own module-scoped Pool (they don't share one) — with ~100
// per-city/per-test static pages now generated, that easily exceeds the
// connection limit of a low-tier Prisma Postgres instance mid-build
// ("Too many connections... for role prisma_migration"). A small per-pool
// cap keeps total concurrent connections bounded regardless of worker count.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
