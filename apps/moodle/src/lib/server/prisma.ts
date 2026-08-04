import { PrismaClient } from '@prisma/client'

// Singleton PrismaClient — avoids exhausting Neon connections across hot reloads
// in dev and across warm serverless invocations in production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
