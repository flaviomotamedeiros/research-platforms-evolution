import { getContainer } from '@/lib/redmine/server/container'
import { projectReport } from '@/lib/redmine/server/services/project-report.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'
export const runtime = 'nodejs'
export async function GET(req: Request) {
  try {
    const c = getContainer(); requireAuth(req, c.jwt)
    const url = new URL(req.url)
    const projectId = url.searchParams.get('project') ?? undefined
    return json(await projectReport(c, projectId))
  } catch (err) { return toErrorResponse(err) }
}
