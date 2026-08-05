import { getContainer } from '@/lib/server/container'
import { listTickets } from '@/lib/server/services/ticket-query.service'
import { requireAuth, json, notFound, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const user = await c.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw notFound('User not found')
    return json(await listTickets(c, user.id, user.role))
  } catch (err) {
    return toErrorResponse(err)
  }
}
