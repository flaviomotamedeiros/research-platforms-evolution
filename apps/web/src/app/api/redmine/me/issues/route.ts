import { getContainer } from '@/lib/redmine/server/container'
import { listMyIssues } from '@/lib/redmine/server/services/query.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    return json(await listMyIssues(c, payload.sub))
  } catch (err) { return toErrorResponse(err) }
}
