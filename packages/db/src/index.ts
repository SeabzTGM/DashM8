import { PrismaClient } from "@prisma/client"

declare global {
  var __dashm8Prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.__dashm8Prisma ??
  new PrismaClient({
    log: ["warn", "error"]
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.__dashm8Prisma = prisma
}

export * from "@prisma/client"
