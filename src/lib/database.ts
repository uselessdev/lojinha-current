import { PrismaClient } from "@prisma/client";
import { env } from "~/env.mjs";
export * from "@prisma/client";

const globalForPrisma = globalThis as { db?: PrismaClient };

export const db =
  globalForPrisma.db ||
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.db = db;
