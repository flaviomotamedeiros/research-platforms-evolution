import { getContainer } from '@/lib/moodle/server/container'
import { courseDetail } from '@/lib/moodle/server/services/course-detail.service'
import { requireAuth, json, toErrorResponse } from '@rpe/platform-kit'

export const runtime = 'nodejs'

/** Full course view: sections, materials, activities and lesson plan. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const c = getContainer()
    const payload = requireAuth(req, c.jwt)
    return json(await courseDetail(c, params.id, payload.sub))
  } catch (err) {
    return toErrorResponse(err)
  }
}
