import { PrismaClient } from '@/generated/moodle-client'

// Singleton PrismaClient — avoids exhausting Neon connections across hot reloads
// in dev and across warm serverless invocations in production.
const globalForPrisma = globalThis as unknown as { prisma_moodle?: PrismaClient }

export const prisma =
  globalForPrisma.prisma_moodle ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_moodle = prisma
