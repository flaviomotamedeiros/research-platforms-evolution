import { unauthorized } from '@rpe/platform-kit'
import type { Container } from '../container'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: { id: string; username: string; name: string; email: string; role: string }
}

/**
 * Login orchestrator. Mirrors the NestJS AuthService as a plain function:
 * tries each registered auth plugin, and on success issues a JWT pair and
 * returns a user DTO. No business logic lives here — password verification is
 * the plugin's responsibility, token signing is the platform-kit's.
 */
export async function login(
  c: Container,
  credentials: { username: string; password: string },
): Promise<LoginResult> {
  for (const plugin of c.plugins.listAuthPlugins()) {
    const result = await plugin.authenticate(credentials)
    if (!result) continue

    const row = await c.prisma.user.findUnique({ where: { id: result.user.id } })
    if (!row) continue

    const tokens = c.jwt.issue({ sub: row.id, email: row.email })
    return {
      ...tokens,
      user: {
        id: row.id,
        username: row.username,
        name: `${row.firstName} ${row.lastName}`,
        email: row.email,
        role: row.role,
      },
    }
  }

  throw unauthorized('Invalid username or password')
}
