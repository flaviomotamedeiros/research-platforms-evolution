import { getContainer } from '@/lib/redmine/server/container'
import { listIssues } from '@/lib/redmine/server/services/query.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer(); requireAuth(req, c.jwt)
    return json(await listIssues(c, params.id))
  } catch (err) { return toErrorResponse(err) }
}
