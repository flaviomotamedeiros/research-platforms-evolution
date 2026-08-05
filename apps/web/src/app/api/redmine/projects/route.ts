import { getContainer } from '@/lib/redmine/server/container'
import { listProjects } from '@/lib/redmine/server/services/query.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
export async function GET(req: Request) {
  try {
    const c = getContainer(); requireAuth(req, c.jwt)
    return json(await listProjects(c))
  } catch (err) { return toErrorResponse(err) }
}
