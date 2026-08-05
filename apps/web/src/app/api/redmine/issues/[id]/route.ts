import { getContainer } from '@/lib/redmine/server/container'
import { issueDetail } from '@/lib/redmine/server/services/query.service'
import { requireAuth, json, notFound, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const user = await c.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw notFound('User not found')
    return json(await issueDetail(c, params.id, user.role))
  } catch (err) { return toErrorResponse(err) }
}
