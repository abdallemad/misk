import { PrismaClient } from "@prisma/client"

/**
 * The one Prisma client for the whole app.
 *
 * `next dev` hot-reloads modules on every save. A plain `new PrismaClient()`
 * at module scope would therefore open a fresh connection pool on each
 * reload and exhaust the database's connection limit within a few edits, so
 * in development the instance is parked on `globalThis` — which survives
 * module reloads — and reused. In production the module is evaluated once,
 * so no global is needed and none is set.
 *
 * Import it as `import { db } from "@/lib/db"`. Only the service layer
 * should reach for this — see docs/folder-structure.md.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
