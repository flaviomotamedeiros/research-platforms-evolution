import { getContainer } from '@/lib/glpi/server/container'
import { serviceDeskReport } from '@/lib/glpi/server/services/servicedesk-report.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** READ CONTRACT endpoint — the service-desk management report. */
export async function GET(req: Request) {
  try {
    const c = getContainer()
    requireAuth(req, c.jwt)
    return json(await serviceDeskReport(c))
  } catch (err) {
    return toErrorResponse(err)
  }
}
