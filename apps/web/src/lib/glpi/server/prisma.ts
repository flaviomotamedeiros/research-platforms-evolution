import { PrismaClient } from '@/generated/glpi-client'

const globalForPrisma = globalThis as unknown as { prisma_glpi?: PrismaClient }

export const prisma =
  globalForPrisma.prisma_glpi ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_glpi = prisma
