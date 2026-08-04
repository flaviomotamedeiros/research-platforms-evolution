import { getContainer } from '@/lib/server/container'
import { feedbackReport } from '@/lib/server/services/feedback-report.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** READ CONTRACT endpoint — the feedback report (report/myfeedback). */
export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    const report = await feedbackReport(c, payload.sub)
    return json(report)
  } catch (err) {
    return toErrorResponse(err)
  }
}
