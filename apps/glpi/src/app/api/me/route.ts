import { getContainer } from '@/lib/server/container'
import { requireAuth, json, notFound, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const row = await c.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!row) throw notFound('User not found')
    return json({
      id: row.id,
      username: row.username,
      name: `${row.firstName} ${row.lastName}`,
      email: row.email,
      role: row.role,
    })
  } catch (err) {
    return toErrorResponse(err)
  }
}
