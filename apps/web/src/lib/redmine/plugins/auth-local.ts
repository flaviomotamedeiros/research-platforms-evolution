import type { AuthPlugin, AuthResult, Credentials, Migration, UserRef } from '@rpe/plugin-sdk'
import type { PrismaClient } from '@/generated/redmine-client'
import bcrypt from 'bcryptjs'

/** Local username/password authentication (AuthPlugin contract). */
export function authLocalPlugin(prisma: PrismaClient): AuthPlugin {
  return {
    metadata: {
      id: 'auth_local',
      name: 'Local Authentication',
      version: '1.0.0',
      requires: '1.0.0',
      description: 'Username/password authentication against the platform user table.',
      author: 'research-platforms-evolution',
    },
    getMigrations(): Migration[] {
      return []
    },
    async authenticate(credentials: Credentials): Promise<AuthResult | null> {
      const user = await prisma.user.findUnique({ where: { username: credentials.username } })
      if (!user || user.deletedAt) return null
      const valid = await bcrypt.compare(credentials.password, user.passwordHash)
      if (!valid) return null
      const ref: UserRef = { id: user.id }
      return { user: ref, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() }
    },
    canChangePassword(): boolean {
      return true
    },
    async changePassword(user: UserRef, newPassword: string): Promise<void> {
      const passwordHash = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    },
  }
}
