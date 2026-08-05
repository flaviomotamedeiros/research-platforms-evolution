import { PrismaClient } from '@/generated/redmine-client'
const globalForPrisma = globalThis as unknown as { prisma_redmine?: PrismaClient }
export const prisma =
  globalForPrisma.prisma_redmine ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_redmine = prisma
