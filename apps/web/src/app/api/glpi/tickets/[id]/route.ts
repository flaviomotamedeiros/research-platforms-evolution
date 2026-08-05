import { getContainer } from '@/lib/glpi/server/container'
import { ticketDetail } from '@/lib/glpi/server/services/ticket-query.service'
import { requireAuth, json, notFound, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const user = await c.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw notFound('User not found')
    return json(await ticketDetail(c, params.id, user.id, user.role))
  } catch (err) {
    return toErrorResponse(err)
  }
}
