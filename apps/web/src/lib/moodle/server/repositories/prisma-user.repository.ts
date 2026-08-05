import { User, type UserRepository } from '@rpe/moodle-core'
import type { PrismaClient } from '@/generated/moodle-client'

/** User repository backed by Neon via Prisma. passwordHash and role stay at the
 *  persistence layer (see AuthService) and are not part of the domain User. */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(r: {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    deletedAt: Date | null
  }): User {
    return User.reconstitute(r.id, {
      username: r.username,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      deletedAt: r.deletedAt ?? undefined,
    })
  }

  async findById(id: string): Promise<User | null> {
    const r = await this.prisma.user.findUnique({ where: { id } })
    return r ? this.toDomain(r) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.prisma.user.findFirst({ where: { email } })
    return r ? this.toDomain(r) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const r = await this.prisma.user.findUnique({ where: { username } })
    return r ? this.toDomain(r) : null
  }

  async save(user: User): Promise<void> {
    const data = {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      deletedAt: user.isDeleted ? new Date() : null,
    }
    await this.prisma.user.update({ where: { id: user.id }, data })
  }
}
