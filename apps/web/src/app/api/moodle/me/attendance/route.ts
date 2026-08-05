import { getContainer } from '@/lib/moodle/server/container'
import { myAttendance } from '@/lib/moodle/server/services/my-attendance.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** Per-course attendance summary for the authenticated student. */
export async function GET(req: Request) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    return json(await myAttendance(c, payload.sub))
  } catch (err) {
    return toErrorResponse(err)
  }
}
