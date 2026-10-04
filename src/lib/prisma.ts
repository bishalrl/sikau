import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
  prismaPool?: Pool | null;
  prismaUrl?: string | null;
};

function createClient(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Prevent unhandled pool errors from crashing / overlaying the Next.js console.
  pool.on("error", (error) => {
    console.warn(`[prisma pool] ${error.message}`);
  });

  globalForPrisma.prismaPool = pool;

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    // Empty on purpose in dev: Prisma "error" logs become Next.js red overlays
    // even when the caller catches the failure and uses a fallback.
    log: [],
  });
}

async function disposeClient() {
  const client = globalForPrisma.prisma;
  const pool = globalForPrisma.prismaPool;
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaPool = undefined;
  globalForPrisma.prismaUrl = undefined;

  if (client) {
    await client.$disconnect().catch(() => undefined);
  }
  if (pool) {
    await pool.end().catch(() => undefined);
  }
}

function getClient() {
  const connectionString = process.env.DATABASE_URL?.trim() || null;

  if (globalForPrisma.prisma && globalForPrisma.prismaUrl !== connectionString) {
    void disposeClient();
  }

  if (globalForPrisma.prisma === undefined) {
    globalForPrisma.prismaUrl = connectionString;
    globalForPrisma.prisma = connectionString ? createClient(connectionString) : null;
  }

  if (!globalForPrisma.prisma) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
